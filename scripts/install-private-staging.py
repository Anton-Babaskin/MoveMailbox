#!/usr/bin/env python3
"""Install a private single-VM stage; never open public HTTP or rotate existing keys.

Ubuntu/Linux root only. Requires Docker, Compose and nft already installed.
Owns only explicitly named configuration files and the movemailbox-staging project.
Does not resize disks, change SSH authentication, edit Proxmox or issue certificates.
"""
import argparse
import base64
import ipaddress
import json
import os
import secrets
import stat
import subprocess
from pathlib import Path

SOURCE = Path("/opt/movemailbox")
CONFIG = Path("/etc/movemailbox")
ENV = CONFIG / "staging.env"
BRIDGE = "br-movemailbox"
SUBNET = "172.30.80.0/28"
BLOCKED = ("0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8",
           "169.254.0.0/16", "172.16.0.0/12", "192.0.0.0/24",
           "192.0.2.0/24", "192.168.0.0/16", "198.18.0.0/15",
           "198.51.100.0/24", "203.0.113.0/24", "224.0.0.0/4", "240.0.0.0/4")


def run(*args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=180)
    if result.returncode:
        # Docker config/keygen output and environments may contain secrets.
        raise RuntimeError("Operation failed (output withheld): " + args[0])
    return result.stdout


def safe_parent(path):
    for parent in (path.parent, *path.parents):
        if parent.is_symlink():
            raise RuntimeError("Refuse linked configuration parent")
        if parent.exists():
            mode = parent.stat()
            if mode.st_uid != 0 or mode.st_mode & 0o022:
                raise RuntimeError("Configuration parent is not root-controlled")


def write_owned(path, content, mode=0o644):
    safe_parent(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
    safe_parent(path)
    if path.is_symlink():
        raise RuntimeError("Refuse linked target")
    if path.exists():
        current = path.stat()
        if not stat.S_ISREG(current.st_mode) or current.st_uid != 0:
            raise RuntimeError("Refuse unowned target")
        if stat.S_IMODE(current.st_mode) != mode or path.read_text() != content:
            raise RuntimeError("Existing configuration differs; explicit update required")
        return
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode)
    os.fchmod(fd, mode)
    with os.fdopen(fd, "w") as file:
        file.write(content)
        file.flush()
        os.fsync(file.fileno())


def firewall(nat_public_ip):
    address = ipaddress.ip_address(nat_public_ip)
    if address.version != 4 or not address.is_global:
        raise ValueError("NAT public address must be a global IPv4")
    blocked = ", ".join((*BLOCKED, str(address)))
    return f"""# Managed by MoveMailbox private staging. No global ruleset flush.
add table inet movemailbox_staging
flush table inet movemailbox_staging
table inet movemailbox_staging {{
  set blocked4 {{
    type ipv4_addr
    flags interval
    elements = {{ {blocked} }}
  }}
  chain forward {{
    type filter hook forward priority -10; policy accept;
    iifname != "{BRIDGE}" return
    ct state established,related counter return
    meta nfproto ipv6 counter reject
    ip saddr 172.30.80.2 ip daddr 172.30.80.3 tcp dport 8090 counter return
    ip daddr {{ 1.1.1.1, 1.0.0.1 }} udp dport 53 counter return
    ip daddr {{ 1.1.1.1, 1.0.0.1 }} tcp dport 53 counter return
    ip daddr @blocked4 counter reject
    ip saddr 172.30.80.3 tcp dport {{ 143, 993 }} counter return
    counter reject
  }}
  chain input {{
    type filter hook input priority -10; policy accept;
    iifname != "{BRIDGE}" return
    ct state established,related counter return
    counter reject
  }}
}}
"""


def compose_args():
    return ["docker", "compose", "--project-name", "movemailbox-staging",
            "--env-file", str(ENV), "-f", str(SOURCE / "compose.yaml"),
            "-f", str(SOURCE / "deploy/staging/compose.override.yaml"), "--profile", "hosted"]


def install(image, nat_public_ip):
    if os.name != "posix" or os.geteuid() != 0:
        raise RuntimeError("Run as root on the staging VM")
    os.umask(0o077)
    for path in (SOURCE / "compose.yaml", SOURCE / "deploy/staging/compose.override.yaml"):
        safe_parent(path)
        if path.is_symlink() or not path.is_file() or path.stat().st_uid != 0:
            raise RuntimeError("Source files must be root-owned regular files")
    image_info = json.loads(run("docker", "image", "inspect", image))[0]
    image_id = image_info["Id"]
    if not image_id.startswith("sha256:") or image_info["Config"]["User"] != "nobody:nogroup":
        raise RuntimeError("Expected the hardened MoveMailbox image")
    run("nft", "--version")
    # Refuse overlapping interfaces/routes on first installation.
    if not ENV.exists():
        names = run("docker", "network", "ls", "--format", "{{.Name}}").splitlines()
        if "movemailbox-staging" in names:
            raise RuntimeError("Existing staging network: investigate before adopting")
        for name in names:
            for item in json.loads(run("docker", "network", "inspect", name)):
                for config in item.get("IPAM", {}).get("Config", []) or []:
                    if config.get("Subnet"):
                        network = ipaddress.ip_network(config["Subnet"])
                        if network.version == 4 and network.overlaps(ipaddress.ip_network(SUBNET)):
                            raise RuntimeError("Staging subnet overlaps a Docker network")
        for route in json.loads(run("ip", "-j", "-4", "route", "show", "table", "all")):
            destination = route.get("dst", "default")
            if destination != "default" and ipaddress.ip_network(destination, strict=False).overlaps(ipaddress.ip_network(SUBNET)):
                raise RuntimeError("Staging subnet overlaps a host route")
    nft = firewall(nat_public_ip)
    write_owned(Path("/etc/modules-load.d/movemailbox-staging.conf"), "br_netfilter\n")
    write_owned(Path("/etc/sysctl.d/90-movemailbox-staging.conf"),
                "net.bridge.bridge-nf-call-iptables = 1\nnet.bridge.bridge-nf-call-ip6tables = 1\n")
    run("modprobe", "br_netfilter")
    run("sysctl", "-q", "-p", "/etc/sysctl.d/90-movemailbox-staging.conf")
    write_owned(CONFIG / "egress.nft", nft)
    run("nft", "--check", "-f", str(CONFIG / "egress.nft"))
    if not ENV.exists():
        generated = run("docker", "run", "--rm", "--network", "none", "--read-only",
                        "--cap-drop=ALL", image_id, "keygen")
        keys = dict(line.split("=", 1) for line in generated.splitlines() if "=" in line)
        required = {"MOVEMAILBOX_WORKER_PUBLIC_KEY", "MOVEMAILBOX_WORKER_PRIVATE_KEY", "MOVEMAILBOX_WORKER_TOKEN"}
        if not required.issubset(keys):
            raise RuntimeError("Unexpected keygen format")
        values = {key: keys[key] for key in sorted(required)}
        values.update({
            "MOVEMAILBOX_STAGING_IMAGE": image_id,
            "MOVEMAILBOX_PUBLIC_MODE": "true",
            "MOVEMAILBOX_SESSION_SECRET": base64.b64encode(secrets.token_bytes(48)).decode(),
            "MOVEMAILBOX_ALLOWED_HOSTS": "staging.movemailbox.com,localhost:18080,127.0.0.1:18080",
            "MOVEMAILBOX_DEMO": "false",
            "MOVEMAILBOX_MAX_MAILBOX_BYTES": "5000000000",
        })
        write_owned(ENV, "".join(f"{key}={value}\n" for key, value in values.items()), 0o600)
    else:
        safe_parent(ENV)
        if ENV.is_symlink() or not ENV.is_file() or ENV.stat().st_uid != 0 or stat.S_IMODE(ENV.stat().st_mode) != 0o600:
            raise RuntimeError("Existing secrets file must be root-owned mode 0600")
        if f"MOVEMAILBOX_STAGING_IMAGE={image_id}\n" not in ENV.read_text():
            raise RuntimeError("Image changed; use an explicit drained update workflow")
    # The egress service must precede Docker's automatic container restart at boot.
    write_owned(Path("/etc/systemd/system/movemailbox-egress.service"), """[Unit]
Description=MoveMailbox private staging egress policy
Before=docker.service
After=network-pre.target
[Service]
Type=oneshot
ExecStart=/usr/sbin/modprobe br_netfilter
ExecStart=/usr/sbin/sysctl -q -p /etc/sysctl.d/90-movemailbox-staging.conf
ExecStart=/usr/sbin/nft -c -f /etc/movemailbox/egress.nft
ExecStart=/usr/sbin/nft -f /etc/movemailbox/egress.nft
RemainAfterExit=yes
[Install]
WantedBy=multi-user.target
""")
    write_owned(Path("/etc/systemd/system/docker.service.d/movemailbox-egress.conf"), """[Unit]
Requires=movemailbox-egress.service
After=movemailbox-egress.service
""")
    command = " ".join(compose_args())
    write_owned(Path("/etc/systemd/system/movemailbox-staging.service"), f"""[Unit]
Description=MoveMailbox closed staging API and worker
Requires=docker.service movemailbox-egress.service
After=docker.service movemailbox-egress.service
[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/movemailbox
ExecStart={command} up -d --no-build
ExecStop={command} stop
TimeoutStartSec=180
TimeoutStopSec=150
[Install]
WantedBy=multi-user.target
""")
    run(*compose_args(), "config", "--quiet")
    run("systemctl", "daemon-reload")
    run("systemctl", "enable", "--now", "movemailbox-egress.service")
    run("systemctl", "enable", "--now", "movemailbox-staging.service")
    print("Private stage installed. API: 127.0.0.1:8080; worker not published.")
    print("Secrets stay in /etc/movemailbox/staging.env (root, 0600).")
    print("HTTPS, NAT/DNS, off-site backup and public admission remain separate gates.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--nat-public-ip", required=True)
    args = parser.parse_args()
    install(args.image, args.nat_public_ip)
