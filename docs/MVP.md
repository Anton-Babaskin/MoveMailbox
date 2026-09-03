# MoveMailbox MVP scope

The MVP proves one promise: a person can safely copy an IMAP mailbox without
learning command-line options, while an administrator can run the same product
locally or on a server.

## Product offer

The website should show three choices, not three recurring subscriptions:

| Offer | Customer | MVP commercial model |
| --- | --- | --- |
| Desktop / self-hosted | Individual and administrator who supplies the machine | Free and unlimited; donations welcome |
| Online transfer | Person who wants the transfer to continue on our server | Guest start; up to 5 GB free; one-time payment above the limit |
| Business | IT team migrating several mailboxes | Contact/quote pilot; batch tools and fixed plans follow usage data |

Prices and size tiers remain configuration, not code or irreversible promises.
The first launch should measure completion rate, server cost, support time and
failed-provider rate before fixed business plans are published.

## Identity model

Opening the online tool creates an opaque guest session automatically. The
session owns its jobs and is protected by secure cookies, CSRF checks and rate
limits. The free flow never shows a MoveMailbox sign-in or registration wall:
the visitor enters only the credentials required by the source and destination
mailboxes.

A verified email is optional for free job recovery and completion notification.
A one-time paid transfer may use a passwordless email magic link for payment and
recovery. A full MoveMailbox account is reserved for persistent paid history and
business workspaces. Mailbox credentials must never be placed in the session,
browser storage, logs, analytics or account profile.

## MVP completion gate

The public MVP is ready for a limited pilot when all of the following pass:

- Windows, Linux and Docker builds complete a real two-provider migration;
- jobs survive application restarts without storing mailbox passwords;
- every API action and event stream is isolated to its owner session;
- credentials are encrypted for a short lifetime and available only to a
  leased worker;
- size estimation enforces the configured free limit before transfer;
- progress, cancellation, retries and actionable error messages work;
- metadata backup/restore, monitoring, privacy terms and deletion rules are
  tested on the pilot VPS.

Subscriptions, OAuth for every provider, team roles, reseller tools and a large
admin panel are deliberately outside the first pilot. They follow real demand.
