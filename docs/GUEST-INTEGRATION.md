# Real guest migration: integration for Claude

Use [the browser API client](../sdk/guest-client.mjs) from the separately owned
frontend. It has no DOM or storage dependencies and uses existing endpoints.
The public GitHub Pages deployment cannot execute an IMAP migration. The live
workspace must be served with the API on the same HTTPS origin (the Go binary
already serves the embedded site). Never send credentials to an arbitrary
user-supplied API URL or weaken Secure cookies to enable hosted browser tests.

## Existing blockers in web/lib/workspace.ts (reviewed at 370bf69)

- `session()` runs asynchronously while POSTs can already start. Await it.
- `es.onmessage` never receives named `snapshot` and `migration` events.
- Errors are `{error:{code,message}}`, not top-level `code` or a string `error`.
- `API.start({})` discards the selected mode. Build and pass all options.
- Folder rows/counts and speed/ETA still include mock data. The folders API
  returns names and delimiters only; do not invent byte sizes or message counts.
- Preserve selected folders and destinationSubfolder in the start payload.
- `finished` can mean failure or cancellation. Read the authoritative job view.
- `stop()` currently suppresses errors and closes the stream before acceptance.
  Keep watching until the view is terminal; show an unconfirmed stop as pending.
- Store only the returned job ID (optionally in sessionStorage). On refresh use
  GET and a new event stream; never persist passwords or replay POST /api/jobs.
- Put connection error messages and folder names into textContent, not innerHTML.

## Requests and lifecycle

1. `await client.session()` creates an anonymous session; no registration UI.
2. `client.check(endpoint)` and `client.folders(endpoint)` accept
   `{host,port,security,username,password}`. Host can be a public hostname/IP.
   Automatic UI defaults are TLS/993 or STARTTLS/143; the API requires explicit
   port/security and never silently disables certificate verification.
3. `client.start({source,destination,options})` returns HTTP 202 and a job view.
   Set `syncFlags:true,preserveDates:true` for normal copies (omitted booleans
   are false). Include `folders:[exactNames]` and `destinationSubfolder` as needed.
   Omitted/empty folders means ALL folders; prohibit starting with an explicitly
   empty selection in the UI. A parent selection does not imply descendants.
4. Optional modes: `dryRun`, `justLogin`, `justFolderSizes`, `justFolders`.
   Sizes mode is an asynchronous job whose diagnostics report native inventory;
   there is no structured per-folder size API or reusable estimate token yet.
   Normal hosted jobs already perform worker-owned whole-mailbox quota admission
   before copying. Show an estimating phase, not a fake numerical estimate.
5. Strict mirror requires both `strictMirror:true` and
   `strictMirrorConfirmed:true`, after the two UI confirmations. Clear them
   when source/destination changes. Never automatically resubmit this request.
6. `client.watch(id,{snapshot,event,connection,error})` listens to named events.
   Replace the full view and recent logs on snapshot. For migration events,
   render `phase,currentFolder,progress,indeterminate,transferred,skipped,bytes`.
   An absent field is not an explicit zero. No guaranteed ETA/speed field exists.
7. `await client.cancel(id)` acknowledges the request, not completed shutdown.
   Continue monitoring until status is `completed`, `failed`, or `cancelled`.
8. On refresh `client.get(savedId)` restores the owned view, then `watch` resumes
   observation. `client.list()` returns this guest's retained jobs. A 404 means
   the job is unavailable to this session (including expiry); clear the stored
   ID and do not claim success. A lost cookie cannot be recovered from an ID.

Example adapter use (render functions belong to the frontend):

```js
import { createGuestClient } from '../sdk/guest-client.mjs';
const client = createGuestClient();
await client.session();
const job = await client.start({source, destination, options});
sessionStorage.setItem('movemailbox.job', job.id); // ID only
renderView(job);
const disconnect = client.watch(job.id, {
  snapshot: renderView,
  event: renderMigrationEvent,
  connection: renderConnectionState,
  error: renderError,
});
// On component teardown, disconnect() stops observation, not the migration.
```

The adapter makes no automatic POST retries. If a network failure obscures the
start response, inspect the guest job list before the user retries. This API
does not yet offer a client idempotency key for lost start acknowledgements.
Map `APIError.code` into RU/EN/UK UI strings and retain the status for retry
guidance. HTTP 429 means capacity/rate limit; 503 means a service is unavailable;
403 requires investigation or a renewed guest session, not bypassing protection.

## Free limit and acceptance

The deployed worker enforces decimal 5,000,000,000 bytes for the entire source
mailbox, independent of selected folders. The execution guard works at whole
message boundaries and is not a strict network traffic cap. See
[quota semantics](MAILBOX-QUOTA.md). A rejected transfer must show failed status.

Exit gate with Claude's integrated frontend: real check + folder discovery,
selected-folder/subfolder copy, live progress/logs, reload while running,
cancellation, repeat without duplicates, and a visible failed-job result.
Confirm no mock counts/ETA, no credentials in browser storage, and no console
errors under deployed CSP. Current SDK tests verify transport behavior; they do
not constitute completion of this browser gate. Off-site backups are deferred
by the owner and are not prerequisites to implementing this adapter.
