# ATC Penang Law Society — Website handover / 网站交接

Status (7 October 2026): the production code is in the society-owned GitHub repository. The Supabase tables have been created. The society-owned member Sheet has been shared with the dedicated sync service account, but its key, Vercel project, private connections, Google Sheet sync and public-domain sign-in have **not yet been verified live**. Do not announce member registration until the production checklist passes.

## Where everything belongs / 资产归属

| Item | Society-owned location | Purpose |
| --- | --- | --- |
| Source code | [lawsocietyatcpg/atcpglawsociety](https://github.com/lawsocietyatcpg/atcpglawsociety), folder `GitHub-Upload-kCxiWc/law-society` | Design and feature changes |
| Hosting | Vercel account `lawsocietyatcpg-1274` | Public website and secure server functions |
| Database and uploaded files | Supabase organisation `ATC Penang Law Society`, project `vkkrppojhwnpalnepznv` | Shared content, member records, uploaded photos/PDFs, administrator login |
| Google sign-in | Google Cloud project `atc-penang-law-society` under the society Google account | Member identity |
| Member register | [Private Google Sheet](https://docs.google.com/spreadsheets/d/1fz3hP77YinkBP4QDOfcVFzVXADpYEnUMR2F0MAznG08/edit) | Full name, intake, email and phone; column E is the internal member ID |
| Sheet sync identity | Google Cloud service account `law-society-member-sheet-sync@atc-penang-law-society.iam.gserviceaccount.com` | Editor access to the private member Sheet only; no project-wide IAM role |

The website must not rely on a committee member's personal GitHub, Vercel or Google account. The source folder is nested: Vercel **Root Directory** must be `GitHub-Upload-kCxiWc/law-society`.

## Everyday editing / 平时怎样改内容

Open the published site and choose **Admin** in the footer. Use the society administrator username and password. The first administrator setup also requires signing in with the verified society Google account. The credentials must be kept in the society's password manager and handed to the next authorised committee securely—never in this repository, a public Sheet or chat.

**Home & branding** changes hero, logo and colours; **About & committee** changes committee and term; **Events** changes activities, photos and PDFs; **Legal topics** changes explainers, Instagram and Meet links; **Contact** changes contact links; **Moderation** reviews discussions; **Account & backups** changes administrator credentials and exports a content backup. Text changes go live when saved; feature/design code changes still need a GitHub update and Vercel deployment.

The Moot page is currently a labelled layout preview. Keep it until the committee explicitly approves hiding it; only then turn off its switch in Admin → Events. A planned Moot event should otherwise remain grey and non-clickable.

Members sign in with Google, then enter their actual full name, intake/study level, phone and public display name; email comes from Google. The website saves the private fields in Supabase and copies name/intake/email/phone into the private Sheet. If Google Sheets is temporarily unavailable, a pending queue keeps the registration; Admin → Member register → **Retry now** retries it. The daily scheduled retry is a fallback, not a substitute for checking the Sheet.

## Production connections / 正式上线连接

Keep these Vercel environment variables in Vercel, **never in GitHub**: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_BOOTSTRAP_EMAIL`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB`, `GOOGLE_SERVICE_ACCOUNT_JSON`, and `CRON_SECRET`. The example file `.env.example` contains names and placeholders only.

The Supabase database definitions are versioned in `supabase/migrations/`. The Google service account should be given access **only** to the society's private member Sheet. Supabase Auth → URL Configuration must include the final Vercel origin, and Google Auth Platform Branding must use the actual public home/privacy/terms links before opening Google login beyond test users. Never paste a secret key into the public website, a screenshot or a GitHub file.

## Changing committee / 换届时

1. Export a fresh content ZIP under **Admin → Account & backups** and store it in a society-controlled private location. Export the member Sheet separately; the website ZIP does **not** contain private member records or passwords.
2. Confirm the incoming committee can sign in to society-owned GitHub, Vercel, Supabase, Google Cloud and the private Sheet. Enable 2FA on every owner account; preserve recovery codes securely.
3. In Admin, update the academic term, committee names, Hero, event dates, topic schedule, email/Instagram and any Meet links. Review old topics and events rather than deleting useful archives.
4. Change the administrator username/password in Admin and verify the old session is revoked. Remove former committee members' account access and rotate keys if they had copies.
5. Test one member registration with an authorised test account, check its Sheet row, then remove the test record from both systems through the approved privacy process. Test one content edit, one photo/PDF, one backup download and one restore exercise on a non-production copy.
6. Keep a record of the current site URL, domain renewal, service plan, designated account custodians and backup location in the society's private handover pack—not this public repository.

The footer creator credit is intentionally not editable in Admin. It is attribution, not an immutable legal lock: someone with source-code access can change it.

## Before announcing the public website / 公布前验收

- [ ] Vercel project deploys from the society repository and correct Root Directory.
- [ ] Production environment variables are complete; no real secret is in GitHub.
- [ ] Site, `/api/state`, Google sign-in and member profile form work on the final HTTPS domain.
- [ ] A test registration appears in Supabase and exactly once in the private Sheet; Admin displays zero pending syncs afterward.
- [ ] Society administrator can edit Hero, add an event, attach a PDF, add a legal topic, and see changes from a different device.
- [ ] Private fields and admin-only actions are inaccessible to an ordinary visitor.
- [ ] Privacy and community terms pages match committee-approved policy; Google consent configuration uses the final links.
- [ ] Public announcement and collection of real member information happen only after these checks.
