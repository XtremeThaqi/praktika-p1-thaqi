# Acceptance tests

All scenarios are pending. Source inspection is not a runtime pass. Record the date, environment, exact commands/actions and result when each is exercised with persisted data.

| ID | Scenario | Required evidence | Status |
| --- | --- | --- | --- |
| T-01 | Search business name | API and UI return matching published records; test case and whitespace | Pending |
| T-02 | Category + settlement | Every match satisfies both, including across pages | Pending |
| T-03 | Website filter | Excludes missing/empty website values | Pending |
| T-04 | Next page | Stable sort, retained filters, correct total and no duplicated records | Pending |
| T-05 | Reload filtered URL | Same selections, count and results with unchanged data | Pending |
| T-06 | Open profile | Name/contact/address/pin belong to same record; directions and telephone work | Pending |
| T-07 | No search matches | Clear explanation and working filter reset | Pending |
| T-08 | Admin creates/publishes | Persisted record appears in list, search and direct profile | Pending |
| T-09 | Admin changes phone | Updated value appears publicly after reload | Pending |
| T-10 | Admin creates category | Available in admin form and public filters without code change | Pending |
| T-11 | Admin archives business | Business and ads disappear; direct public URL unavailable; data retained | Pending |
| T-12 | Visitor attempts admin action | Backend rejects request, database unchanged; repeat after logout | Pending |
| T-13 | Ad reaches end time | Visible just before end, absent exactly at end and after reload | Pending |
| T-14 | Map/network failure | Clear fallback/retry; contacts and surrounding content remain usable | Pending |

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
