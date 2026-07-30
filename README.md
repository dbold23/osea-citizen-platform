# OSEA Citizen Science Platform

The static frontend for OSEA's citizen science platform, submissions, programs, partner onboarding, donations, and an internal moderator queue. Hosted on GitHub Pages for V1; will eventually live at `sightings.oseascience.com`.

The flagship program is the **Broadnose Sevengill Shark** photographic catalogue. Architecture is multi-program from day 1, ready to host any patterned marine species (leopard sharks, eagle rays, etc.). Leopard shark captures are conducted in conjunction with OPEL.

## Local preview

```bash
# any static server will do
python3 -m http.server 8080 --directory .
# open http://localhost:8080
```

## Live site

GitHub Pages is enabled on `main`. Once pushed:

```
https://dbold23.github.io/osea-citizen-platform/
```

Add a custom domain (`sightings.oseascience.com`) in repo Settings → Pages → Custom domain whenever DNS is ready.

## Structure

```
.
├── index.html                              landing page
├── thanks.html                             post-submission confirmation
├── about.html                              about OSEA
├── donate.html                             Stripe-backed donation funnel (placeholder URLs)
├── data-policy.html                        privacy + photo consent + right-to-delete
├── programs/
│   └── sevengill/
│       ├── index.html                      program landing
│       ├── learn.html                      educational content
│       └── submit.html                     "submissions paused" notice (was the form)
├── partners/
│   ├── index.html                          partner directory
│   └── register.html                       partner application
├── admin/
│   └── index.html                          moderator queue stub
└── assets/
    ├── css/main.css                        all styling
    └── js/submit.js                        drag-drop + EXIF + Leaflet + form post (unreferenced while paused)
```

## Aesthetic

Clean app-style form layout, Nunito Sans throughout, aged-paper warm palette with a deep ocean accent, "photo plate" drop zone. An earlier field-notebook treatment (Fraunces/Manrope/DM Mono, section numerals, Roman-numeral steps, corner brackets, rubber-stamp badges) was replaced; some unused CSS from it remains.

## Backend (separate)

The Flask backend lives in a separate repo / Render service: `osea-api.onrender.com`. It is **currently suspended**, which is why submissions are paused (see below).

The form does **not** fall back to a local confirmation when the backend is unreachable. It used to, and that was a bug, not a feature: a submitter whose photograph was dropped still got a thank-you page and a reference number. A sighting is now only confirmed when the backend confirms it, and a failure tells the submitter plainly that nothing was saved. Please don't reintroduce a fallback.

## Submissions are paused

`programs/sevengill/submit.html` serves a notice asking people not to send photographs yet. `assets/js/submit.js` is retained but unreferenced so the form can be restored once the backend is live.

Before reopening, these must be resolved — the privacy policy currently promises things the code does not do:

- `data-policy.html` promises GPS is rounded to a 0.1° grid for anti-poaching, and the form repeated that promise at the point of consent. **Nothing implements it.**
- The policy asserts at-rest encryption, salted IP hashes, and analytics for infrastructure that is not deployed.
- The only contact offered for CCPA/CPRA and GDPR deletion requests is a placeholder address.
- The form had no `method`/`action`, so a JS load failure would fall back to a **GET** putting submitter name and email into the URL query string.

To override the API base URL for local testing:

```html
<script>window.OSEA_API_BASE = 'http://localhost:5000';</script>
```

Add that before `assets/js/submit.js` is loaded.

## What's still TODO

V1 frontend is shipped. Remaining work is on the backend (separate repo) and downstream:

- Flask backend deployed to Render (POST /api/submit, /api/admin/queue, /api/programs, /api/stats, etc.)
- Schema migration on `7Gill/tagger/data/catalog.db` (`migrate_add_citizen.py` in 7Gill repo)
- Mailgun inbound webhook for email submissions
- iNaturalist sync worker
- Stripe Payment Links replacing the placeholder URLs on `donate.html`
- Real CAPTCHA (Cloudflare Turnstile or hCaptcha) on the submission form
- Hook up `/admin/` to the real queue API

## License

The platform code is open source under the MIT License (see `LICENSE`). Submitted photographs are licensed separately by their submitters under OSEA's research-use grant; see `/data-policy.html`.
