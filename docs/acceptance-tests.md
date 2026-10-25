# Acceptance tests

Statuses below reflect the recorded runtime evidence. Source inspection is not a runtime pass. Record the date, environment, exact commands/actions and result when each is exercised with persisted data.

| ID | Scenario | Required evidence | Status |
| --- | --- | --- | --- |
| T-01 | Search business name | API and UI return matching published records; test case and whitespace | Passed, 22 Oct 2026 |
| T-02 | Category + settlement | Every match satisfies both, including across pages | Passed, 22 Oct 2026 |
| T-03 | Website filter | Excludes missing/empty website values | Passed, 22 Oct 2026 |
| T-04 | Next page | Stable sort, retained filters, correct total and no duplicated records | Passed, 22 Oct 2026 |
| T-05 | Reload filtered URL | Same selections, count and results with unchanged data | Passed, 22 Oct 2026 |
| T-06 | Open profile | Name/contact/address/pin belong to same record; directions and telephone work | Pending |
| T-07 | No search matches | Clear explanation and working filter reset | Passed, 22 Oct 2026 |
| T-08 | Admin creates/publishes | Persisted record appears in list, search and direct profile | Passed, 25 Oct 2026 |
| T-09 | Admin changes phone | Updated value appears publicly after reload | Passed, 25 Oct 2026 |
| T-10 | Admin creates category | Available in admin form and public filters without code change | Pending |
| T-11 | Admin archives business | Business and ads disappear; direct public URL unavailable; data retained | Passed, 25 Oct 2026 |
| T-12 | Visitor attempts admin action | Backend rejects request, database unchanged; repeat after logout | Passed, 25 Oct 2026 |
| T-13 | Ad reaches end time | Visible just before end, absent exactly at end and after reload | Pending |
| T-14 | Map/network failure | Clear fallback/retry; contacts and surrounding content remain usable | Passed, 23 Oct 2026 |

T-08, T-09 and T-11 combine the persisted Laravel tests with the local browser flow. T-12 includes unauthenticated and non-administrator write rejection, a write rejected after logout, unchanged row counts, and a browser redirect to sign-in.

## Day 7 — 25 October 2026

- On the local MariaDB 10.4.32 test database: 82 tests and 483 assertions passed. SQLite: 82 tests, 469 assertions, with 14 MariaDB-specific checks skipped. The business management tests cover drafts, validation, relationships, hours, images, publication, public search/profile sync, archiving, ads, dashboard counts and denied writes.
- In the local browser against the development database, a temporary demo business was created as an incomplete draft, its first publication attempt was blocked, its missing details/services/hours were saved, and it was published. Its public profile showed the stored contact, service, hours and map marker. Editing its phone appeared on the public profile after reopening. Archiving removed its direct public profile; the administrator listing kept it visible. The temporary business, its uploaded images and test administrator were removed after verification.
- Administrator search returned five “Kuzhina” records; the archived filter returned the two seeded records plus the temporary archived fixture; page two showed the next twelve records. Browser Back returned from the public profile to the administrator list, and logout redirected a protected route to sign-in. No browser console errors were recorded during these checks.
- At 320, 375, 390, 768, 1024 and 1440 pixels, list and edit form controls were present and the document had no horizontal overflow. The table scrolled inside its own container at narrower widths. A visual screenshot of the 320-pixel list and form showed readable fields and navigation. Native confirmation dialogs were exercised at the default viewport; separate dialog screenshots at every width and physical-device testing remain outstanding.
- On XAMPP, the default PHP upload temporary directory produced a startup notice in multipart responses despite storing the image. Running the PHP development server with a writable workspace `upload_tmp_dir` resolved the response issue. The local public storage link was created for image serving. The production server must configure its upload temporary directory and run `storage:link`.
- Actual MySQL 8 and physical mobile Safari were not tested. T-06, T-10 and T-13 remain pending for their separate complete scenarios.

Additional checks: missing publication fields; out-of-range/unverified coordinates; invalid image type/size; duplicate taxonomy names; referenced taxonomy deletion; invalid ad intervals; future/inactive ads; priority and creation-order ties; optional hours not labeled “open now”; XSS text; unsafe URL schemes; invalid login; keyboard and three viewport sizes. Check MySQL behavior directly; SQLite-only tests do not establish production collation or foreign-key behavior.

## Initial setup attempts — 19 October 2026

- Confirmed PHP 8.2.12, Composer 2.8.9, Node 22.23.1 and Git availability.
- `composer create-project laravel/laravel backend "^12.0" --no-interaction --prefer-dist` failed: Packagist connection refused. No Laravel app was created.
- `npm create vite@latest frontend -- --template react` failed: registry network access rejected.
- Frontend files were prepared manually. Dependency installation/build and browser verification remain blocked, not passed.
- No MySQL database, migrations, API endpoint or authentication has been tested.

These notes record the initial blocked attempts. Later on 19 October, dependency access was restored, Laravel/Sanctum and the Vite proxy were configured, initial migrations ran on local MariaDB, three backend tests and the frontend build passed, and browser connection/error/retry behavior was verified. See README for the resolved setup instructions. This did not establish the public/admin acceptance scenarios.

## Database verification — 20 October 2026

- Ran `php artisan migrate` and `php artisan db:seed` on `lipjan_directory` using PHP 8.2.12 and MariaDB 10.4.32 through the MySQL driver. Repeated seeding retained the expected counts: 30 businesses (26 published, 2 draft, 2 archived), 6 categories, 4 settlements, 10 services, 85 service links, 140 opening-hour rows, 21 images and 6 advertisements (3 eligible, 1 future, 1 expired, 1 disabled).
- `php vendor/bin/phpunit --configuration phpunit.mysql.xml` passed 39 tests with 109 assertions on the isolated `lipjan_directory_test` database. Covered relationships in both directions, restricted/cascading deletes, missing foreign keys, duplicate taxonomy names/slugs, duplicate business slugs/services/days, invalid statuses/placements, coordinate and time constraints, advertisement start/end boundaries and seed repeatability/preservation of users and non-demo businesses.
- `php artisan test` passed 25 tests with 95 assertions using in-memory SQLite; 14 MySQL/MariaDB-specific checks were skipped rather than claimed as SQLite passes.
- Verified rollback of just the eight directory migrations and their reapplication using `--env=testing`, followed by a passing MariaDB test run. Existing framework/authentication migrations were retained.
- Frontend production build passed; no frontend source or additional API routes were added. The existing health endpoint tests passed.

All T-01–T-14 remain **Pending**. In particular, the model-level advertisement boundary tests are supporting database evidence, not an end-to-end pass for T-13. Actual MySQL 8 verification, public/admin API validation and UI behavior remain for later stages.

## Public API verification — 21 October 2026

- Read the original 12-page specification from Downloads, the plan and existing database implementation before creating `feat/public-directory-api` from synchronized main after PR #2's merge.
- MariaDB 10.4.32: `php vendor/bin/phpunit -c phpunit.mysql.xml --no-progress` passed 66 tests with 331 assertions. Includes publication visibility, direct-profile 404s, profile relationships, search trimming/case/literal wildcards, separate and combined filters, website/hours presence, stable sorting, 12-record pages, pagination links/totals, dynamic lookups, ad eligibility/priority/creation ties/time boundaries and invalid query JSON responses.
- SQLite: `php artisan test` passed 52 tests with 317 assertions; 14 engine-specific database checks were skipped. PHP formatting, Composer validation and `npm run build` passed.
- In the local Vite browser, the development-only React panel fetched persisted MariaDB records through Laravel and showed 12 of 26 published businesses with demo labels. Loading was observed, stopping Laravel produced the error/retry state, and restarting Laravel plus retry restored the records.
- Documented the API contract in `public-api.md`. No completed listing/filter UI, profile/map page or admin flow was implemented or claimed as verified. MySQL 8 remains untested.

T-01–T-14 remain **Pending**. API evidence supports their later execution but does not establish the complete browser-level scenarios.

## Public interface verification — 22 October 2026

Environment: Windows, PHP 8.2.12, MariaDB 10.4.32, Laravel on port 8000 and Vite on port 5173. Used the existing persisted demo database. PR #3 was confirmed merged before synchronizing main and creating `feat/public-directory-ui`. No backend source or database records were changed today.

Browser actions and results:

- Homepage: six categories loaded from Laravel, six published demo businesses displayed, category link Gastronomi opened `?category=gastronomi` with five matching kitchens. Search submitted with Enter from the homepage trimmed `  Autoservisi  ` and returned four matching records. The directory search button also submitted correctly. Uppercase `DEMO` returned matching records.
- T-02: category `tregti` gave five records; combining `settlement=janjeve`, `service=dergesa` and `has_hours=1` gave exactly Dyqani 02, 14 and 26. All three matched the selected category and settlement; this combination fits on one page. Refresh retained the selections and records. Independently, Dërgesa returned 10 and Janjevë returned 7.
- T-03: website-only returned eight records (Autoservisi 03/09/15/21 and Studio 06/12/18/24). The API returned non-empty websites for every match. Combining website-only with the three-shop selection produced no matches, as expected.
- T-04/T-05: `q=DEMO&has_hours=1&sort=name_desc` returned 18 matches. Page one contained 12 and page two six, with no overlapping names. Page two kept all parameters and displayed 13–18 of 18. Reloading `?q=DEMO&has_hours=1&sort=name_desc&page=2` restored the exact URL, count, names and selected controls. Browser Back restored page one with the same query, hours and sort. Changing sorting reset the page.
- A–Z began with Autoservisi 03; Z–A began with Teknika 23. Newest began with Autoservisi 15, matching the live API's creation-time order. No sorting or pagination is performed on downloaded full datasets.
- T-07: an unmatched search showed the Albanian empty message. Its reset action removed the query/filters and restored 26 published businesses. Missing images showed the consistent directory placeholder; available demo illustrations loaded through the Vite proxy.
- Opening a business card fetched its published profile into a summary dialog. Escape closed it and returned visible keyboard focus to the originating button. This is a summary, not the completed profile/map acceptance scenario.
- Homepage advertising showed Dyqani 02; the directory sidebar showed Autoservisi 03, separately labelled `Reklamë · Demonstrim`. The demo ad action opened its associated business summary rather than the simulated example.com destination. Real advertisements use their validated HTTP(S) destination. Ads do not affect business totals. Placements refetch on mount, window focus and every 60 seconds; an already-open page may retain an expired placement until its next successful refresh. Exact browser expiry at the boundary is not established.
- Loading states were observed. Stopped Laravel, submitted a directory search and observed the safe error with retry and usable surrounding navigation. Restarted Laravel and clicked `Provo përsëri`; five matching shops returned. No unexpected console warnings/errors were observed after recovery.
- At 320, 375, 390, 768, 1024 and 1440 CSS-pixel viewport widths, both homepage and loaded directory had no horizontal overflow. Reviewed desktop and mobile screenshots. Mobile filters expand/collapse; advertisements follow organic results on mobile and sit below filters on desktop. Mobile navigation expands, Escape closes it and restores focus; navigating to Contact closes it. Search Enter, native selects, checkboxes, visible focus and dialog dismissal were exercised with keyboard controls.

Automated checks:

- MariaDB: `php vendor/bin/phpunit -c phpunit.mysql.xml --no-progress` passed **66 tests / 331 assertions** on isolated `lipjan_directory_test`.
- SQLite: `php artisan test --no-ansi` passed **52 tests / 317 assertions**, with **14 engine-specific checks skipped**.
- `npm test` passed **7 tests** for request parameters/cancellation, safe validation/server/network/HTML-response errors and allowed external link schemes. These are API-client tests, not a browser automation suite.
- PHP formatting and strict Composer validation passed. Frontend production build and source formatting passed. Initial concurrent builds failed from host memory exhaustion; stopping the owned Vite server and building with process-local worker/heap limits resolved it, without project configuration changes.

Screenshots: [desktop homepage](screenshots/home-desktop.png), [mobile directory](screenshots/directory-mobile.png). T-01–T-05 and T-07 are now passed at the required public UI level. T-06 and T-08–T-14 remain pending: full profiles/directions/maps, administrative workflows and exact browser advertisement expiry are not completed. Actual MySQL 8 and physical-device testing remain unverified. A real platform contact destination is still required before final delivery.

## Profiles and maps — 23 October 2026

Read all 12 PDF pages, the plan, API documentation, acceptance evidence and current source. Verified PR #4 merged; synchronized main before creating `feat/business-profiles-maps`. No Laravel source, database records or existing history was changed.

Browser verification used persisted MariaDB demo records through Laravel port 8000 and Vite port 5173:

- Direct `/bizneset/demo-biznes-04` and refresh displayed Ordinanca 04, Shëndetësi, Sllovi, its complete description, stored address/phone/email/social link, three services, logo and seven hours rows. Monday–Saturday show 08:00–17:00; Sunday shows Mbyllur. Telephone destination is `tel:+38300000004`; email is `mailto:demo-biznes-04@example.com`. No website button appears because the stored value is null. Social links use HTTP(S), a new tab and `noopener noreferrer`.
- Its Leaflet marker popup showed the same name/address. The directions link targets `https://www.google.com/maps/dir/?api=1&destination=42.5012,21.1112`, matching the stored coordinates. Keyboard Enter opened the marker popup; zoom-in and keyboard panning were exercised. Tiles loaded and OpenStreetMap attribution remained visible. Demo contacts, imagery and unverified coordinates are visibly labelled.
- `/bizneset/demo-biznes-03` showed unpublished-hours text, an image placeholder and its actual stored website. No invented email was added. Telephone/email URI handlers were inspected; no telephone call or email was sent and no physical phone handler was tested. Demo example.com websites/social pages are simulated destinations and were not claimed as working real-business sites. Accordingly T-06 remains pending for the final contact-action acceptance on a suitable device, although same-record profile/pin/directions-link correspondence was verified.
- Directory page one had 12 markers with exactly the same names as the 12 cards. Page two had a different set of 12 markers matching its cards. Category Tregti reset pagination and displayed exactly its five shops in both views. A marker popup opened Dyqani 02's shareable profile; browser Back restored the filtered directory and Forward restored that profile. A regular card opened Autoservisi 03's profile.
- Missing slug, draft demo-biznes-27 and archived demo-biznes-29 all displayed identical not-found messages without business data. Stopping Laravel and opening a profile showed an Albanian failure with retry; after restart, retry restored Ordinanca 04.
- T-14: temporarily started Vite with process-only `VITE_MAP_TILE_URL=http://127.0.0.1:8000/no-tiles/{z}/{x}/{y}.png`. Failed tiles produced the explicit map warning and retry control while the address and correct telephone link remained usable. Exercised map retry, restored the normal Vite process, reloaded and verified 15 loaded tiles with no error warning. This did not modify .env, provider files or business records.
- Profile and loaded directory checked at 320, 375, 390, 768, 1024 and 1440 CSS pixels: no horizontal overflow; directory retained 12 matching markers. No unexpected console warnings/errors were observed in the final browser inspection. Screenshots: `screenshots/profile-map-desktop.png` and `screenshots/profile-mobile.png`.

Automated verification: MariaDB 10.4.32 passed 66 tests/331 assertions on isolated `lipjan_directory_test`; SQLite passed 52/317 with 14 engine-specific checks skipped. Frontend `npm test` passed 12 tests, including coordinate bounds/missing values/zero, coordinate-specific directions, telephone normalization, email-header injection and existing API safety checks. Missing-coordinate suppression was unit-tested, not verified with a new persisted incomplete public record. PHP formatting passed. Production build and formatting of today's source were checked before publication. MySQL 8 and physical devices remain untested.

Maps use Leaflet 1.9.4 directly and standard OpenStreetMap raster tiles, with attribution and normal browser caching. External tile availability is not guaranteed; partial failures remain visible until retry. No location permission, geocoding or invented fallback center is used. Admin and ad-expiry acceptance scenarios remain pending.

## Administrator authentication verification — 24 October 2026

- The additive `is_admin` migration ran on the existing local MariaDB 10.4.32 database. Default users remain non-administrators. A temporary local test administrator was created with the interactive command for the HTTP checks and removed afterward; no password or account was committed or seeded.
- The isolated MariaDB suite passed 73 tests/382 assertions. SQLite passed 59 tests/368 assertions with 14 engine-specific checks skipped. New feature tests cover the hidden-password setup command, hashed password, login validation and generic rejection, five-attempt login throttling, session regeneration, guest 401, ordinary-user 403, administrator identity, dashboard counts, ad eligibility, logout and rejection after logout. Existing public endpoint tests remained passing.
- Through the local Vite proxy, `GET /sanctum/csrf-cookie` returned 204. Login without the CSRF header returned 419 and did not grant dashboard access. Wrong credentials returned 422; valid administrator credentials returned 200; `/api/admin/me` and `/api/admin/dashboard` returned 200 with persisted counts. The local dashboard then showed 26 published, 2 draft, 2 archived businesses and 4 eligible advertisements; the last number reflects the live time window and can change. After login, the CSRF cookie rotated; logout with the renewed token returned 200 and the next dashboard request returned 401. The public business endpoint remained available.
- Frontend unit tests passed for CSRF initialization, credentialed requests, safe failures and reading the renewed CSRF cookie for logout. The frontend production build passed. React source and Tailwind classes were checked, but login/dashboard rendering, keyboard use, Back behavior, console output and layout at 320, 375, 390, 768, 1024 and 1440 pixels could not be observed: the browser tool denied access to the local tab under its URL policy. These browser checks remain **unverified**, not passed.
- T-12 stays pending because Day 6 has no protected administrative write action. Its complete database-unchanged acceptance test belongs with the first admin CRUD endpoint. Actual MySQL 8 and physical-device testing remain outstanding.
