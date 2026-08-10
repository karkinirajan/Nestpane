# Chrome Web Store Submission Checklist — Privacy & Data Disclosure

A worksheet for the CWS Developer Dashboard's **Privacy practices** tab and the Google OAuth consent screen, based on the policy in [`privacy.html`](../privacy.html). Fill these in when submitting llmaotab (and reuse for Edge/Opera add-on stores later — their privacy forms ask nearly identical questions).

---

## 1. Privacy policy URL

Host `privacy.html` somewhere public and paste that URL into:

- CWS Dashboard → **Privacy practices** tab → "Privacy policy"
- Google Cloud Console → **OAuth consent screen** → "Application privacy policy link"

Easiest option: enable **GitHub Pages** (repo Settings → Pages → Deploy from branch → `main` → `/ (root)`). That gives you:

```
https://<your-github-username>.github.io/llmaotab/privacy.html
```

(Note: GitHub Pages for a *private* repo requires GitHub Pro/Team. If the repo stays private, host `privacy.html` on any static host instead — Netlify/Vercel/Cloudflare Pages all work with a single HTML file.)

---

## 2. Single purpose description

> llmaotab replaces Chrome's default new tab page with a single productivity dashboard — bookmarks, notes, tasks, calendar, focus timer, and an optional AI assistant. All data is stored on the user's own device via chrome.storage.local; the only off-device transfers are ones the user turns on themselves (Google Drive backup to their private appdata folder, or AI features using their own API key).

---

## 3. Permission justifications

Paste into the **Permissions** tab, one box per permission:

| Permission | Justification text |
|---|---|
| `tabs` | Used to list the user's open tabs for the Tab Sessions, Smart Organize, and Omni-Search features, and to switch focus to a tab the user selects from search results. |
| `bookmarks` | Used to read and write the user's Chrome bookmarks for the built-in Bookmark Manager, including importing existing bookmarks into workspaces. |
| `history` | Used to search the user's browsing history for the History viewer, Analytics view, and Omni-Search — rendered locally and never transmitted. |
| `downloads` | Used to display the user's recent downloads in the Downloads viewer. |
| `storage` | Used to persist all user data (workspaces, notes, tasks, settings, etc.) locally via chrome.storage.local. |
| `topSites` | Used to display the user's most-visited sites in the Analytics view. |
| `identity` | Used to let the user optionally sign in with Google (OAuth + PKCE) to enable Drive backup/sync of their own data. |
| `identity.email` | Used to display the email address of the user's signed-in Chrome profile as a label in the sync card. |
| `geolocation` | Used to auto-detect the user's city for the Weather widget; the user can enter a city manually instead. |
| `declarativeNetRequest` | Used to block sites the user has chosen while a Focus Mode session is active — evaluated entirely on-device. |
| `notifications` | Used to notify the user when a Focus timer session completes and when habits remain untracked for the day. |
| `search` | Used to submit a query the user types in the command bar to their own default search engine via chrome.search.query, so no search engine is hardcoded. |

### Host permission justifications

| Host(s) | Justification |
|---|---|
| `wttr.in` | Weather data for the Weather widget |
| `fonts.googleapis.com`, `fonts.gstatic.com` | Loading Inter / Playfair Display fonts |
| `www.googleapis.com`, `oauth2.googleapis.com` | Google sign-in and optional Drive appdata sync |
| `motivational-spark-api.vercel.app` | Daily motivational quote |
| `ipwho.is`, `nominatim.openstreetmap.org` | IP- or GPS-based city detection for weather |
| `picsum.photos` | Random wallpaper images |
| `api.anthropic.com` | Optional AI features — contacted only if the user enables AI and supplies their own Anthropic API key |

---

## 4. Data usage disclosure ("What user data do you plan to collect")

Check **only** these categories:

- ✅ **Authentication information** — Google OAuth tokens, stored locally, used only for Drive sync
- ✅ **Website content** — bookmarks/notes/tasks/etc. the user creates, stored locally
- ✅ **Location** — only relevant if geolocation is used for weather
- ✅ **Web history** — used locally for History viewer / Analytics / Omni-search, never transmitted

Leave **unchecked**: Health info, Financial/payment info, Personal communications, Personal identifiers beyond the sign-in email already covered by Google's own OAuth scopes.

For each checked category, the dashboard asks four follow-up questions — answer all of them **No**:

1. "...used or shared for purposes unrelated to the single purpose?" → **No**
2. "...sold to third parties?" → **No**
3. "...transferred for purposes unrelated to the item's core functionality?" → **No**
4. "...used to determine creditworthiness or for lending?" → **No**

These answers are accurate for llmaotab as built — no ads, no analytics, no data sale.

---

## 5. Certification

The Privacy practices tab ends with a certification that you comply with the Developer Program Policies (no deceptive behavior, accurate disclosures, etc.). This is true for llmaotab as documented — check it.

---

## 6. Google OAuth consent screen verification

llmaotab requests `userinfo.email`, `userinfo.profile`, and `drive.appdata` via an "External" OAuth client. Once real users sign in, Google generally requires **OAuth app verification**:

1. In Google Cloud Console → OAuth consent screen, add the privacy policy URL from §1 and a homepage URL (your CWS listing page works).
2. `drive.appdata` is a **non-sensitive** scope (restricted to the app's own hidden folder) — this does **not** require Google's CASA security assessment, only the standard "basic" review (typically a few days).
3. Until verified, users may see an "unverified app" warning on first sign-in. It doesn't block sign-in but looks unpolished — submit for verification around launch time, not after.

---

## 7. Other pre-submission items

Carried over from `MONETIZATION.md` §4 — recheck before hitting Submit:

- [ ] Add a `LICENSE` file (decide proprietary vs. open-source before listing publicly)
- [ ] Promo assets: 1280×800 large promo tile, 440×280 small tile, 3–5 screenshots of the actual UI
- [ ] `newtab.html` Settings → About now links to the privacy policy — update the placeholder URL once GitHub Pages (or your chosen host) is live
- [ ] Consider switching the Google OAuth client to the **"Chrome Extension"** type, which removes the need for the embedded `GOOGLE_CLIENT_SECRET`

---

## 8. Reusing this for Edge / Opera / other stores

Microsoft Edge Add-ons and Opera Add-ons ask for the same privacy policy URL and a near-identical data-collection disclosure. Once the CWS submission is approved, resubmitting to those stores with the same `privacy.html` URL and the same answers from §3–§4 should require minimal extra work — that's the "one MP at a time" step after CWS.
