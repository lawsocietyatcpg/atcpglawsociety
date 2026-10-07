-- Run once after deploying the six-column Google Sheet sync.
-- Existing members were synced before Public display name was added as column F.
-- Requeue their current profiles without changing registration details.
update public.member_sheet_queue
set version = version + 1,
    attempts = 0,
    next_attempt_at = now(),
    last_error = null,
    updated_at = now();
