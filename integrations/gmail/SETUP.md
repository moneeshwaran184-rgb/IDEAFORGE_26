# Gmail complaint intake — jdhyanesh28@gmail.com

This code is prepared locally; no mailbox authorization, live SQL migration or Edge Function deployment has been performed.

1. In the existing Supabase project, run supabase/email-intake.sql LAST in SQL Editor. It requires the existing department, ownership, priority, suggestion-relevance and super-admin migrations. Do not rerun older trigger migrations afterward. The migration preserves the citizen checks and adds a service-role-only atomic email import. Back up your database before applying production migrations.
2. Create a long random secret (at least 32 characters). In Supabase Edge Functions > Secrets add EMAIL_INGEST_SECRET. Keep the existing GEMINI_API_KEY. Never put either value in VITE variables or GitHub.
3. Create an Edge Function named ingest-complaint-email and paste supabase/functions/ingest-complaint-email/index.ts. Disable legacy Verify JWT for this function: it authenticates the dedicated x-email-ingest-secret header itself. Deploy. CLI alternative: supabase functions deploy ingest-complaint-email --project-ref xlwkpvjxeremgjzsodfj --no-verify-jwt
4. Sign into script.google.com as jdhyanesh28@gmail.com, create a project and paste integrations/gmail/Code.gs into Code.gs. In Services (+), enable Gmail API (the Advanced Gmail service). If using a custom Google Cloud project, enable its Gmail API too.
5. Project Settings > Script Properties: add INGEST_URL = https://xlwkpvjxeremgjzsodfj.supabase.co/functions/v1/ingest-complaint-email and EMAIL_INGEST_SECRET = the same secret from step 2. These properties are available to script editors, so keep editing access restricted.
6. Run setup once and authorize the Gmail and external-request scopes. It verifies the signed-in mailbox and creates a five-minute trigger. No web-app deployment is needed. Only inbox emails received after setup are imported. Script property START_EPOCH can be set to an earlier Unix timestamp to intentionally backfill older mail.
7. Send a NEW email from another account to jdhyanesh28@gmail.com. Subject: [Water] Leaking public pipe. Body: explain the issue and street/area/landmark. Run syncComplaintEmails manually for the first check; otherwise wait for the trigger. Refresh Email inbox in the app.
8. Accepted messages must appear in Accepted complaints, All reports, and the Water department dashboard. Send unrelated content to check Rejected emails. Run the sync twice to check no extra report is created. Failure states appear in Pending / retry; inspect Apps Script Executions and Supabase Edge Function logs. A message is labelled imported only after a terminal accepted/rejected response.
9. Test ordinary website complaint/suggestion submission and department review after the migration to confirm existing workflows remain functional. Live database checks require your Supabase access and have not been run locally.
10. The local preview includes the UI. For Vercel, push/deploy the updated frontend separately and retain its VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY settings. GitHub/Vercel deployments do not deploy this SQL or function automatically.

Behavior and limits:
- Explicit [roads], [electricity], [sanitation], [water], [transport], [parks], [safety], [general] or [accessibility] in the subject determines routing after relevance acceptance. Otherwise Gemini infers routing; ambiguity goes to general.
- A clear civic complaint AND a usable incident location are required. Missing/vague locations, unrelated messages and unclear problems are rejected with a reason. The location must be supported by a quote from the subject/body. No GPS coordinates or real-world verification are invented. Email reports do not appear on the heat map until coordinates are verified.
- Plain-text body only; attachments are not imported. Each body is limited to the first 30,000 characters. The script processes up to five messages per run; monitor retry backlogs and service quotas.
- Raw emails/senders remain under Super Admin RLS. Public reports contain an AI-summarized version with explicit email/phone redaction. AI redaction can miss personal information: review with representative emails before inviting public use.
- Email senders are not linked to existing citizen accounts. No auto-replies or completion emails are sent by this integration. Existing signed-in citizen notifications continue unchanged.
- setup starts processing ALL new inbox messages from this mailbox. Use it as the dedicated complaint inbox.

References:
https://developers.google.com/apps-script/guides/triggers/installable
https://developers.google.com/apps-script/guides/properties
https://supabase.com/docs/guides/functions/auth

Validation update: redeploy ingest-complaint-email using the updated index.ts. No additional SQL is needed if email-intake.sql is already applied. Previously accepted/rejected emails are not reclassified; send new test emails. AI/network failures remain pending/retry, not rejected.
