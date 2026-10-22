# Public directory API

All endpoints are read-only and available without login. Use `Accept: application/json`. Locally, Laravel runs on `http://127.0.0.1:8000`; Vite forwards the same `/api` paths from port 5173. There are no administrative write endpoints in this stage.

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

The public React homepage `/` uses categories and a regular selection from the business list. `/bizneset` sends the documented search/filter/sort/page parameters directly to the API and restores controls from its URL. It displays the server total and 12-record pages with loading, empty, error and retry states. Business cards open an accessible summary using the profile endpoint; the full profile and map remain for their later stage. `/kontakt` explains that platform contact details are not yet configured. No business or taxonomy records are hardcoded in React. Demo advertisements open their associated business summary; real advertisements use their HTTP(S) destination. Both placements refetch on mount, focus and every 60 seconds, and hide on an empty or failed advertisement response.

Verified on 21 October 2026: the complete MariaDB 10.4.32 suite passed 66 tests/331 assertions; SQLite passed 52/317 with 14 engine-specific tests skipped. The production frontend build, PHP formatting and Composer validation passed. Browser verification covered live records (12 of 26 published demo businesses), loading, backend-unavailable error and retry recovery. MySQL 8 remains untested. T-01–T-14 remain pending until the required complete UI/admin flows are exercised.

Verified on 22 October 2026: public browser search, combined filters, sorting, pagination, URL refresh/back restoration, empty/reset, error/retry and responsive/keyboard behavior. See `acceptance-tests.md` for exact evidence and the remaining pending scenarios. Backend contracts did not change.
