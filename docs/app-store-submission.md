# HoopsIQ — iOS App Store Submission Guide

Everything already done in the repo, plus the exact steps left that require the
Apple Developer account and Clerk keys.

---

## Current state (done in repo)

| Item | Status |
|---|---|
| Native iOS project (`ios/`, bundle id `com.hoopsiq.app`) | ✅ scaffolded, simulator build succeeds |
| App icons (1024 App Store + all iOS sizes + splash, light/dark) | ✅ generated from brand SVG |
| `Info.plist` usage strings (camera / mic / photo library) | ✅ |
| `ITSAppUsesNonExemptEncryption = false` (skips export-compliance question) | ✅ |
| Account deletion in-app (guideline 5.1.1(v)) | ✅ `/app/settings` → Delete account (first-party auth, verified on prod) |
| First-party auth (admin-managed accounts, master admin seeded) | ✅ replaced Clerk SSO; verified E2E on prod |
| In-app interactive demo (`/demo`, sticky, exit link) | ✅ reviewers can explore the populated sample team without credentials |
| Privacy Policy / Terms / Support pages | ✅ `/privacy`, `/terms`, `/support` (have counsel review before launch) |
| No "coming soon" or dead buttons in UI | ✅ |
| CORS allows `capacitor://localhost` | ✅ |
| API base for native builds | ✅ `pnpm ios:build` bakes in `VITE_API_BASE=https://hoopsos-docs.onrender.com` |

**Production is Render** (`hoopsos-docs.onrender.com`): it serves the SPA and
the full Express API with the database, first-party auth, and Mux configured.
Migrations auto-apply at startup. The Vercel deployment is a legacy duplicate.
Render auto-deploys from `main`. (Clerk SSO is parked — auth is now first-party
email/password; no Clerk setup is needed for launch.)

## Blocked on you

1. **Apple Developer Program** ($99/yr) — enroll at developer.apple.com.
2. **Counsel review** of `/privacy` and `/terms`.
3. **Mux key rotation** — the local `.env` held live Mux credentials; rotate in
   the Mux dashboard and update Render env when convenient (they were never in git).

## Review readiness

- **Reviewer credentials**: create a reviewer account in `/app/admin/users`
  (role Coach, temp password) and paste the credentials into App Review notes.
- **Empty-org risk**: a fresh real account shows an empty org. Mitigate by
  (a) pointing reviewers at the in-app "▶ Explore the interactive demo" in the
  review notes, and (b) lightly seeding the production org (a few players +
  one film) before submission.

## Build & submit steps (once unblocked)

```bash
# 1. Build web assets with the prod API baked in, sync into the iOS project
pnpm ios:build

# 2. Open in Xcode
pnpm cap:ios
```

In Xcode:
1. Target **App** → Signing & Capabilities → select your Team; Xcode manages
   the provisioning profile automatically.
2. Set Version (e.g. 1.0.0) / Build (1) on the General tab.
3. Product → Archive → Distribute App → App Store Connect → Upload.

In App Store Connect (appstoreconnect.apple.com):
1. Create the app record: name **HoopsIQ**, bundle id `com.hoopsiq.app`,
   SKU `hoopsiq-ios`.
2. TestFlight the uploaded build first; invite your testers.
3. Fill the listing (drafts below), attach screenshots, submit for review.

## Listing drafts

- **Name:** HoopsIQ
- **Subtitle (30 chars):** Basketball ops for teams
- **Category:** Sports (secondary: Productivity)
- **Age rating:** 4+ (questionnaire: no objectionable content; app is used by
  minors under parental/coach supervision)
- **Support URL:** https://hoopsos-docs.onrender.com/support
- **Privacy Policy URL:** https://hoopsos-docs.onrender.com/privacy
- **Description (draft):**

  > HoopsIQ is the operating system for basketball programs. Coaches run
  > practice plans, rosters, film review, and player development from one
  > place; athletes get daily readiness check-ins, assignments, and skill
  > tracking; parents stay connected with schedules, forms, and progress
  > reports.
  >
  > • Practice planning and drill library
  > • Roster, attendance, and availability management
  > • Daily readiness check-ins with injury guardrails
  > • Film upload, AI-assisted breakdown, and clip review
  > • Player development plans, assessments, and milestones
  > • Parent portal: schedules, billing, forms, and weekly digests

- **Keywords (100 chars):**
  `basketball,coach,team,practice,roster,film,scouting,player development,youth sports,training`

## Privacy nutrition labels (App Privacy section)

Declare **Data Linked to You**:

| Data type | Purpose |
|---|---|
| Contact info (name, email) | App functionality (account) |
| Health & fitness (readiness check-ins, wearables metrics) | App functionality |
| User content (video uploads, messages, notes) | App functionality |
| Identifiers (user ID) | App functionality |

Data **not** collected: precise location, browsing history, advertising data.
No third-party advertising; no data sold. Tracking: **No**.

## Review-day checklist

- [ ] Demo account for the reviewer (create in Clerk; put credentials in the
      App Review notes — reviewers must be able to sign in without SMS)
- [ ] Verify sign-up → app → Account → Delete account works end to end
- [ ] Verify the app works on a clean device install (no cached demo state)
- [ ] Legal pages reviewed by counsel
- [ ] Push a fresh `pnpm ios:build` so the shell carries the latest web bundle
