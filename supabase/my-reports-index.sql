-- Optional performance improvement. The existing department-workflow.sql
-- already supplies citizen_id and assigns it from auth.uid() on submission.
create index if not exists reports_citizen_created_idx
on public.reports(citizen_id, created_at desc);
-- Old reports with citizen_id NULL require verified manual ownership mapping.
-- Do not assign them based on names, public contact fields, or the current login.
