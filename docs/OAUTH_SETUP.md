# Google OAuth Setup Guide

Complete step-by-step instructions for configuring Google OAuth so that novatab's
**Sign in with Google** and **Drive sync** features work.

You will need a Google account and access to [Google Cloud Console](https://console.cloud.google.com/).
Total time: about 10 minutes.

---

## STEP 1 — Create or select a GCP project

**Where:** <https://console.cloud.google.com/projectselector2/home/dashboard>

1. Click the project dropdown in the top-left header bar.
2. Click **New Project**.
3. Name it anything — e.g. `novatab`. Click **Create**.
4. Wait ~10 seconds. Confirm the new project is selected in the top-left dropdown.

**Expected result:** The dashboard header shows your project name.

**Common mistake:** Working inside a Google Workspace org project instead of your
personal account. Personal projects appear under "No Organization".

---

## STEP 2 — Enable the Google Drive API

**Where:** <https://console.cloud.google.com/apis/library/drive.googleapis.com>

1. Confirm the correct project is selected (top-left dropdown).
2. Click **Enable**.

**Expected result:** The page changes to show "Google Drive API — API enabled".

**Common mistake:** Enabling the API on the wrong project. Always verify the project
name in the header before clicking Enable.

---

## STEP 3 — Configure the OAuth Consent Screen

**Where:** APIs & Services → OAuth consent screen
<https://console.cloud.google.com/apis/credentials/consent>

1. **User Type:** select **External**. Click **Create**.

2. **App information screen:**
   - App name: `novatab`
   - User support email: your email address
   - Developer contact email: your email address
   - Leave App logo, App domain, and Authorized domains blank.
   - Click **Save and Continue**.

3. **Scopes screen:**
   - Click **Add or Remove Scopes**.
   - In the filter box, search for and add each of these three scopes:

     ```
     https://www.googleapis.com/auth/userinfo.email
     https://www.googleapis.com/auth/userinfo.profile
     https://www.googleapis.com/auth/drive.appdata
     ```

   - Click **Update**, then **Save and Continue**.

4. **Test Users screen:**
   - Click **+ Add Users**.
   - Enter the Google account email(s) that will use the extension during testing.
     You must add yourself here or sign-in will return "access_denied".
   - Click **Add**, then **Save and Continue**.

5. Review the summary and click **Back to Dashboard**.

**Expected result:** Consent screen status shows "Testing" with your three scopes listed.

**Common mistake:** Skipping the Test Users step. Without adding your own email,
Google blocks sign-in with "access_denied" even when everything else is correct.

---

## STEP 4 — Find Your Extension ID

**Where:** chrome://extensions (in Chrome with Developer Mode on)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle) if not already on.
3. If the extension is not loaded yet: click **Load unpacked** → select the
   project root folder.
4. Find **novatab** in the list. Copy the ID shown beneath the name — it is a
   32-character lowercase string, e.g.:

   ```
   abcdefghijklmnopqrstuvwxyzabcdef
   ```

**Expected result:** A 32-character ID visible under the extension name.

**Common mistake:** Loading the extension from a different folder generates a new ID,
which breaks the redirect URI you configure in the next step.

---

## STEP 5 — Create OAuth 2.0 Credentials

**Where:** APIs & Services → Credentials → Create Credentials → OAuth client ID
<https://console.cloud.google.com/apis/credentials>

1. Click **Create Credentials** → **OAuth client ID**.
2. **Application type:** select **Chrome Extension**.
   *(If "Chrome Extension" is not listed, select "Web application" — see Step 6 for
   the redirect URI you must add in that case.)*
3. **Name:** `novatab extension` (internal only).
4. **Item ID / Application ID:** paste your 32-character extension ID from Step 4.
5. Click **Create**.
6. A dialog appears with **Your Client ID** — copy it. It ends in
   `.apps.googleusercontent.com`.

**Expected result:** A Client ID is displayed. You do not need the Client Secret.

**Common mistake:** Selecting "Web application" instead of "Chrome Extension" without
also adding the redirect URI in Step 6.

---

## STEP 6 — Set the Authorised Redirect URI

**Where:** APIs & Services → Credentials → click your OAuth client → **Edit** (pencil icon)

### If you chose "Chrome Extension" in Step 5

The redirect URI is set automatically from the Application ID you entered.
No manual URI entry is needed. Verify the extension ID in the **Item ID** field
and click **Save**.

### If you chose "Web application" in Step 5

Under **Authorised redirect URIs**, click **+ Add URI** and enter:

```
https://YOUR_EXTENSION_ID.chromiumapp.org/
```

Replace `YOUR_EXTENSION_ID` with your 32-character ID from Step 4.
For example:

```
https://abcdefghijklmnopqrstuvwxyzabcdef.chromiumapp.org/
```

Click **Save**.

**Expected result:** The URI appears in the list without any error message.

**Common mistake:** Missing the trailing slash `/`. Chrome's identity API generates
a redirect URL that ends in `/`. Without it, Google returns a
`redirect_uri_mismatch` error and sign-in fails silently.

---

## STEP 7 — Add the Client ID to the project

**Where:** `manifest.json` line 21 and `app.js` line 8 in your project folder

1. Copy the **Client ID** from Step 5 (the string ending in `.apps.googleusercontent.com`).

2. Open `manifest.json`. Replace the existing `client_id` value:

   ```json
   "oauth2": {
     "client_id": "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
     ...
   }
   ```

3. Open `app.js`. Replace the `GOOGLE_CLIENT_ID` constant at the top of the file:

   ```js
   const GOOGLE_CLIENT_ID = "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";
   ```

4. Save both files. Reload the extension on `chrome://extensions`.

**Expected result:** Clicking "Sign in with Google" opens Google's consent screen and
completes successfully.

**Common mistake:** Updating `manifest.json` but forgetting `app.js` (or vice versa).
The PKCE flow reads the value from `app.js`. The `manifest.json` value is used by
`chrome.identity.getAuthToken`, which this extension does not call — but keeping them
in sync avoids confusion.

> **Never commit a client_secret.** The PKCE flow does not use one. If you see a
> "Client secret" field in Google Console, ignore it.

---

## Verification

After completing all seven steps:

1. Open a new tab in Chrome.
2. Click the avatar button (top-right of the topbar).
3. Click **Sign in with Google**.
4. Google's consent screen opens in a popup.
5. Approve the permissions.
6. The popup closes. The sidebar sync card shows your account name and "Synced".

If it fails, check:

| Symptom | Likely cause |
|---|---|
| Popup opens but immediately closes | Redirect URI mismatch — check Step 6 |
| "access_denied" | Your account is not in the Test Users list — check Step 3 |
| Popup never opens | Extension ID changed — reload extension from same folder, recopy ID |
| "Sync failed" after sign-in | Drive API not enabled — check Step 2 |
| Everything looks right but still fails | Check `chrome://extensions` → novatab → **Errors** for details |
