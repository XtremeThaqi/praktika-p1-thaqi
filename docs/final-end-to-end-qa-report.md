# Final end-to-end QA report — 31 October 2026

## A. Executive summary

The running public site completed a real browser journey from homepage search to directory result, sourced profile, map controls and Contact page. Its Laravel API returned live data from the development MariaDB database. All existing automated suites passed. This run did **not** complete the requested administrator browser CRUD journeys in an isolated environment, every public filter permutation, or six-width visual inspection. Those gaps are documented rather than counted as passes.

## B. Environment

Windows, PowerShell, PHP 8.2.12, Node 22.23.1, npm 10.9.0, Composer 2.8.9, Vite 7.3.7, Laravel 12 and local XAMPP MariaDB 10.4.32. The browser was the Codex in-app browser with accessibility-tree interaction. Clean local `main` and `origin/main` both pointed to `b78702b` before this report branch. GitHub PRs #15, #16 and #17 were confirmed merged. MariaDB, Laravel on 127.0.0.1:8000 and Vite on 127.0.0.1:5173 were started for this audit. No development records were written.

## C. Test coverage matrix

| Feature | Test performed | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Startup and frontend/backend connection | Started all three services, opened homepage, observed live cards and category API data | PASS | Browser and API requests | Process startup alone was not used as proof. |
| Homepage | Opened loaded page, search, cards, category links, ad and footer | PARTIAL | Browser tree | Mobile menu, every control and failure state not exercised today. |
| Directory | Searched Mangall from homepage; checked result count and page map | PARTIAL | One result and one marker in browser | Full filter/sort/pagination matrix covered by existing tests and earlier audit, not repeated interactively today. |
| Sourced profile and map | Opened Restaurant Mangall, inspected phone, email, website, directions, address, marker, zoom and attribution | PARTIAL | Browser tree | External handlers, popup click and map drag not exercised. |
| Contact | Opened page and verified visible address and exact `mailto:` target | PASS | Browser tree | No email client opened or message sent. |
| Advertisements | Homepage and directory placements visible; public API returned two eligible ads | PARTIAL | Browser and API | Admin editing/schedule changes not exercised interactively today. |
| Administrator authentication and dashboard | Existing feature suites passed | PARTIAL | MariaDB/SQLite tests | No isolated admin browser login today. |
| Business form, taxonomy and ads management | Existing feature suites and frontend tests passed | PARTIAL | Automated tests | Scenarios B–D were not run in a browser today. |
| Public API | Health, index, website filter, settlements, categories, ads and missing profile | PASS | Direct HTTP requests | Public index: 29 total, 12 on first page; website filter: 3; five settlements, six categories, two eligible ads; missing slug: 404. |
| Responsive/accessibility | Browser accessibility tree inspected on public pages | PARTIAL | Semantic headings, labeled search, named links and map controls | Six widths, keyboard-only journey, contrast and screen reader audit not completed. |
| Security | Existing authorization/upload tests and dependency audits | PARTIAL | Test suites and audit output | No penetration test or production static-serving test. |

## D. Real browser testing

Opened `/`, entered `Mangall` in the homepage search and submitted it. The URL became `/bizneset?q=Mangall`; the directory showed one result, one page and one marker. Opened the Restaurant Mangall profile and observed the published address, `tel:+38348777285`, email, website, directions coordinates `42.56316,21.21836`, Leaflet marker, zoom controls and OpenStreetMap attribution. Opened `/kontakt` and observed `anejiakneji55@outlook.com` with `mailto:anejiakneji55@outlook.com`. This was browser interaction, not merely source inspection. No external phone, email or directions handler was launched.

## E. Public website results

Homepage loaded six dynamic categories, six photographed featured businesses, a labeled advertisement and the student-project disclosure. The Mangall directory search and profile worked. The profile showed honest missing-photo, missing-services and unpublished-hours messages. API index metadata reported 29 published listings and 12 on page one. The public website filter returned three sourced listings. Draft/archived exclusion, all search variants, combined filters, back/forward, pagination, other profiles, tile failure and missing-profile UI were **not retested in this browser run**; existing automated and earlier acceptance evidence remains in `docs/final-submission-audit.md`.

## F. Administrator results

No isolated browser administrator session was created in this run, so authentication, dashboard counts, map picker, image upload, archive/logout dialogs, taxonomy CRUD and advertisement CRUD are **not newly verified end to end**. The complete MariaDB and SQLite suites passed their authorization and CRUD cases. The frontend suite passed form state, map-coordinate, working-hour and unsaved-change cases. A native browser cancellation dialog is still unverified.

## G. API and database results

Direct HTTP checks returned `health.status=ok`; public business index `meta.total=29`, `per_page=12`, 12 first-page records; website-filtered index `meta.total=3`; five settlements; six categories; two currently eligible advertisements; nonexistent business profile HTTP 404. Browser data matched those public responses. MariaDB tests used their isolated test database. An attempted read-only `php artisan db:show --counts` failed because the least-privileged application account cannot read `performance_schema.session_status`; this is a diagnostic-command permission limit, not evidence of broken application queries. The broader foreign-key/orphan/file audit and optional-seeder repeat were not repeated today; see the earlier final audit and seeder tests.

## H. Responsive and accessibility results

The browser accessibility tree exposed a skip link, named search input and button, headings, named navigation and advertisement controls, a named map marker, zoom controls and an accessible Contact email link. No six-width screenshots or keyboard-only traversal were completed in this run. Physical mobile, Safari, screen reader and color-contrast checks remain unverified. No new visual defect was confirmed.

## I. Security results

The current test suites passed admin authorization, CSRF, validation and image-security cases. `npm audit --audit-level=low` found zero advisories. `composer audit --locked` found one **medium** advisory for `symfony/mime`, CVE-2026-45070, already documented in the final submission audit. No reachable MIME parameter-name injection path was demonstrated. No production upload serving, HTTPS/session deployment or active exploit test was performed.

## J. Automated tests

| Command | Result |
| --- | --- |
| `php vendor/bin/phpunit --configuration phpunit.mysql.xml --no-progress` | PASS: 106 tests, 935 assertions. |
| `php artisan test --no-progress` | PASS: 92 passed, 14 skipped, 921 assertions. |
| `npm test` | PASS: 32 tests. |
| `npm run build` | PASS: Vite 7.3.7, 60 modules. First attempt failed allocating about 9 MB while Vite dev server was running; rerun after stopping it passed. |
| `php vendor/bin/pint --test` | PASS. |
| `composer validate --strict` | PASS. |
| `composer check-platform-reqs` | PASS. |
| `npm audit --audit-level=low` | PASS: zero advisories after normal network access. |
| `composer audit --locked` | One medium advisory, `symfony/mime` CVE-2026-45070. |

## K. Discovered defects

No confirmed Critical or High application defect was reproduced. The build's first memory-allocation failure was environmental: stopping the concurrently running Vite server let the unchanged build pass. `db:show --counts` requires a `performance_schema` permission the app account intentionally lacks; normal API queries and test suites work. These are testing limitations, not confirmed product defects. The Symfony advisory is a real dependency risk with no demonstrated application exploit. No screenshot of an application defect was captured.

## L. Changes made

Only this report was added on `codex/final-end-to-end-qa`. No application code, schema, dependency, seed data or development database records were changed. No fix PR was justified by a confirmed Critical or High defect.

## M. Final verdict

**READY WITH DOCUMENTED LIMITATIONS.** The tested public journey works and the complete regression suites pass. This report does **not** certify every administrator workflow through a real browser or a production deployment. Those unexercised areas and T-06 device handlers remain pending evidence, not silent passes.

## N. Final recommendations

1. Before claiming full end-to-end coverage, run scenarios B–E with a disposable administrator and isolated database, including native unsaved-change dialogs and upload recovery.
2. On a suitable device, verify phone, email and directions handlers without placing unsolicited calls or messages; keep T-06 Pending until then.
3. Capture the six requested responsive widths and inspect mobile controls, form errors and maps before the demonstration.
4. Confirm mentor access and submission materials; address the medium Symfony MIME advisory in a separately tested maintenance change when practical.
