# MoveMailbox: shared project instructions

## Product and scope

- GitHub `Anton-Babaskin/MoveMailbox` is the canonical code/handoff repository.
  The owner works on two computers. Treat this file as portable project memory,
  not as a promise to synchronize chat history, secrets or local runtimes.
- Prioritize the utility/backend MVP, reliable migrations and security. Free
  hosted transfers are guest-first; accounts belong to paid services. Keep the
  public website's promises consistent with implemented backend behavior.
- Ownership (owner instruction, 2026-09-12): Claude maintains the website,
  frontend, design, content and SEO. This agent maintains the migration utility,
  backend/API, workers, technical tests and test VM. Do not change website or
  frontend files as part of backend tasks; document API integration changes for
  Claude instead. Shared documentation changes must preserve the other work.
- Read `docs/HANDOFF.md`, `docs/ROADMAP.md` and relevant test/runbook documentation
  before continuing work. Reply to the owner in Russian.

## Start of an implementation task: synchronize safely

1. Resolve the repository root, inspect `git status --short`, current branch,
   upstream, remotes and local-only commits. Verify the origin repository above.
2. Run `git fetch --all --prune --tags`. Check origin's fetch refspec; it should
   fetch all branch refs. Fetching all branches does NOT mean merging branches
   together or overwriting their local counterparts. Do not force-update tags.
3. Read the fetched handoff and inspect the active PR/branch status. If the last
   PR was merged, update local main with `--ff-only` and start a new feature
   branch from it. Otherwise continue the handoff branch, tracking its origin
   branch when first checking it out on another computer.
4. Fast-forward the chosen branch only when safe. Preserve all unrelated edits,
   untracked artifacts and local-only commits. If histories diverge, a merge
   would overlap dirty files, or the intended branch is ambiguous, explain the
   exact conflict and request direction. Never silently stash, reset, force-push,
   delete branches, discard files or merge every remote branch into main.
5. Re-read instructions/handoff on the selected branch after synchronization.
   Authentication/network failures are blockers to synchronization, not grounds
   to claim the other computer's changes have been received.

## End of an implementation task: leave a usable handoff

- The owner authorizes scoped commits and pushes of work requested in this
  project. Informational/review-only requests do not authorize unrelated writes.
- Run relevant checks, inspect the complete staged diff and check for secrets.
  Stage explicit paths, never indiscriminately `git add .`. Do not commit mailbox
  passwords, keys, real message content, databases/WAL, logs, runtime directories,
  generated archives or an unrelated nested repository such as `website/`.
- Update `docs/HANDOFF.md`: completed work, actual test evidence and limitations,
  active branch/PR, blockers, and the next two concrete steps. Do not store
  credentials, machine-specific paths or unverified success claims there.
- Commit the task changes, fetch once more, then push only the intended branch
  without force. If another computer advanced it, inspect the divergence first.
  Verify that the remote branch SHA matches local HEAD. Open/update the task PR;
  never merge it, publish a release or deploy production without that authority.
- Report CI for the exact pushed SHA; distinguish local checks from CI and
  queued/running checks from success. If pushing is blocked, report local SHA,
  unpushed work and the action needed. Do not claim synchronization succeeded.
- Final response: what changed; checks/results; branch/commit/PR and sync status;
  remaining limitations; next two steps for approval. Preserve unrelated local
  artifacts and explicitly note that they were not synchronized.

## Technical safety and verification

- Keep IMAP TLS verification, public-target/SSRF checks, guest ownership, CSRF,
  quotas and encrypted credential envelopes enabled. Test-only fault hooks belong
  in isolated harnesses, not production bypasses.
- Never automatically replay destructive strict mirror. Never promise universal
  exactly-once behavior based on one provider fixture.
- Real mailbox tests require explicit authorization and disposable accounts.
  Read secrets from the test environment/secret mechanism; never print them or
  put them in GitHub. Do not reuse credentials from public documentation.
- Run `go test ./...`, `go vet ./...`, formatting checks, Python harness tests
  and relevant Docker drills. Linux CI runs `go test -race ./...` and dependency
  scanning; consult `.github/workflows/ci.yml` for pinned tool versions.
- Do not interpret missing WSL/Docker/tools as successful testing. Avoid filling
  the host disk: ENOSPC drills use an explicitly validated bounded test tmpfs.
