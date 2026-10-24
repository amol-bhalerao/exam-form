# HSC / SSC Exam Form Portal

A new exam-form system for HSC (Std XII) and SSC (Std X) candidates, colleges/schools and the board,
with a public website the super admin manages.

| Who | Signs in at | What they do |
|---|---|---|
| **Student / parent** | `/login` — Google account | Add one or more students, fill the exam form (regular, repeater/backlog, improvement, isolated, private), choose subjects, pay the fee, print the form and receipt, track status |
| **Institute** (college / school) | private address, e.g. `/college-desk-8p3` | Check paid forms, correct mistakes (every change is logged), verify and forward to the board or send back to the student, list the subjects it teaches, keep teacher / examiner details |
| **Board** | private address, e.g. `/board-desk-4m9` | Dashboard and charts, create exams with dates and fees per candidate type, approve / return / reject forms, review teachers and examiners, institute records, notices, CSV exports |
| **Super admin** | private address, e.g. `/control-room-7k2` | All institutes (4,073 seeded: 1,317 HSC colleges + 2,756 SSC schools), CSV import, logins, subjects and streams, **unlimited website pages** with SEO, notices, media library, site settings, payments, activity log |

The staff addresses are never linked on the website. Change them in `.env` before going live and share each one only with that group.

* Languages: Marathi (default), English and Hindi — switch from the top bar.
* Students see only the subjects their college has listed for their stream; if the college has listed none, all subjects are shown. The 2019 GR subject rules are checked live.
* Fee is collected through Cashfree. Payment marks the form "with college" automatically.
* Prints: A4 exam form with photo, signature and a QR code that anyone can scan at `/verify` to confirm the form is genuine; fee receipt; bulk printing for colleges and the board.

---

## 1. Run it on your computer (XAMPP)

Needs XAMPP with PHP 8.2 or newer (the current XAMPP 8.2.x is fine).

1. The files must be in `C:\xampp\htdocs\HSC-exam` (this folder).
2. Open the **XAMPP Control Panel** and start **Apache** and **MySQL**.
3. Double-click **`setup-windows.bat`**. It unpacks `vendor.zip`, creates `.env`, the `hsc_exam` database, all tables, the institute list and test logins.
4. Open **http://localhost/HSC-exam**

Test logins (only created when `APP_ENV=local`):

| Role | Address | Username | Password |
|---|---|---|---|
| Super admin | http://localhost/HSC-exam/control-room-7k2 | `superadmin` | `Password@123` |
| Board (HSC) | http://localhost/HSC-exam/board-desk-4m9 | `board2` | `Password@123` |
| Board (SSC) | same | `board_ssc` | `Password@123` |
| Institute (HSC college) | http://localhost/HSC-exam/college-desk-8p3 | `INSTITUTE1` | `Password@123` |
| Institute (SSC school) | same | `SCHOOL1` | `Password@123` |
| Student | http://localhost/HSC-exam/login | "Use the demo student account" button | — |

Payments: with no Cashfree keys and `ALLOW_TEST_PAYMENTS=true`, a "Simulate successful payment" button appears so you can test the whole flow.

**No command line?** Instead of step 3 you can unzip `vendor.zip` here, copy `.env.example` to `.env`, open phpMyAdmin, create a database `hsc_exam` (collation `utf8mb4_unicode_ci`) and import `database/sql/hsc_exam_local_testing.sql`. Then set `APP_KEY` in `.env` (any `base64:` key from `php artisan key:generate --show`) and `APP_ENV=local`.

If PHP shows an extension error, open `C:\xampp\php\php.ini`, remove the `;` in front of `extension=fileinfo`, `extension=gd`, `extension=intl`, `extension=mbstring`, `extension=zip`, `extension=pdo_mysql`, and restart Apache.

---

## 2. Publish on Hostinger

1. **hPanel → Databases → MySQL**: create a database and user. Note the names and password.
2. **phpMyAdmin**: import `database/sql/hsc_exam_live.sql` (institutes, subjects, pages and one `superadmin` login — no test accounts). The one-time password for `superadmin` was given to you with this package; you must change it at the first sign-in.
3. **File Manager**: upload the contents of this folder into `public_html` (or a sub-folder) and unzip `vendor.zip` there. If your plan lets you point the domain at the `public/` folder, do that — otherwise the included `.htaccess` + `index.php` keep everything outside `public/` private.
4. Copy `.env.example` to `.env` and set at least:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://hscexam.in
APP_KEY=base64:...            # php artisan key:generate --show (on your PC) and paste
DB_DATABASE=u441114691_exam    # your hPanel values
DB_USERNAME=u441114691_exam
DB_PASSWORD=...
SESSION_SECURE_COOKIE=true
ADMIN_LOGIN_PATH=...           # your own secret words
BOARD_LOGIN_PATH=...
INSTITUTE_LOGIN_PATH=...
GOOGLE_CLIENT_ID=... / GOOGLE_CLIENT_SECRET=...
CASHFREE_APP_ID=... / CASHFREE_SECRET_KEY=... / CASHFREE_ENV=production
ALLOW_TEST_PAYMENTS=false
ALLOW_DEMO_STUDENT_LOGIN=false
```

5. Uploaded photos and signatures: with SSH run `php artisan storage:link` once. Without SSH, set `UPLOADS_IN_PUBLIC=true` and create the folder `public/storage`.
6. Sign in at `https://your-domain/<ADMIN_LOGIN_PATH>`, change the password, then under **Users and logins** create the board logins and a login for each institute (there is a "Create login" link on every institute).
7. Board: create the exam under **Exams and fees** and tick **Published** — students can then apply.

### Google sign-in
Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID* (Web application).
Authorised redirect URI: `https://your-domain/auth/google/callback`.

### Cashfree
Cashfree dashboard → Developers → API keys (use sandbox keys first).
Add the webhook `https://your-domain/payments/cashfree/webhook` (payment success / failed events).

---

## For developers

* Laravel 12, PHP 8.2+, MySQL / MariaDB, Blade + Tailwind CSS 4 + Alpine.js (built files are in `public/build`; run `npm install && npm run build` after changing CSS/JS).
* `php artisan test` — 59 feature and unit tests (SQLite in memory).
* Seed again from scratch: `php artisan migrate:fresh --seed` (institutes come from `database/data/institutes_*.csv`).
* Workflow: draft → (fee paid) with college → verified (forwarded) → approved / returned / rejected. Every step is stored in the form's history and the activity log.
