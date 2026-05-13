# OSEA Citizen Science Platform

The static frontend for OSEA's citizen science platform, submissions, programs, partner onboarding, donations, and an internal moderator queue. Hosted on GitHub Pages for V1; will eventually live at `sightings.oseascience.com`.

The flagship program is the **Broadnose Sevengill Shark** photographic catalogue. Architecture is multi-program from day 1, ready to host any patterned marine species (leopard sharks, eagle rays, etc.). Leopard sharks caputures in conjucntion with OPEL.

## Local preview

```bash
# any static server will do
python3 -m http.server 8080 --directory .
# open http://localhost:8080
```

## Live site

GitHub Pages is enabled on `main`. Once pushed:

```
https://<github-user>.github.io/osea-citizen-platform/
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
│       └── submit.html                     the submission form (centerpiece)
├── partners/
│   ├── index.html                          partner directory
│   └── register.html                       partner application
├── admin/
│   └── index.html                          moderator queue stub
└── assets/
    ├── css/main.css                        all styling
    └── js/submit.js                        drag-drop + EXIF + Leaflet + form post
```

## Aesthetic

Naturalist field-notebook editorial, Fraunces (display) + Manrope (body) + DM Mono (data). Aged-paper warm palette with deep ocean accent. Section numerals (`§ I`), Roman-numeral steps, "photo plate" drop zone with corner brackets, rubber-stamp status badges. Distinct from generic ocean-conservation sites by design.

## Backend (separate)

The Flask backend lives in a separate repo / Render service: `osea-api.onrender.com`. Until it's deployed, the submission form short-circuits to a local-only confirmation (the form still validates, parses EXIF, and renders the thanks page; the data isn't persisted server-side). The form auto-detects backend availability, once the API is live and reachable, real submissions go through.

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

See the master plan at `~/.claude/plans/frolicking-napping-patterson.md` for the full roadmap.

## License

The platform code is open source under the MIT License (see `LICENSE`). Submitted photographs are licensed separately by their submitters under OSEA's research-use grant; see `/data-policy.html`.
