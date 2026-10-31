# Final acceptance audit — 31 October 2026

Source of truth: `Projekti-01-Katalogu-i-bizneseve.pdf`, version 1.0, 6 October 2026, all 12 pages. The specification copy reviewed for this audit is in the student's local Downloads folder; it is not tracked in this repository. This report distinguishes today's checks from earlier recorded acceptance evidence.

## A. Executive summary

The core public directory, administrator workflows, seeded data, maps and advertisements are functional in the tested local environment. No failing regression test or confirmed critical source-code defect was found. The student authorized `anejiakneji55@outlook.com`; [PR #17](https://github.com/XtremeThaqi/praktika-p1-thaqi/pull/17) configures it on the public Contact page, but remains unmerged. Final submission is **not yet ready**: mentor access, the deadline timezone and the required demo/presentation have not been confirmed. T-06 remains pending for device-level telephone, email and directions handling.

## B. PDF compliance matrix

`PASS` means direct runtime evidence from this audit or a dated prior acceptance run still applicable to unchanged code. `PARTIAL` means functioning pieces with a material verification gap. `NOT TESTED` is not a failure claim.

| PDF requirement | Scope | Implementation location | Functional evidence | Result / remaining issue |
| --- | --- | --- | --- | --- |
| Anonymous public homepage and clear purpose | Required | `frontend/src/pages/HomePage.jsx`, `SiteLayout.jsx` | Loaded locally today with live categories, six business cards and disclosure. | PASS |
| Search from homepage by button or Enter | Required | `SearchForm.jsx`, `DirectoryPage.jsx` | T-01 browser evidence and current live search for Mangall. | PASS |
| Dynamic homepage categories and selected businesses | Required | `HomePage.jsx`, lookup API | Six categories and six varied cards loaded from current database today. | PASS |
| Sponsored homepage placement distinct from organic results | Required | `Advertisement.jsx`, `AdvertisementController.php` | Current browser displayed a labeled “Reklamë” placement; ad tests passed. | PASS |
| Footer information and a usable correction/advertising contact | Required | `SiteLayout.jsx`, `ContactPage.jsx` | Footer truthfully identifies a student project. PR #17 shows the authorized email for registrations, corrections, updates and advertising; rendered component output has matching visible text and `mailto:` target. | PARTIAL — PR #17 is open, so current `main` still has the old notice; interactive email handler not tested. |
| Directory cards, photos/fallback, concise text and total | Required | `BusinessCard.jsx`, `DirectoryPage.jsx` | Current directory showed photographed illustrative cards and appropriate photo fallback; 29 published results. | PASS |
| Name/description search, case and whitespace handling | Required | `BusinessController.php`, `BusinessFiltersTest.php` | Full backend suites passed; T-01 browser case/whitespace evidence recorded. | PASS |
| Dynamic category, settlement and service filters; website and hours filters | Required | `DirectoryPage.jsx`, `BusinessController.php` | Current website filter returned precisely the three sourced listings; T-02/T-03 and filter tests passed. | PASS |
| Combined filters, A–Z/Z–A/newest sorting, 12-item pages and correct total | Required | `BusinessIndexRequest.php`, `BusinessController.php`, `DirectoryPage.jsx` | 29 current published records span three pages; T-02/T-04 and backend pagination tests passed. | PASS |
| Filter URL restoration, reset and clear empty state | Required | `DirectoryPage.jsx` | T-05/T-07 browser checks recorded on 22/29 October; frontend and backend tests still pass. | PASS (carried evidence) |
| Loading, no-result and network retry states | Required | `DirectoryPage.jsx`, `HomePage.jsx` | Prior browser failure/retry and empty-state checks; current loading state observed. | PASS (carried evidence) |
| Profile description, category, services and known/unknown hours | Required | `BusinessPage.jsx`, `BusinessResource.php` | Mangall, Neptun and Ramjani profiles loaded today; absent hours/services explicitly shown as unpublished. | PASS |
| Business gallery and accessible photo fallback | Required | `BusinessPage.jsx`, `BusinessCard.jsx` | Prior isolated browser upload/gallery run; current sourced profiles show fallback instead of an invented image. | PASS (carried evidence) |
| Profile phone, email, website and directions actions | Required where data exists | `BusinessPage.jsx`, `frontend/src/lib/business.js` | Current stored values matched generated `tel:`, `mailto:`, HTTP(S) and coordinates in directions URLs. | PARTIAL — external handlers were not launched on a suitable device; T-06 Pending. |
| Draft/archived profiles unavailable publicly | Required | `BusinessController.php`, `PublicBusinessTest.php` | Backend tests cover published-only index and direct 404; earlier browser archive flow passed. | PASS |
| Profile pin at stored point and visible attribution | Required | `BusinessMap.jsx` | Three sourced profiles each showed a Leaflet marker and matching directions coordinates today. | PASS — points are sourced, not surveyed entrances. |
| Directory map uses only the active result page and has useful popups | Required | `DirectoryPage.jsx`, `BusinessMap.jsx` | First page had 0/12 valid locations; website-filtered page had exactly 3/3 markers. Mangall popup matched its name, address and destination. | PASS |
| Missing coordinates never create a false pin; map failure preserves content | Required | `BusinessMap.jsx`, `BusinessLocationPicker.jsx` | Current fictional cards lacked false pins; T-14 tile-failure/retry browser run is recorded from 23 October. | PASS (failure simulation carried) |
| Two labeled advertisement placements, priority, schedule, expiry and disable | Required | `AdvertisementController.php`, `AdminAdvertisementController.php`, `Advertisement.jsx` | Current homepage/directory placements and full ad tests; T-13 controlled expiry browser evidence from 27 October. | PASS (expiry browser evidence carried) |
| Administrator login, logout, dashboard and backend authorization | Required | `AdminAuthController.php`, `EnsureUserIsAdmin.php`, `AdminAccessTest.php` | Full MariaDB/SQLite suites passed login, CSRF, throttling, guest/non-admin denial and dashboard checks; prior browser login/logout passed. | PASS |
| Business create/edit, draft/publish/archive and public propagation | Required | `AdminBusinessController.php`, `AdminBusinessFormPage.jsx` | Full suites and prior isolated browser flow created, published, edited and archived a record. | PASS (browser flow carried) |
| Field errors, protected publish, map picker, hours, images and unsaved changes | Required form behavior | `AdminBusinessFormPage.jsx`, `BusinessLocationPicker.jsx`, `businessForm.test.js` | PR #15 isolated browser run covered core form flow; all 32 frontend tests pass after merge. | PARTIAL — native Back cancellation and tile retry in the new picker were not interactively reproduced. |
| Category, settlement and service management without hardcoded React lists | Required | `AdminTaxonomyController.php`, `AdminTaxonomyPage.jsx` | T-10 browser evidence and full taxonomy tests; current five settlements are loaded dynamically. | PASS |
| Advertisement management in the administrator panel | Required | `AdminAdvertisementController.php`, `AdminAdvertisementFormPage.jsx` | Full ad suite covers create/edit/enable/disable/delete and upload; prior browser QA covered form/preview. | PASS (browser evidence carried) |
| React + Laravel + persistent MySQL-family database | Required | `frontend/`, `backend/`, migrations | Current MariaDB-backed public site loaded; 106 MariaDB tests passed. Fresh isolated SQLite migrations and seed also passed. | PARTIAL — exact MySQL 8 and a fresh production deployment were not tested. |
| Recommended 30 sample businesses and varied categories/statuses/ad states | Recommended data target | `DemoBusinessSeeder.php`, `DemoAdvertisementSeeder.php` | Fresh isolated seed: 30 base records; optional seed/repeat: 33 total, 29 published, five settlements. Current development database: 36 total, 29 published, three drafts, four archives. | PASS — extra local records are preserved user data. |
| Honest illustrative data, sourced real records and licensed imagery | Required accuracy | `presentation-businesses.json`, `presentation-photos.json`, `VerifiedLipjanBusinessesSeeder.php` | 26 photo manifest entries; all 33 current image references resolve. Three sourced listings match documented addresses/points; public footer discloses illustrative records. | PASS — current source details can change; no claim of surveyed entrances. |
| Responsive, keyboard-visible, labeled and understandable UI | Required | Public/admin React pages and styles | Prior 320–1440px browser viewport checks and screenshots; validation tests cover accessible field focus. | PARTIAL — physical mobile/Safari and a full screen-reader audit were not performed. |
| Server validation, password hashing, safe uploads and plain-text rendering | Required security | Laravel controllers, `SafeImage.php`, React components | Authorization/upload tests pass; source scan found bound SQL search values and no HTML injection sink in application code. | PARTIAL — production static-serving restrictions and full image decoding were not verified. |
| README, migrations, seeders and sanitized environment example | Required deliverable | `README.md`, `backend/database/`, `backend/.env.example` | All 14 development migrations recorded; isolated SQLite migration and seed worked; README screenshot and Neptun citation corrected in review branch. | PARTIAL until documentation PR is merged; full dependency installation on a blank machine was not run. |
| Mentor added as repository collaborator | Required deliverable | GitHub repository settings | Mentor account was not supplied; access cannot be confirmed from the repository files. | NOT TESTED |
| Live demo or 2–3 minute video; 5–7 minute oral presentation | Required deliverable | Student submission | No video or slide/presentation artifact was present in the repository; off-repository work was not verified. | NOT TESTED |
| At least five working days and meaningful commits per week | Required process | Git history | Main has dated commits on every day from 19–30 October, including at least five days in both final weeks. | PARTIAL — no commits appear for 5–18 October; do not backdate activity. |
| Owner accounts, favorites, accent approximation, open-now and distance filters | Optional | Outside base implementation | PDF lists these as extensions. | NOT APPLICABLE |
| Payments, subscriptions, public ratings, chat or mobile app | Outside scope | None | PDF excludes these. | NOT APPLICABLE |

## C. Test results

All commands below ran on 31 October 2026. The first MariaDB attempt was stopped because port 3306 was closed; after starting the documented local MariaDB process, the full rerun passed.

| Command or check | Result |
| --- | --- |
| `cd backend; php vendor/bin/phpunit --configuration phpunit.mysql.xml --no-progress` | **106 passed, 935 assertions, 0 skips/failures**. Isolated `lipjan_directory_test` database. |
| `cd backend; php artisan test --no-progress` | **92 passed, 14 engine-specific skipped, 921 assertions, 0 failures**. SQLite test environment. |
| `cd frontend; npm test` | **32 passed, 0 skipped/failed**. |
| `cd frontend; npm run build` | Passed: Vite 7.3.7, 60 modules, no build warnings. Restricted execution initially denied config access; rerun with normal access passed. |
| `cd backend; php vendor/bin/pint --test` | Passed. |
| `cd backend; composer validate --strict` | Passed. |
| `cd backend; composer check-platform-reqs` | Passed on installed PHP 8.2.12. |
| `cd backend; php artisan migrate:status` | All 14 migrations recorded as run on the development database. |
| Fresh isolated SQLite: `migrate --force`, `db:seed --force`, optional sourced seeder twice | Passed: **33 businesses, 29 published, two drafts, two archived, five settlements** after repeat; isolated file removed. This did not install Composer/npm dependencies from scratch. |
| `cd frontend; npm audit --audit-level=low` | Zero advisories, including development packages. |
| `cd backend; composer audit --locked` | One **medium** advisory, Symfony MIME 7.4.19 / CVE-2026-45070; see D. |
| `git fsck --full --no-reflogs`, tracked-secret/merge-marker scans | Git integrity exit 0; one unreachable tree object, no corruption. No tracked `.env`, private key or generated dependency/build tree found by path scan; no unresolved conflict markers found. |

## D. Security findings

- **Medium advisory, no confirmed application exploit:** `symfony/mime` is locked at 7.4.19. [Symfony CVE-2026-45070](https://symfony.com/cve-2026-45070) describes header injection only when an application places untrusted data in a MIME *parameter name*; 7.4.22 is the fixed 7.4 release. This project has no application mail-sending or parameter-name construction path in `backend/app` or `backend/routes`. The advisory is real; reachability here was not demonstrated. Upgrade the lockfile in a separately tested maintenance change after submission, unless a mail feature is added sooner.
- **No confirmed high/critical vulnerability** in the reviewed local code and tests. Admin routes require Sanctum session authentication and the admin flag; login is throttled, sessions regenerate/invalidate, and frontend writes send CSRF tokens. SQL search expressions bind values. React renders business text as text, and map popups use text nodes. These are scoped findings, not a penetration test.
- **Upload and deployment limit:** `SafeImage.php` checks extension/MIME match, dimensions, size and container ending. It does not fully decode or re-encode images because GD/Imagick is unavailable. The production web server's static-file and script-execution rules have not been tested. See `docs/upload-security.md`.
- The example environment file has blank secrets. Local `.env` and runtime directories are untracked. The tracked-file scan found no obvious keys; it cannot prove that every possible secret is absent. Before any deployment, set `APP_DEBUG=false`, HTTPS/secure cookies and a writable PHP upload temporary directory.

## E. Documentation and reproducibility

README setup commands, API notes, acceptance history, photo manifest, upload guidance and sourced-business attribution are present. A fresh isolated **database** migration/seed was run; a full blank-machine Composer/npm install and production routing were not. The README now points to the current photographed homepage and explains that older captures are historical. The Neptun source note now cites an accessible official 2025 brochure after two prior source URLs returned 404. The brochure is dated evidence, not confirmation that today's branch telephone remains unchanged.

The current development database was only read: 36 businesses (29 published, three draft, four archived), five settlements, six categories, ten services, six ads and 33 business/ad image references, all resolving locally. The standard 30 illustrative profiles remain; three sourced published listings show business-location points. Three other local records account for the difference from the earlier 33-record snapshot. One illustrative record has test coordinates but is archived and has no public marker.

## F. Submission checklist

- **Complete in repository:** GitHub source, Laravel/React code, migrations and seeders, `.env.example`, install guide, API/acceptance documentation, photo attribution and screenshots. PRs #13–#15 are merged into `main`; local `main` matched `origin/main` before this audit branch.
- **Student action required:** review and merge PR #17 to publish the authorized contact channel; confirm mentor collaborator access and the mentor's deadline timezone; record a live demonstration or 2–3 minute video and prepare the 5–7 minute presentation.
- **Cannot verify from repository:** mentor invitation acceptance, off-repository video/presentation, live URL or final submission. No deployment is claimed.

Suggested **2–3 minute recording**: homepage search/category → filtered directory, page and map → sourced profile, phone/directions links without placing a call → administrator draft/publish/edit/archive → active versus expired ad. Suggested **5–7 minute presentation**: purpose and honest data model (1 minute), React/Laravel/MySQL architecture (1), public demo (2), administrator/data validation/security (2), limitations and next steps (1). Prepare a test-only admin account and avoid displaying credentials.

## G. Outstanding defects and limitations

1. **High until merge — required contact destination pending.** The student supplied and authorized `anejiakneji55@outlook.com`. PR #17 adds the visible address and matching `mailto:` link; current `main` still has the old notice until review and merge. No email was sent and browser automation timed out, so a live handler was not verified.
2. **High for acceptance — T-06 Pending.** Stored phone, email, address, marker, popup and direction URLs agree for the three sourced profiles, but no actual telephone/email/directions handler was exercised on a suitable device. Do not claim full T-06 passage.
3. **High for submission evidence — external deliverables unconfirmed.** Mentor access, deadline timezone and live demo/video/presentation are required but not verified. The original four-week Git cadence also lacks evidence for the first two weeks.
4. **Medium — target-environment validation incomplete.** MySQL 8, production web-server upload restrictions, HTTPS configuration and physical mobile/Safari were not tested. XAMPP's upload temporary directory had caused a previous local upload failure until a writable process setting was used.
5. **Medium advisory — Symfony MIME CVE-2026-45070.** The locked package is affected, but no reachable untrusted MIME parameter-name path was found in this application.
6. **Low — browser Back cancellation and map tile retry in the new admin picker.** Back cancellation is modeled in frontend tests; native dialog cancellation was not exercised. Public map tile failure/retry passed previously, but was not simulated again today for the new admin picker.
7. **Low — source precision.** The three map points are source-backed, not independently surveyed entrances. Neptun's branch phone comes from a 2025 publication and should be confirmed before a real-world visit.

## H. Changes made

This documentation branch updates README's current screenshot/form description and contact note, Neptun's broken source citations and this audit report. The separate PR #17 changes only the Contact page. Its 32 frontend tests, production build and rendered email-link check passed; browser automation timed out. Neither PR changes migrations, seed data, user records or production configuration. Both remain unmerged.

## I. Final verdict

**NOT READY — BLOCKING ISSUES.** The tested core application is strong enough for a student-project demonstration. A public contact path is prepared in PR #17 but not yet on `main`; mentor access and the required submission materials remain unconfirmed. Review this verdict after the open PRs are merged and the external deliverables are verified, without starting a new feature sprint.

## J. Final actions for the student

1. Review and merge the focused Contact-page PR #17 to publish the authorized email. The displayed address and `mailto:` target match in the rendered component; interactive handler verification remains pending.
2. Review and merge the separate documentation PR #16 before submission; preserve current `main` history.
3. Confirm the mentor's GitHub collaborator access and the exact deadline timezone. The PDF says **1 November 2026, 23:59**, but does not specify a timezone.
4. Record the short demonstration or arrange a live one, and prepare the oral presentation. Verify the actual submitted files/links with the mentor.
5. On a suitable device, exercise T-06 handlers without unsolicited calls/messages. Keep T-06 Pending until that evidence exists.
6. If deploying, test MySQL 8, HTTPS/session settings, static upload serving and a real image upload in the target environment. Do not claim these were covered by local tests.
