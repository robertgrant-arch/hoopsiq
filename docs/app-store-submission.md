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
| Account deletion in-app (guideline 5.1.1(v)) | ✅ `/app/settings` → Delete account (active with Clerk) |
| Privacy Policy / Terms / Support pages | ✅ `/privacy`, `/terms`, `/support` (have counsel review before launch) |
| No "coming soon" or dead buttons in UI | ✅ |
| CORS allows `capacitor://localhost` | ✅ |
| API base for native builds | ✅ `pnpm ios:build` bakes in `VITE_API_BASE=https://hoopsos-docs.vercel.app` |

## Blocked on you

1. **Clerk keys** — create a production instance at clerk.com, then:
   - Vercel env: `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` → redeploy.
   - In the Clerk dashboard add `capacitor://localhost` to allowed origins
     (Configure → Domains / native applications) so auth works inside the iOS shell.
   - Local iOS builds: put `VITE_CLERK_PUBLISHABLE_KEY` in `.env` before `pnpm ios:build`.
2. **Apple Developer Program** ($99/yr) — enroll at developer.apple.com.
3. **Mux key rotation** — the local `.env` held live Mux credentials; rotate in the
   Mux dashboard and update Vercel env when convenient (they were never in git).

## Build & submit steps (once unblocked)

```bash
# 1. Build web assets with prod API + Clerk key, sync into the iOS project
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
- **Support URL:** https://hoopsos-docs.vercel.app/support
- **Privacy Policy URL:** https://hoopsos-docs.vercel.app/privacy
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
