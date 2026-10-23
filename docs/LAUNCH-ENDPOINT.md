# Launch endpoint: preserve the existing VPN

Owner confirmed on 2026-10-23 that public `46.4.100.22:443` still serves Amnezia.
Do not forward it to this VM or change VPN/virtualization-host rules. The
already-tested `18443 -> VM:443` route can serve HTTPS without buying an IP.
TLS is still required and fully verified; a different port is not a security
boundary. Some corporate networks block nonstandard ports.

Proposed application origin: `https://app.movemailbox.com:18443`. The existing
`https://staging.movemailbox.com:18443` remains the closed pilot until the new
origin is explicitly configured and verified. Do not rename it just in a link:
certificate names, nginx authority and API AllowedHosts must all agree.

## Owner inputs only

1. Confirm the proposed app subdomain, or retain staging for the first pilot.
2. For app, add only this Namecheap DNS record: type `A`, host `app`, value
   `46.4.100.22`, TTL Automatic. DNS records contain no port. Keep apex/www,
   GitHub Pages, mail records, TXT verification and existing routing unchanged.
3. Choose the certificate-validation route described below. Do not send a DNS
   account password/API key in chat.
4. Provide operator SMTP host/port/login/sender/recipient; enter its password
   through the VM's [hidden-input configuration](SMTP-ALERTS.md).

## Agent work and gates

- Check actual authoritative/public DNS and no conflicting AAAA record.
- Obtain a certificate for the approved hostname using the existing ACME
  account or owner-approved setup; do not expose private keys or bypass trust.
- Preserve the existing pilot authority/certificate/access gate for rollback.
  Apply only reviewed idle-VM proxy/API changes, after validating matched
  certificate/key, nginx syntax and the exact browser authority including port.
- Verify normal public TLS, unknown-host rejection, guest-cookie ownership,
  CSRF, Origin port, SSE/reload/cancel and selected-folder mail integrity.
  Avoid replaying destructive mirror and do not load-test mail providers.
- Keep application origin `noindex`; the marketing/SEO website remains on
  `https://movemailbox.com`. Connecting its CTA belongs to the website owner.
- Remove the invitation gate only with explicit owner approval, after acceptance,
  quotas and external operator notifications are confirmed. A port/domain
  decision alone does not authorize opening password intake to everybody.

## Certificate renewal: two alternatives

**HTTP-01:** reserve public TCP 80 for the app challenge, after the owner proves
it is unused and approves a separate route to the VM. This leaves VPN 443 alone
and permits automated webroot renewal. Do not assume port 80 is free or change
the virtualization host from this task.

**DNS-01:** no additional inbound port is required. Manual TXT validation works
for an initial pilot, but is not automatic renewal. Unattended renewal requires
a supported owner-authorized DNS API/hook or narrowly delegated challenge zone.
The existing staging certificate's manual DNS mode must not be called automated.
See [Certbot's guide](https://eff-certbot.readthedocs.io/en/stable/using.html#manual).

After either route, install a reviewed deploy hook that validates certificate
and key, refreshes the proxy's protected copies, tests nginx and reloads it.
Confirm the actually served fingerprint/expiry; renewed source files alone do
not complete the deployment. Keep expiry monitoring and SMTP alerts active.

For a conventional public URL without `:18443`, use a separately approved IP or
TLS-capable gateway later. This is an infrastructure choice, not a reason to
rewrite the migration engine or interrupt the existing VPN.
