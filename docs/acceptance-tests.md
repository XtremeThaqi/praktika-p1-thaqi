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

## Setup verification — 19 October 2026

- Confirmed PHP 8.2.12, Composer 2.8.9, Node 22.23.1 and Git availability.
- `composer create-project laravel/laravel backend "^12.0" --no-interaction --prefer-dist` failed: Packagist connection refused. No Laravel app was created.
- `npm create vite@latest frontend -- --template react` failed: registry network access rejected.
- Frontend files were prepared manually. Dependency installation/build and browser verification remain blocked, not passed.
- No MySQL database, migrations, API endpoint or authentication has been tested.
