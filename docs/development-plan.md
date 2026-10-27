# Development plan

Source: Projekti-01-Katalogu-i-bizneseve.pdf, version 1.0, 6 October 2026, all 12 pages reviewed on 19 October.

Deadline: 1 November 2026, 23:59. Confirm the mentor's deadline timezone before delivery. Work begins on 19 October; no earlier activity will be fabricated.

## Architecture

One repository, separate `frontend/` and `backend/` applications. React owns presentation and URL state; Laravel owns all data access and business rules. MySQL persists the data. Use ordinary controllers, Form Requests, Eloquent relationships, API Resources and policies rather than repositories or a custom service framework.

Laravel 12 supports the installed PHP 8.2. Sanctum cookie sessions avoid storing bearer tokens in browser storage. Use the Vite proxy locally and same-origin routing in production; auth implementation must include CSRF initialization, login throttling, session regeneration and logout invalidation. There is no public registration.

Frontend folders grow as needed: `pages/` (including `admin/`), `components/`, `layouts/`, `lib/`, `hooks/`. Do not create empty abstractions in advance. Public business lists always come from the API.

## Database design

| Table | Fields and relationships planned |
| --- | --- |
| users | Name, unique email, hashed password, administrator authorization |
| categories | Unique name and slug; has many businesses |
| settlements | Unique name and slug; has many businesses |
| businesses | Category and settlement foreign keys, unique slug, name, description, phone, address, coordinates, location verification, status, optional email/website/social links, featured and demo flags |
| services | Unique name and slug |
| business_service | Unique business/service pair; both foreign keys |
| business_images | Business foreign key, storage path, alt text, kind and display order |
| business_hours | Business foreign key, weekday, opening/closing times and closed flag; absence means unpublished hours |
| advertisements | Business foreign key, placement, image/alt, destination, start/end timestamps, priority and enabled flag |

Category and settlement deletion is restricted while referenced. Services detach explicitly. Publication requires name, description, category, phone, address, settlement, valid coordinates and confirmation that the pin matches the address. Drafts may be incomplete. Archived records remain stored; related ads are disabled. Public queries and direct profile lookups exclude drafts and archived businesses.

Persist advertisement timestamps in UTC and edit/display in Europe/Belgrade (Lipjan local time). A valid ad has a published business, is enabled, and satisfies `starts_at <= now < ends_at`. Reject `ends_at <= starts_at`. Select highest priority first, then oldest creation time, then ID for a deterministic tie. Ad selection never changes business matches or counts.

## API plan

| Access | Routes |
| --- | --- |
| Public | GET `/api/businesses`, `/api/businesses/{slug}` |
| Public | GET `/api/categories`, `/api/settlements`, `/api/services` |
| Public | GET `/api/advertisements?placement=home_banner` or `results_sidebar` |
| Authentication | Sanctum CSRF cookie; POST login/logout; GET current administrator |
| Admin | Dashboard counts; business list/create/update/status actions |
| Admin | Category, settlement, service and advertisement CRUD; image upload |

List parameters: `q`, `category`, `settlement`, `service`, `has_website`, `has_hours`, `sort`, `page`. Trim search, use case-insensitive matching on name/description, combine filters with AND, sort before pagination, return 12 records plus total. Validate parameters and use stable ID tie-breaks. URL query parameters are the frontend source of truth; filter changes reset page to 1. Clearing filters restores defaults.

## Delivery timeline

| Date | Deliverable |
| --- | --- |
| Oct 19 | Setup and specification mapping; dependencies, Laravel, Vite and local database connection verified |
| Oct 20 | MySQL migrations, relationships and labeled demo seeders |
| Oct 21 | Public API and frontend API connection |
| Oct 22 | Homepage and listing/search/filter/sort/pagination |
| Oct 23 | Profiles, contact actions and Leaflet maps completed |
| Oct 24 | Admin authentication, authorization and dashboard completed |
| Oct 25 | Business management, publication and archiving completed |
| Oct 26 | Category, settlement and service management; T-10 verified |
| Oct 27 | Advertisement management and scheduling completed; T-13 verified |
| Oct 28–30 | Remaining acceptance checks, accessibility, security and documentation planned |
| Oct 31–Nov 1 | Buffer, demo, presentation and final main review planned |

Each workday needs genuine completed work and a meaningful commit. This is an aggressive recovery schedule, not a claim that the original four-week plan was followed. Reassess scope daily; optional features stay out. Work remains on branches and enters main through reviewed PRs. The GitHub remote is `XtremeThaqi/praktika-p1-thaqi`; mentor identity has not been supplied.

## Content and presentation requirements

- Natural Albanian; student-project disclaimer and visible correction/advertising contact. Obtain a real contact destination before delivery.
- Homepage search by Enter/button, dynamic categories, selected businesses and a separate labeled sponsored banner.
- Consistent cards with fallback images, clamped summaries, total count, clear loading/empty/retry states.
- Profiles show full text, working tel/directions/external links; omit unknown optional data and show “Orari nuk është publikuar”.
- Leaflet profile pin and current-page map labeled “Bizneset e kësaj faqeje”; pins follow filters/page and open profiles. Missing coordinates never default to Lipjan center. Attribution remains visible; map failure preserves address and contacts.
- Admin totals from stored data; status filters; named confirmation for impactful actions; field-level errors preserve input.
- Ads visibly marked “Reklamë” or “E sponsorizuar”, separate from organic results, responsive placements; absent ads hide or show a real contact invitation.
- Validate image type/size and external URL schemes on the server. Render business text as text. Hash passwords and keep secrets out of Git.
- Target 30 demo businesses, 6 categories, 4 settlements, varied services/photos/hours/contacts, at least one draft/archive and every ad state. Label simulated businesses and imagery; never imply verification. Use permitted image sources.
- Test phone/tablet/desktop, keyboard focus, visible labels, alternative text and errors conveyed beyond color.

Delivery: GitHub `praktika-p1-thaqi`, mentor collaborator, migrations/seeders, sanitized `.env.example`, README with screenshots, live demo or 2–3 minute recording and a 5–7 minute presentation. No payments, ratings, chat, mobile app or owner accounts.

## Day 2 — 20 October

Branch: `feat/business-database`, based on synchronized `main` after PR #1 was merged. Added the eight directory tables and seven conventional Eloquent models. Foreign keys restrict deletion of referenced lookups, prevent orphan records and cascade physical business deletion to its owned data. Draft details are nullable. MySQL/MariaDB CHECK constraints cover paired/ranged coordinates, weekdays, consistent opening times and positive advertisement duration; status and placement use enums. Opening hours use one interval per day, including overnight intervals where closing time is earlier than opening time.

Demo seeders produce 30 explicitly labeled businesses, 6 categories, 4 settlements, 10 services, 85 service links, 140 opening-hour rows, 21 images and 6 advertisements. Of the businesses, 26 are published, 2 draft and 2 archived. Coordinates and contacts are simulated and location verification stays false. Demo artwork is local and labeled. Re-running seeders preserves IDs/counts, updates only seed-owned demo businesses and ad schedules, and retains users/non-demo businesses.

Verified on MariaDB 10.4.32 with the MySQL driver: all migrations, rollback/reapply on an isolated test database, repeat seeding, foreign keys, uniqueness, ranges, ad timing boundaries and Eloquent relationships. The MariaDB suite passes 39 tests/109 assertions; SQLite passes 25/95 with 14 engine-specific tests skipped. Frontend source is unchanged and its production build passes. MySQL 8 and T-01–T-14 remain unverified. Publication validation and archive actions will be implemented with the administrative API, not inferred from database tests.

Next: public API endpoints and the existing frontend's API connection on 21 October. No listing UI or administrative interface was implemented during Day 2.

## Initial branch

Day 3 update, 21 October: public business listing/profile, category/settlement/service lookups and advertisement endpoints are implemented and documented in `public-api.md`. Published-only queries, validated slug/boolean/sort/page parameters, grouped search, combined filters and 12-record pagination are covered by API tests. Advertisement selection uses enabled/published/time eligibility and priority, oldest creation and ID ties. The development-only React panel displays live first-page data with error/retry behavior. Full MariaDB suite: 66 tests/331 assertions; SQLite: 52/317 and 14 engine-specific skips. Browser integration and the frontend build passed. No admin or full public interface work was included; T-01–T-14 and actual MySQL 8 verification remain pending. On 22 October, implement the homepage and business listing/search/filter/sort/pagination UI.

`chore/project-setup`: dependencies and lockfiles, Laravel scaffold, MySQL configuration, API health check, frontend connection check, build and baseline tests. Do not move to schema work before setup is verified.

Day 6 update, 24 October: Sanctum session login/logout and CSRF, a simple `is_admin` flag, administrator-only middleware, a protected statistics endpoint and React login/dashboard pages are implemented. The initial account is created locally with `php artisan admin:create`, which prompts for a hidden password; no administrator is seeded. Business and advertisement management are still pending. The MariaDB suite and direct HTTP session flow were verified; browser interaction was blocked by the browser tool's URL policy, so responsive and browser acceptance remain unverified. T-12 remains pending until a protected write action exists.

Day 7 update, 25 October: the protected administrator area now lists and searches all business statuses, creates incomplete drafts, edits stored details and relationships, uploads/removes images, publishes only complete records and archives without deletion. Publication requires the documented contact, taxonomy and coordinate fields; real businesses additionally require explicit location confirmation, while demo records remain visibly simulated. Public listing/profile/map queries and advertisement eligibility update from the same persisted record. T-08, T-09, T-11 and T-12 passed through automated and local browser verification; actual MySQL 8 and physical mobile Safari remain unverified.

Day 8 update, 26 October: administrators can list, search, create, rename and delete categories, settlements and services. Names are validated, new slugs remain unique, and renaming keeps existing slugs stable. Referenced categories and settlements cannot be deleted, including when used only by draft or archived businesses. Service deletion requires its exact name and detaches business links in a database transaction. Public and admin business forms continue to read the shared lookup endpoints. T-10 passed in a local browser against the isolated MariaDB test database; temporary records and the test administrator were removed afterward. MariaDB passed 90 tests/578 assertions; SQLite passed 90 tests/564 assertions with 14 engine-specific skips. MySQL 8 and physical Safari remain unverified. Advertisement management is planned for 27 October.

Day 9 update, 27 October: protected advertisement listing, search, status/placement filtering, create/edit, image replacement, enable/disable and deletion are implemented. Form times use Europe/Belgrade; the server stores UTC and rejects daylight saving gaps or repeated hours. Public placements hide an ad at its exact end, then show the eligible winner without altering organic results. T-13 passed under a controlled backend clock and a live local browser schedule. The Day 8 service deletion confirmation now shows its field error. MySQL 8 and physical Safari remain unverified. October 28–31 remains for acceptance, accessibility, security, documentation and delivery preparation; no deployment or final polish is part of Day 9.

Day 10 update, 28 October: the advertisement editor now uses numbered setup sections, visual placement cards, business-profile linking by default, optional external destinations under Advanced settings, image preview/replacement and a sticky live preview on desktop. Shared server-side upload validation rejects forged, malformed, oversized, appended-data and unsupported files for both business and advertisement endpoints, with dimension and pixel limits. Upload deployment precautions are documented. Fresh and upgrade SQLite migrations preserved legacy external destinations; MariaDB, SQLite, frontend and production-build verification passed. Browser checks covered the editor controls, live selected-business preview, internal/external destination controls, enable/disable restoration and responsive widths; the browser file chooser did not accept the local fixture, so upload feedback remains backend-tested only. T-06, MySQL 8 and physical Safari remain unverified.

Setup update, 19 October: the existing repository was moved to `C:\Users\ET\Documents\praktika-p1-thaqi`. All nine tracked files matched commit `90fc0c8`; the working tree was clean and `git fsck --full` passed before development resumed. Composer/npm dependencies and lockfiles are now installed. Laravel 12, Sanctum, baseline migrations, the API health endpoint and the development-only React connection check are configured. The installed XAMPP database is MariaDB 10.4.32, tested using Laravel's MySQL driver; verification against actual MySQL 8 remains outstanding. See README for repeatable setup and checks. The next logical stage is the directory schema and labeled demo seeders.
