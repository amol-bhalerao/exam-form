# Publish the HSC/SSC Exam Portal on Hostinger

Everything is already built. You only upload, unzip, and fill in **one** value (the database password).

Files in this folder:

| File | What it is |
|---|---|
| `hsc-app.zip` | The application, libraries and your **production `.env`** (Google + Cashfree keys already filled in). Goes **outside** `public_html`, so nobody can download it. |
| `public_html.zip` | Only the public files (CSS, JS, fonts, `index.php`). Goes **inside** `public_html`. |
| `hsc_exam_live.sql` | The database: 4,073 colleges/schools, subjects, website pages, and one `superadmin` login. |

Final layout on the server:

```
/home/u441114691/domains/hscexam.in/
├── hsc-app/          ← from hsc-app.zip   (app, .env, vendor, storage)
└── public_html/      ← from public_html.zip (index.php, .htaccess, build/, storage/)
```

---

## Step 1 — Back up the old site (5 min)

1. hPanel → **Websites → hscexam.in → Files → File Manager**.
2. Open `domains/hscexam.in/`. Rename `public_html` to `public_html_old` (right-click → Rename).
   Create a new empty folder named `public_html`.
3. hPanel → **Databases → phpMyAdmin** → open the old database `u441114691_exam` → **Export** → *Go*. Keep the file.
   (The new portal uses a **new** database, so the old one stays untouched.)

## Step 2 — PHP version (1 min)

hPanel → **Advanced → PHP Configuration** → choose **PHP 8.3** (8.2 also works) → Save.
In the *PHP extensions* tab make sure these are ticked: `fileinfo`, `intl`, `mbstring`, `pdo_mysql`, `openssl`, `curl`, `zip`, `gd` (they are on by default).

## Step 3 — New database (3 min)

1. hPanel → **Databases → Management** → *Create a new MySQL database*:
   * Database name: `examv2` → becomes **`u441114691_examv2`**
   * Username: `examv2` → becomes **`u441114691_examv2`**
   * A strong password — **write it down**.
2. Click **Enter phpMyAdmin** next to the new database → **Import** → choose `hsc_exam_live.sql` → **Go**.
   You should see about 30 tables, and `institutes` should have 4,073 rows.

> Different names? Then change `DB_DATABASE` and `DB_USERNAME` in `.env` (Step 5).

## Step 4 — Upload the files (5–10 min)

1. File Manager → open `domains/hscexam.in/` → **Upload** `hsc-app.zip` → right-click it → **Extract** → extract **here** (into `domains/hscexam.in/`). You now have a folder `hsc-app`. Delete the zip.
2. Open `domains/hscexam.in/public_html/` → **Upload** `public_html.zip` → right-click → **Extract** here. You now have `index.php`, `.htaccess`, `build/`, `storage/` inside `public_html`. Delete the zip.

   *Hidden files:* if you don't see `.htaccess`, click the ⚙ settings icon in File Manager and enable "Show hidden files".

## Step 5 — Put the database password in `.env` (1 min)

File Manager → `domains/hscexam.in/hsc-app/.env` → right-click → **Edit**. Find

```
DB_PASSWORD="PUT-YOUR-NEW-DATABASE-PASSWORD-HERE"
```

and type the password from Step 3 between the quotes. Save.

Everything else is already set: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://hscexam.in`, a new `APP_KEY`, secure cookies, uploads into `public_html/storage`, your Google and Cashfree keys, and **new private staff sign-in addresses** (see the bottom of this guide).

## Step 6 — HTTPS (1 min)

hPanel → **Security → SSL** → make sure the certificate for `hscexam.in` is *Active*. (The `.htaccess` already sends every visitor to `https://`.)

## Step 7 — Google sign-in (3 min)

[console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials** → open your OAuth client → **Authorised redirect URIs** → add exactly:

```
https://hscexam.in/auth/google/callback
```

Also add `https://hscexam.in` under *Authorised JavaScript origins*. Save. If the consent screen is in "Testing", click **Publish app** so every student can sign in.

## Step 8 — Cashfree (important)

Your current Cashfree keys are **TEST (sandbox) keys**. On the live site the portal refuses to take payments with test keys, so nobody can mark a form "paid" without real money. Students will see "Online payment is not available right now" until you switch:

1. Cashfree dashboard (complete KYC if asked) → switch to **Production** → **Developers → API Keys** → generate keys.
2. In `hsc-app/.env` replace `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` with the production keys and set `CASHFREE_ENV=production`.
3. Cashfree → **Developers → Webhooks** → add `https://hscexam.in/payments/cashfree/webhook` (events: *Payment success*, *Payment failed*).
4. In Cashfree, whitelist the domain `hscexam.in` if it asks.

Want to try the full flow on the live site with test cards first? Set `CASHFREE_ALLOW_SANDBOX_ON_LIVE=true`, test, then set it back to `false` **before** real students pay (and delete those test forms).

## Step 9 — First sign-in and setup (10 min)

1. Open `https://hscexam.in` — the new website should load.
2. Super admin: `https://hscexam.in/<ADMIN_LOGIN_PATH>` → username `superadmin` + the one-time password you received → set your own password.
3. **Users and logins → New login**: create the board login(s) (role *Board*) and a login for each college/school (*Institute* — every institute page has a "Create login" button). Each new user must change the password at first sign-in.
4. Board login → **Exams and fees → New exam** → dates, fees for each candidate type → tick **Published**.
5. **Site settings**: site name, helpline phone/email. **Pages / Notices**: edit the starter pages, add notices.

Share each private address only with that group:

| Who | Address |
|---|---|
| Super admin | `https://hscexam.in/` + `ADMIN_LOGIN_PATH` from `.env` |
| Board | `https://hscexam.in/` + `BOARD_LOGIN_PATH` |
| Colleges / schools | `https://hscexam.in/` + `INSTITUTE_LOGIN_PATH` |
| Students | `https://hscexam.in/login` (Google) |

---

## If something goes wrong

| What you see | Fix |
|---|---|
| **500 / "Server Error"** | Open `hsc-app/storage/logs/laravel-YYYY-MM-DD.log` (latest lines). Usually a wrong `DB_PASSWORD` / `DB_DATABASE`. |
| Page has no styling | `public_html/build/` is missing — extract `public_html.zip` again inside `public_html`. |
| "Failed opening required …/hsc-app/vendor/autoload.php" | `hsc-app` is not next to `public_html`. Fix the folder layout, or edit the `$app_path` line in `public_html/index.php`. |
| Google says *redirect_uri_mismatch* | The redirect URI in Step 7 must be exactly `https://hscexam.in/auth/google/callback`. |
| Photos don't show | `public_html/storage/` must exist and be writable (permissions 755). |
| 419 "Page expired" on sign-in | Clear browser cookies; make sure you open the site with `https://`. |

**Updating later:** upload only the changed files into `hsc-app/` (never overwrite `.env` or `storage/`). If you changed CSS/JS, also replace `public_html/build/`.

**Optional (SSH):** hPanel → Advanced → SSH Access. Then `cd domains/hscexam.in/hsc-app && php artisan optimize` makes pages a little faster; run `php artisan optimize:clear` after every update.
