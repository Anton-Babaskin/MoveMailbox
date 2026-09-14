# Private VM security: settings and operational meaning

Verified on 2026-09-14, Ubuntu 24.04.5 LTS. This is a configuration audit,
not forensic evidence that a host has never been compromised.

## SSH admission

The reviewed profile is [the SSH snippet](../deploy/staging/00-movemailbox-hardening.conf).
It was installed as `/etc/ssh/sshd_config.d/00-movemailbox-hardening.conf`.

- Password and keyboard-interactive login disabled; public-key login enabled.
  An internet password-guessing attempt cannot authenticate through these methods.
- Direct root login disabled. Administrators log in under their named account.
- Agent/X11/tunnel-device and reverse TCP forwarding disabled. Local TCP
  forwarding permits only `127.0.0.1:8080` and `localhost:8080` for API access.
- Three authentication attempts per connection, 30-second authentication grace,
  bounded unauthenticated connections, and verbose SSH audit logging.

Before applying, a new independent key login and sudo were verified. A timed
rollback was armed, then `sshd -t`, effective `sshd -T`, reload, and another new
key login succeeded. Only then was the rollback timer stopped. The root-owned
`/root/mm-ssh-hardening-rollback.sh` remains available for this installation;
it moves the added snippet aside and reloads the validated previous policy.
It deliberately preserves existing SSH keys, port and socket configuration.

Observed acceptance: key login plus sudo succeeded; a client with public-key
authentication disabled was refused with `Permission denied (publickey)`;
the permitted API tunnel returned HTTP 200; forwarding to `1.1.1.1:443` was
administratively denied. Both application containers remained healthy.

Each administrator computer needs its own authorized key. Never sync private
keys through Git. Losing the only private key requires recovery-console access.
Forwarding restrictions do not constrain a user with an unrestricted shell and
sudo: that user can create other network clients or change the policy.

## Verified existing layers

- Only SSH listened on wildcard addresses in the VM socket inventory. The API
  was loopback-only; worker and Docker API had no published TCP listener.
- Both application containers used `docker-default` AppArmor, non-privileged
  mode, read-only root filesystems, all capabilities dropped and
  `no-new-privileges`. Docker reported builtin seccomp enabled.
- Secret directory permissions were root-owned 0700; the environment file was
  root-owned 0600. Authorized keys were 0600 in a 0700 SSH directory.
- Ubuntu unattended security updates and daily timers were active. A package
  simulation using the current package lists showed no upgrades, with `fwupd`
  kept back. This does not prove every third-party package or image is patched.

## Remaining risks and next work

The deployment user has `NOPASSWD: ALL` and membership in `lxd`. Its SSH key
therefore grants administrative control. Separate normal administrator access
from a restricted deployment identity before broader operation. Do not remove
the working recovery path until the replacement workflow has been tested.

The container egress policy remains in place. A separate reviewed default-deny
VM input firewall and external login-alert destination remain future work.
Read-only filesystems and encryption at rest do not protect plaintext being
used by a compromised worker/root process. Private-key protection, patches,
least privilege and short credential retention are complementary controls.

Off-site backup is deferred by the owner. Do not block unrelated hardening on it.

## Primary references

- [Ubuntu OpenSSH configuration](https://ubuntu.com/server/docs/how-to/security/openssh-server/)
- [Ubuntu automatic security updates](https://ubuntu.com/server/docs/how-to/software/automatic-updates/)
- [Docker Engine security model](https://docs.docker.com/engine/security/)
- [Docker daemon access](https://docs.docker.com/engine/security/protect-access/)
