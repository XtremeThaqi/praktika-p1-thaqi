# Public directory API

The public endpoints below are read-only and available without login. Use `Accept: application/json`. Locally, Laravel runs on `http://127.0.0.1:8000`; Vite forwards the same `/api` paths from port 5173. Administrator session endpoints are documented at the end.

## Businesses

`GET /api/businesses` returns only published businesses, 12 per page. Filtering and sorting apply before pagination. The response contains `data`, `links` and Laravel's `meta`, including `total`, `current_page`, `per_page`, `last_page`, `from` and `to`. A valid page beyond the last page returns an empty `data` array with the matching total retained. The page size is fixed; unsupported parameters such as `per_page` and `status` are ignored.

Query parameters:

- `q`: name or description substring, trimmed and case-insensitive, maximum 200 characters. Blank search means no search restriction. `%`, `_` and `!` are treated literally. Values use bound SQL parameters. Accent approximation is not an additional search feature; matching otherwise follows the database's collation.
- `category`, `settlement`, `service`: one existing slug per filter, maximum 160 characters. Options come from the lookup endpoints below. Multiple different filters combine with AND.
- `has_website=1`: requires a non-null, non-blank website. `0` disables this restriction.
- `has_hours=1`: requires at least one published hours row, including a closed day. This does not mean the business is open now. `0` disables this restriction.
- `sort`: `name_asc` (default), `name_desc` or `newest`. Newest uses descending `created_at`; every sort uses ascending ID as its final tie-breaker.
- `page`: integer from 1 to 100000; defaults to 1 when omitted. Pagination links retain the query parameters and use relative `/api/businesses` paths so requests stay on the Vite proxy or production origin.

Example:

```text
GET /api/businesses?q=demo&category=tregti&settlement=janjeve&service=dergesa&has_hours=1&sort=name_asc&page=1
```

Cards include ID, slug, name, description (up to 220 characters plus ellipsis), category and settlement (`id`, `name`, `slug`), address (up to 120 characters plus ellipsis), phone, email, website, social links, coordinates, location verification, demo/featured flags and one image. A logo is preferred over a gallery image; absent images are `null`. The coordinates let a later map use the same paginated records. Drafts and archived businesses cannot be included by passing a different status parameter.

`GET /api/businesses/{slug}` returns `{ "data": { ... } }` for one published business. It includes the full description/address, services, hours and ordered images. Missing optional profile values stay `null`, and missing relationships return empty arrays. Hours contain `day_of_week`, `opens_at`, `closes_at` and `is_closed`; day 0 is Sunday. The profile does not invent coordinates or opening information. Missing, draft and archived profiles return the same JSON 404 response.

Business text is plain text data; clients must render it as text. Image paths are relative to Laravel's public origin, such as `/demo/business-logo.svg`. React displays these images; Vite forwards `/demo` and `/storage` to Laravel. Production must route these paths to Laravel too. Demo flags and unverified-location flags are included explicitly.

## Filter options

- `GET /api/categories`
- `GET /api/settlements`
- `GET /api/services`

Each returns `{ "data": [...] }`, with `id`, `name` and `slug`, ordered by name then ID. All registered lookup values are available, including those without current published matches. New database entries become available without changing React. Empty tables return an empty list.

## Advertisements

`GET /api/advertisements` returns at most one winner for each of `home_banner` and `results_sidebar`. `GET /api/advertisements?placement=home_banner` or `placement=results_sidebar` restricts the response to one placement. No valid winner returns `{ "data": [] }`.

An eligible advertisement is enabled, belongs to a published business and satisfies `starts_at <= now < ends_at`, using the application's UTC clock. Highest priority wins, followed by oldest creation time and lowest ID. Scheduled, expired, disabled and unpublished-business ads are excluded. Responses use `Cache-Control: no-store`; clients must refetch to observe expiry.

Returned fields are ID, image path, alternative text, destination, placement and a small business object (`id`, `name`, `slug`, `is_demo`). Clients must label the placement “Reklamë” or “E sponsorizuar”. Advertisements remain separate from business matches and do not change business totals or pagination.

## Errors and verification

Invalid query values return HTTP 422 with Laravel's `message` and field-keyed `errors`. For example, `?page=0`, `?category=missing`, `?sort=unknown` and `?has_hours[]=1` are rejected. The API returns JSON even without an explicit Accept header. Invalid inputs and public 404s do not expose exception classes or stack traces.

The public React homepage `/` uses categories and a regular selection from the business list. `/bizneset` sends the documented search/filter/sort/page parameters directly to the API and restores controls from its URL. It displays the server total and 12-record pages with loading, empty, error and retry states. Business cards and demo advertisements open full profiles at `/bizneset/{slug}`. `/kontakt` explains that platform contact details are not yet configured. No business or taxonomy records are hardcoded in React. Real advertisements use their HTTP(S) destination. Both placements refetch on mount, focus and every 60 seconds, and hide on an empty or failed advertisement response.

Verified on 21 October 2026: the complete MariaDB 10.4.32 suite passed 66 tests/331 assertions; SQLite passed 52/317 with 14 engine-specific tests skipped. The production frontend build, PHP formatting and Composer validation passed. Browser verification covered live records (12 of 26 published demo businesses), loading, backend-unavailable error and retry recovery. MySQL 8 remains untested. T-01–T-14 remain pending until the required complete UI/admin flows are exercised.

Verified on 22 October 2026: public browser search, combined filters, sorting, pagination, URL refresh/back restoration, empty/reset, error/retry and responsive/keyboard behavior. See `acceptance-tests.md` for exact evidence and the remaining pending scenarios. Backend contracts did not change.

## Profile and map frontend — 23 October 2026

Cards and demo ads now navigate to `/bizneset/{slug}` using the existing browser-history router. Profiles fetch the existing public profile endpoint and support direct loading, refresh and Back/Forward. No backend API contract changed. Full descriptions, images, services, published hours and safe contact actions use stored values. Missing/draft/archived records show the same not-found state.

Both profile and directory use the shared Leaflet map. The directory passes only `result.data`, so markers follow the current filters and page. Invalid/missing coordinates are omitted; map failures preserve the surrounding profile/cards and expose retry. Popup text is created as text nodes, not untrusted HTML. Demo advertisements now open the complete business profile instead of the former dialog.

OpenStreetMap is the default tile source. `VITE_MAP_TILE_URL` may override the URL template for controlled local failure tests; it is public build-time configuration, never a place for secrets. Restore the default before building. Using another provider requires its correct attribution and terms. Reference: https://leafletjs.com/reference.html and https://operations.osmfoundation.org/policies/tiles/.

## Administrator session and dashboard — 24 October 2026

The administrator area uses Sanctum's stateful session authentication. All `/api/admin` routes use Laravel's `web` middleware for session cookies and CSRF verification, then the protected group requires both `auth:sanctum` and the administrator flag. No bearer token is stored in React. There is no public registration; the protected business write endpoints are documented below.

The React client first requests `GET /sanctum/csrf-cookie` with credentials. It sends the decoded `XSRF-TOKEN` cookie as `X-XSRF-TOKEN` on POST requests and includes cookies on every admin request. After login Laravel regenerates the session and cookie; the client reads the current CSRF cookie again for logout.

| Request | Access | Result |
| --- | --- | --- |
| `POST /api/admin/login` | Public login endpoint, limited to five attempts per minute | JSON `{ "user": { "name", "email" } }` for valid administrator credentials; no password returned |
| `GET /api/admin/me` | Administrator | Current name and email |
| `GET /api/admin/dashboard` | Administrator | `{ "data": { "published_businesses", "draft_businesses", "archived_businesses", "active_advertisements" } }` |
| `POST /api/admin/logout` | Administrator | Invalidates the session and renews the CSRF token |

The advertisement count uses the same `Advertisement::active()` eligibility rule as the public endpoint: enabled, linked to a published business, started and not expired. It counts every eligible advertisement, even if another ad wins the same public placement. Successful admin responses use `Cache-Control: no-store`.

## Administrator business management — 25 October 2026

All routes below are under the existing stateful `web`, `auth:sanctum` and `admin` middleware. Writes require the session CSRF cookie and `X-XSRF-TOKEN` header. Guests receive 401; signed-in non-administrators receive 403.

| Request | Result |
| --- | --- |
| `GET /api/admin/businesses?q=&status=&page=` | All statuses, name search, optional `draft`/`published`/`archived` filter, 12 per page |
| `GET /api/admin/businesses/{id}` | Full stored business with category, settlement, services, hours and images, including drafts/archives |
| `POST /api/admin/businesses` | Create a draft by default; explicit `status=published` must meet publication rules; returns 201 |
| `PUT /api/admin/businesses/{id}` | Update fields and supplied relationships; omitted relationships remain unchanged |
| `PATCH /api/admin/businesses/{id}/publish` | Publish a complete draft |
| `PATCH /api/admin/businesses/{id}/archive` | Archive a draft or published business without deleting it |
| `POST /api/admin/businesses/{id}/images` | Upload one JPG, PNG or WebP image, at most 5 MB, with `kind` and `alt_text`; returns 201 |
| `DELETE /api/admin/businesses/{id}/images/{imageId}` | Remove only an image belonging to that business |

Writes return `{ "data": { ... } }` with the updated business. The list returns Laravel pagination fields (`data`, `total`, `current_page`, `last_page`, etc.). Invalid input returns 422 with field-keyed errors; nonexistent IDs return 404. Drafts may omit publication fields, but the name is needed for the stored record and slug. A published business requires name, description, existing category and settlement, address, phone, and valid latitude/longitude. For a real business the administrator also confirms that the coordinates match the address; demo records retain `is_demo=true` and remain visibly labeled as simulated. Changing a real address or coordinates requires a fresh confirmation. Removing required information from a published record is rejected.

`services` is an array of existing unique service IDs. `hours` is an array of distinct days (0–6), each closed with null times or open with two different `HH:mm` times; closing after midnight is supported. Supplying either array replaces that relationship, and omitting it preserves the existing rows. Images use Laravel's public disk and keep existing images until individually removed. Run `php artisan storage:link` once wherever uploads must be served. The public API continues to use published-only business queries and advertisement eligibility, so archiving hides profiles, listings, map markers and related advertisements without deleting their rows.

Missing credentials receive 422 validation errors; incorrect credentials receive a generic 422 message. Unauthenticated requests receive 401, authenticated non-administrators receive 403, missing/invalid CSRF tokens receive 419, and excess login attempts receive 429. Frontend routes are `/admin/login` and `/admin/dashboard`; server authorization is enforced for every protected request.

## Administrator category, settlement and service management — 26 October 2026

The administrator pages are `/admin/categories`, `/admin/settlements` and `/admin/services`. Each page lists records, supports a name search, shows the number of linked businesses, and provides create, rename and delete actions. All requests below use the same Sanctum session, CSRF protection and administrator middleware as business management.

| Request | Result |
| --- | --- |
| `GET /api/admin/categories?q=` | Categories with `id`, `name`, `slug`, `businesses_count` |
| `POST /api/admin/categories` | Create from `{ "name": "..." }`; returns 201 |
| `PUT /api/admin/categories/{id}` | Rename from `{ "name": "..." }` |
| `DELETE /api/admin/categories/{id}` | Delete only when no business uses it; otherwise 409 |
| `GET /api/admin/settlements?q=` | Settlements and business counts |
| `POST /api/admin/settlements` | Create from `{ "name": "..." }`; returns 201 |
| `PUT /api/admin/settlements/{id}` | Rename without changing the slug |
| `DELETE /api/admin/settlements/{id}` | Delete only when no business uses it; otherwise 409 |
| `GET /api/admin/services?q=` | Services and business counts |
| `POST /api/admin/services` | Create from `{ "name": "..." }`; returns 201 |
| `PUT /api/admin/services/{id}` | Rename without changing the slug |
| `DELETE /api/admin/services/{id}` | Requires `{ "confirm_name": "exact current name" }`; detaches links and deletes the service |

The optional `q` parameter searches names without case or Albanian accent differences and has a 120-character limit. Names are trimmed, whitespace is normalized, and names must contain 2–120 characters with a usable URL slug. Duplicate names are rejected with a field-specific 422 response. New slugs are generated from the name and receive a numeric suffix if needed; edits preserve the existing slug so public filter URLs remain valid.

Category and settlement deletion checks every related business, regardless of publication status, and the database foreign keys also restrict deletion. Service deletion requires the exact current name because removing it also removes its associations from businesses. Both pivot detachment and deletion run in one transaction; business rows are retained. The public lookup endpoints above immediately reflect changes, so homepage categories, directory filters and administrator business forms use the new values without hardcoded lists. Deleted services disappear from public lookups and profiles.

The complete Day 8 suite passed on MariaDB 10.4.32 (90 tests/578 assertions) and SQLite (90 tests/564 assertions, 14 database-specific skips). T-10 browser evidence and remaining limitations are in `acceptance-tests.md`. Actual MySQL 8 was not tested.
