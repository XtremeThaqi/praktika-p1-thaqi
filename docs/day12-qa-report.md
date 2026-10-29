# Day 12 quality assurance report — 29 October 2026

## Scope and environment

Reviewed the 12-page project specification, project guidance, public API and upload notes, current source, and acceptance history. This run used Windows, PHP 8.2.12, Composer 2.8.9, Node 22.23.1, npm 10.9.0, MariaDB 10.4.32 through Laravel's MySQL driver, and the local React/Vite and Laravel servers. Automated database tests used `lipjan_directory_test`. The ordinary `lipjan_directory` database was read only.

The 26 published seed profiles are illustrative. Their unknown contacts and exact locations remain empty; the site does not represent an official municipal register. A disposable administrator and business were used only in the isolated test database for the browser acceptance flow. Their uploaded files and rows were removed, then the test database was returned to its initial empty, migrated state.

## Automated checks

| Check | Result |
| --- | --- |
| `php artisan test` | Passed: 90 tests, 878 assertions, 14 MariaDB-specific checks skipped under SQLite |
| `php vendor/bin/phpunit --configuration phpunit.mysql.xml` | Passed: 104 tests, 892 assertions, no skips, isolated MariaDB database |
| `php vendor/bin/pint --test` | Passed |
| `composer validate --strict` | Passed |
| `composer check-platform-reqs` | Passed |
| `php artisan migrate:status` | Passed: all 14 migrations recorded as run on the development database |
| `npm test` | Passed: 21 tests |
| `npm run build` | Passed: Vite 7.3.7 built 58 modules in 5.44 seconds |

The first MariaDB command could not connect because the local server was stopped; it passed after MariaDB was started. The first production build was blocked by the execution environment's config-file access; an approved rerun passed. Neither was a failing test assertion. `php artisan db:show --counts` could not read `performance_schema.session_status` with the application database user; migration status and direct read-only counts succeeded.

## Functional and browser regression

- The development database has 30 businesses: 26 published, two drafts and two archived. The public API returned 26 in pages of 12, 12 and two. It returned six categories, four settlements, ten services and currently two selected public placements from six stored advertisements. Draft, archived and nonexistent slugs returned HTTP 404.
- Homepage categories, six regular business cards and a separately labelled advertisement loaded from the API. The directory showed the refreshed names and photographs. Search for `Furra`, including mixed case and surrounding spaces through the API, returned `Furra Pranvera`. Category and settlement were combined in the browser; the selected values and result survived refresh. The backend suite covers service combinations, stable sorting and invalid parameters. Direct API checks showed A–Z, Z–A, newest, page two and page three, and HTTP 422 for invalid sort or page.
- The seeded website-only browser filter correctly showed zero with a useful empty state. The published-hours filter showed 18 and did not claim an “open now” status. The isolated published fixture with `https://example.com` made the website filter return exactly one record, proving the filter works without inventing a public website. Clear filters restored results.
- A normal published profile showed its full description, services, ordered hours, local illustrative image and truthful missing-location message. The isolated fixture was created as a draft through the administrator UI; premature publication showed field errors. After its category, settlement, phone, email, address, service, hours and test coordinates were saved, publication put it in public search. Its map marker popup showed the same name and address, linked to its profile, and generated directions to `42.52,21.12`. The profile exposed `tel:+38300000000`, `mailto:fixture@example.invalid` and the same directions coordinates. Changing the phone in the administrator form changed the public link to `tel:+38300000001`. Archiving kept the record in the admin list and made its public profile unavailable.
- Two valid JPEGs were uploaded to the isolated fixture and served as `image/jpeg` with the entered alternative text. The first upload stored correctly, but an unwritable XAMPP temporary directory prepended a PHP warning to the JSON response, causing the browser to report an unreadable response. Running the PHP serving process with a writable `upload_tmp_dir` made the second browser upload complete cleanly. This is a local setup issue; the production upload temporary directory must also be writable.
- An invalid administrator login produced a generic Albanian error. A disposable administrator logged in, saw database-backed dashboard counts, logged out and was redirected to login on direct protected-route navigation. Guest dashboard, business and category API requests returned HTTP 401. The full suites cover login throttling, CSRF, non-admin denial, taxonomy and advertisement CRUD, validation and upload authorization. Those administrative flows were not all repeated through the browser on Day 12.
- Temporarily stopping the local API produced safe directory error and filter-retry states. Restarting it and using both retry controls restored 26 results and lookup options. The normal development API was restored after the isolated browser run.
- Homepage, directory, profile and contact were checked at 320, 375, 390, 768, 1024 and 1440 CSS pixels during this or the prior acceptance run. On Day 12, the profile, directory, contact, admin login, dashboard, business list, category, settlement, service, advertisement list and advertisement editor had no document-level horizontal overflow at those widths. Desktop homepage and directory, mobile directory and profile, and desktop/mobile advertisement editor screenshots were visually inspected in the local browser. Mobile navigation opened and exposed its links; mobile filters expanded. No console errors or warnings were recorded in the final admin-login inspection. These are desktop-browser viewport checks, not physical-device or Safari results.

## Security and data integrity

- The MariaDB suite covers foreign keys, uniqueness, restricted lookup deletion, service links, business statuses, publication validation, overnight hours, advertisement eligibility and deterministic ties, UTC conversion and daylight-saving ambiguity, repeatable seeders and preservation of custom records. Exact advertisement expiry and replacement were also exercised in the earlier Day 9 browser acceptance run; Day 12 reran the automated checks but did not repeat the open-page clock boundary in a browser.
- `SafeImage` checks the server MIME, allowed extension, image metadata, container ending, 5 MB size, 10,000-pixel dimensions and 25-million-pixel area. Existing tests exercise disguised scripts, SVG/HTML, malformed content, mismatches, size limits, authorized uploads and ownership. The code does not fully decode or re-encode images; `upload-security.md` now describes that accurately. Apache/Nginx execution protections are deployment instructions and were not verified against a configured production server.
- All 26 local presentation photographs were present. The 32 development database image references (26 business images and six advertisement images) resolved to existing files. Only `backend/.env.example` matched the tracked environment-file scan; actual `.env`, dependencies, generated build output and private-key patterns were not tracked. No seed files or ordinary development records were changed.

## Open items and assessment

| Severity | Item | Next action |
| --- | --- | --- |
| High for final acceptance | T-06 remains incomplete: browser links and one controlled marker were verified, but no call, email handler or external directions application was launched, and no verified real business record was available. | Test permitted handlers on a suitable device with a verified record; retain Pending until the complete scenario is observed. |
| High for submission usefulness | The public Contact page explicitly has no confirmed administrator contact destination. | Obtain and configure a real project contact channel before final delivery. |
| Medium environment | XAMPP's `C:\xampp\tmp` was not writable for the serving PHP process. | Configure a writable `upload_tmp_dir` in the actual local and deployment PHP server configurations; retest a real upload there. |
| Unverified environment | MySQL 8, production Apache/Nginx upload execution rules, physical mobile devices/Safari and the deadline timezone were not tested or confirmed. | Verify in the target deployment and with the mentor before submission. |

No critical source-code defect or failed test assertion was found. The application is ready for final documentation and presentation preparation, with T-06, the contact destination and target-environment checks clearly open. It is not yet defensible to claim complete final acceptance or production readiness. Against the specification's grading weights, functionality has the strongest current test evidence; code quality, Git workflow and documentation are supported by focused source review and passing checks; UI/UX was inspected at responsive widths; the final presentation itself remains untested.
