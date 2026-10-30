# Sourced public locations for the final map demonstration

This is an **optional** dataset and is not part of the 30 illustrative business profiles used by the base QA suites. These three listings reference existing businesses, not fictional storefronts. Sources were reviewed on **29–30 October 2026**; some business-provided publications are older than that review. Business details can change; request corrections before relying on them for an actual visit.

## Records and evidence

| Business | Address and phone evidence | Map location evidence | Stored point (lat, lon) |
| --- | --- | --- | --- |
| Restaurant Mangall | [Official website](https://mangall-restaurant.com/contact-us/) publishes Nallban Qeshme, Janjevë, Lipjan, telephone +383 48 777 285 and email mangallrestaurant@gmail.com | [OpenStreetMap mapped restaurant building](https://www.openstreetmap.org/way/1077497580), also shown on [Mapcarta](https://mapcarta.com/W1077497580) | 42.56316, 21.21836 |
| Neptun Lipjan | [Neptun's official store brochure](https://www.neptun-ks.com/content/BroshuraBGdhjetor.pdf) and [official November 2025 brochure](https://www.neptun-ks.com/content/Broshura0BGNENTOR2025.pdf) list the Lipjan branch at Rr. Avdi Kelmendi with telephone **045 999 520**. These are dated publications, not proof that the telephone is unchanged today. | [OpenStreetMap Neptun shop node](https://www.openstreetmap.org/node/5984891118), also shown on [Mapcarta](https://mapcarta.com/N5984891118) | 42.52698, 21.11888 |
| Ramjani SH.P.K. | [Company contact page](https://ramjani.com/contact-us/) publishes Babush i Muhaxherëve, telephone +383 44 111 006, email info@ramjani.com, and a map link | The company's own contact page links coordinates directly to a map | 42.463137568, 21.172392443 |

**Precision:** These pins are source-backed business-location points, not independently surveyed entrances. Mangall's mapped point is associated with the restaurant building; Neptun's is a mapped shop node; Ramjani's comes from the company's map link. Do not state that the exact entrance to each building was independently verified. The Ramjani homepage has a slightly different nearby coordinate pair; for this dataset we use the company's explicit contact-page map link and document that distinction.

Descriptions summarize the business's publicly described activity. No third-party logos or business photos were copied. When photographs are unavailable, the existing accessible placeholder is shown.

## Use on the local presentation instance

From `backend/`, after normal database setup and `php artisan db:seed`:

```powershell
php artisan db:seed --class=VerifiedLipjanBusinessesSeeder
```

The command adds up to three published, sourced listings and the settlement **Babush i Muhaxherëve**, if absent. It preserves the original 30 illustrative profiles. A typical fresh database will then contain **33 businesses, 29 published, two drafts, and two archived**, and **five settlements**.

Re-running the optional seeder does not duplicate records or overwrite already existing listings with those slugs; administrator changes are preserved. The default `DatabaseSeeder` intentionally remains unchanged, so prior acceptance-suite count assertions remain valid.

The listing and profile maps only show businesses on the active result page or profile; they will not show all three pins simultaneously unless the active page contains all three. Search `Mangall`, `Neptun`, or `Ramjani` to inspect each profile and directions URL. The `has_website=1` filter should find all three on a newly seeded development database.

## Remaining limitations

- Live phone/email handlers and an external directions application still require device-level verification. **T-06 remains Pending** until its specified evidence is actually collected.
- Existing illustrative businesses intentionally remain without invented precise address or coordinates; their profile still shows a truthful no-location state.
- This optional seeder does not provide a public Contact-page administrator destination.
- The final project remains a student project, not an official municipal registry. Data-source links are not claims of endorsement from the listed businesses.
- Validate the point and latest details before making a public deployment. The local application has no mechanism to synchronize external business updates.

## Data provenance

Company-supplied and OpenStreetMap-derived data is attributed via the source links above. OpenStreetMap data is licensed under the [Open Database License](https://www.openstreetmap.org/copyright). Map tiles retain their own visible attribution in Leaflet.
