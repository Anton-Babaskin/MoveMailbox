# Support

MoveMailbox is an engineering preview maintained by Anton Babaskin.
There is no promised response-time SLA or production support contract.

## Start here

1. Use the [setup guide](docs/GETTING-STARTED.md) and [configuration reference](docs/CONFIGURATION.md).
2. Try demo mode to separate launcher/UI problems from IMAP-provider problems.
3. Check the [release notes](https://github.com/Anton-Babaskin/MoveMailbox/releases)
   for the version you actually run.
4. Search [existing issues](https://github.com/Anton-Babaskin/MoveMailbox/issues)
   before opening a bug report.

## Windows does not start

Extract the ZIP completely. Run `START-DEMO-DEBUG.cmd` from the archive.
Keep the launcher open and inspect `movemailbox.log` locally. Administrator access
is not normally needed. Real mode requires a separately installed imapsync.

## Connection or migration fails

Include the app version, OS/architecture, local or hosted mode, imapsync version,
a redacted error code and minimal reproduction steps. Provider names are useful;
real mailbox addresses and server IPs are generally unnecessary for a public issue.

Do not disable TLS verification to make a certificate error disappear.
Do not repeat strict mirror while investigating an unexplained failure.
Preserve the source and verify destination contents before deleting any mail.

## Never publish

Mailbox passwords, app passwords, access/session tokens, cookies, private keys,
`.env` files, databases/WAL, message bodies, private attachments or raw dumps.
Review every log and screenshot manually before sharing, even if the app redacts
known secrets. Use synthetic examples such as `user@example.com`.

## Vulnerabilities

Use [private vulnerability reporting](https://github.com/Anton-Babaskin/MoveMailbox/security/advisories/new).
Do not file a public issue or include a proof of concept with live credentials.
See [SECURITY.md](SECURITY.md).

## Ideas and product questions

Use the feature-request template for a specific problem or workflow.
The [roadmap](docs/ROADMAP.md) distinguishes implemented work from launch gates.
