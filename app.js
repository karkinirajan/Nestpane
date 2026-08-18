"use strict";
// =============================================
//  Nestpane — app.js
//  Author: kneeraazon.com
// =============================================

// OAuth 2.0 credentials: the client_id lives in manifest.json's "oauth2"
// block (Google Cloud Console client type "Chrome Extension"), not here.
// This client type is bound to the extension ID and issues no client_secret
// at all — sign-in and token refresh both go through chrome.identity.getAuthToken()
// below, so there's no secret to leak and no manual token-exchange/refresh
// logic to maintain.

// ===== CHROME API WRAPPER =====
const IS_CHROME = typeof chrome !== "undefined" && !!chrome.runtime?.id;

// The real, CWS-assigned ID for this item — confirmed from a rejection
// email's "Item ID" field, not derived from manifest.json's "key" (a prior
// key in this repo computed to a DIFFERENT id and got the upload rejected:
// "key field value in the manifest doesn't match the current item"). Keep
// this in sync with build.js's PUBLISHED_EXTENSION_ID. The Google Cloud
// Console OAuth client (type "Chrome Extension") is registered against this
// exact extension ID — chrome.identity.getAuthToken() will fail for anyone
// running under a different ID (e.g. unpacked/local dev without a matching
// manifest "key") until that ID is also added in Cloud Console, or the
// "key" field is corrected so local loads get this same ID.
const EXPECTED_EXTENSION_ID = "aokkcpfoompjgeknhbkphogfcjjlbpol";
if (IS_CHROME && chrome.runtime.id !== EXPECTED_EXTENSION_ID) {
  console.warn(
    `[Nestpane] Running as extension ID "${chrome.runtime.id}", expected "${EXPECTED_EXTENSION_ID}". ` +
      "Google sign-in will fail unless this ID is registered on the Chrome Extension OAuth client " +
      "in Google Cloud Console, or manifest.json's \"key\" is corrected to produce the expected ID.",
  );
}

const API = {
  get: (keys) =>
    new Promise((res) => {
      if (IS_CHROME && chrome.storage) {
        chrome.storage.sync.get(keys, res);
      } else {
        const out = {};
        (Array.isArray(keys) ? keys : [keys]).forEach((k) => {
          try {
            out[k] = JSON.parse(localStorage.getItem("ft2_" + k));
          } catch (e) {}
        });
        res(out);
      }
    }),
  set: (data) =>
    new Promise((res) => {
      if (IS_CHROME && chrome.storage) {
        chrome.storage.sync.set(data, res);
      } else {
        Object.entries(data).forEach(([k, v]) =>
          localStorage.setItem("ft2_" + k, JSON.stringify(v)),
        );
        res();
      }
    }),
  getLocal: (keys) =>
    new Promise((res) => {
      if (IS_CHROME && chrome.storage) {
        chrome.storage.local.get(keys, res);
      } else {
        const out = {};
        (Array.isArray(keys) ? keys : [keys]).forEach((k) => {
          try {
            out[k] = JSON.parse(localStorage.getItem("ftL_" + k));
          } catch (e) {}
        });
        res(out);
      }
    }),
  setLocal: (data) =>
    new Promise((res, rej) => {
      if (IS_CHROME && chrome.storage) {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) rej(new Error(chrome.runtime.lastError.message));
          else res();
        });
      } else {
        try {
          Object.entries(data).forEach(([k, v]) =>
            localStorage.setItem("ftL_" + k, JSON.stringify(v)),
          );
          res();
        } catch (e) {
          rej(e);
        }
      }
    }),
  bookmarks: () =>
    new Promise((res) => {
      if (IS_CHROME && chrome.bookmarks) {
        chrome.bookmarks.getTree((tree) => res(tree || []));
      } else {
        // Demo bookmarks for non-Chrome
        res([
          {
            id: "0",
            title: "",
            children: [
              {
                id: "1",
                title: "Bookmarks bar",
                children: [
                  {
                    id: "10",
                    title: "Social Media",
                    children: [
                      {
                        id: "100",
                        title: "YouTube",
                        url: "https://youtube.com",
                      },
                      {
                        id: "101",
                        title: "Twitter / X",
                        url: "https://twitter.com",
                      },
                      {
                        id: "102",
                        title: "Instagram",
                        url: "https://instagram.com",
                      },
                      {
                        id: "103",
                        title: "Facebook",
                        url: "https://facebook.com",
                      },
                      { id: "104", title: "TikTok", url: "https://tiktok.com" },
                    ],
                  },
                  {
                    id: "11",
                    title: "Development",
                    children: [
                      { id: "110", title: "GitHub", url: "https://github.com" },
                      {
                        id: "111",
                        title: "Stack Overflow",
                        url: "https://stackoverflow.com",
                      },
                      {
                        id: "112",
                        title: "MDN Web Docs",
                        url: "https://developer.mozilla.org",
                      },
                      {
                        id: "113",
                        title: "CodePen",
                        url: "https://codepen.io",
                      },
                    ],
                  },
                  {
                    id: "12",
                    title: "Design Resources",
                    children: [
                      { id: "120", title: "Figma", url: "https://figma.com" },
                      {
                        id: "121",
                        title: "Dribbble",
                        url: "https://dribbble.com",
                      },
                      {
                        id: "122",
                        title: "Behance",
                        url: "https://behance.net",
                      },
                    ],
                  },
                ],
              },
              {
                id: "2",
                title: "Other bookmarks",
                children: [
                  {
                    id: "20",
                    title: "Tools",
                    children: [
                      { id: "200", title: "Notion", url: "https://notion.so" },
                      { id: "201", title: "Trello", url: "https://trello.com" },
                      {
                        id: "202",
                        title: "Google Drive",
                        url: "https://drive.google.com",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]);
      }
    }),
  history: (query = "") =>
    new Promise((res) => {
      if (IS_CHROME && chrome.history) {
        const ownPrefix = chrome.runtime.getURL("");
        chrome.history.search(
          {
            text: query,
            maxResults: 100,
            startTime: Date.now() - 30 * 86400000,
          },
          (items) =>
            res((items || []).filter((it) => !it.url?.startsWith(ownPrefix))),
        );
      } else {
        res([
          {
            id: "1",
            title: "GitHub",
            url: "https://github.com",
            lastVisitTime: Date.now() - 1800000,
          },
          {
            id: "2",
            title: "Stack Overflow",
            url: "https://stackoverflow.com",
            lastVisitTime: Date.now() - 3600000,
          },
          {
            id: "3",
            title: "MDN Web Docs",
            url: "https://developer.mozilla.org",
            lastVisitTime: Date.now() - 7200000,
          },
          {
            id: "4",
            title: "YouTube",
            url: "https://youtube.com",
            lastVisitTime: Date.now() - 10800000,
          },
          {
            id: "5",
            title: "Google",
            url: "https://google.com",
            lastVisitTime: Date.now() - 14400000,
          },
          {
            id: "6",
            title: "Figma",
            url: "https://figma.com",
            lastVisitTime: Date.now() - 18000000,
          },
          {
            id: "7",
            title: "Notion",
            url: "https://notion.so",
            lastVisitTime: Date.now() - 21600000,
          },
          {
            id: "8",
            title: "Twitter",
            url: "https://twitter.com",
            lastVisitTime: Date.now() - 86400000,
          },
        ]);
      }
    }),
  downloads: () =>
    new Promise((res) => {
      if (IS_CHROME && chrome.downloads) {
        chrome.downloads.search({ limit: 50, orderBy: ["-startTime"] }, res);
      } else {
        res([
          {
            id: 1,
            filename: "/Downloads/project-report.pdf",
            fileSize: 2457600,
            state: "complete",
            startTime: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 2,
            filename: "/Downloads/design-assets.zip",
            fileSize: 15728640,
            state: "complete",
            startTime: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: 3,
            filename: "/Downloads/nodejs-setup.exe",
            fileSize: 31457280,
            state: "complete",
            startTime: new Date(Date.now() - 259200000).toISOString(),
          },
        ]);
      }
    }),
  identity: () =>
    new Promise((res) => {
      if (IS_CHROME && chrome.identity && chrome.identity.getProfileUserInfo) {
        try {
          chrome.identity.getProfileUserInfo(
            { accountStatus: "ANY" },
            (info) => {
              if (chrome.runtime.lastError) {
                res(null);
                return;
              }
              res(info && info.email ? info : null);
            },
          );
        } catch (e) {
          res(null);
        }
      } else {
        res(null);
      }
    }),
  createBookmark: (details) =>
    new Promise((res) => {
      if (IS_CHROME && chrome.bookmarks) {
        chrome.bookmarks.create(details, (node) => res(node || null));
      } else {
        res(null);
      }
    }),
  updateBookmark: (id, changes) =>
    new Promise((res) => {
      if (IS_CHROME && chrome.bookmarks) {
        chrome.bookmarks.update(id, changes, (node) => res(node || null));
      } else {
        res(null);
      }
    }),
  moveBookmark: (id, dest) =>
    new Promise((res) => {
      if (IS_CHROME && chrome.bookmarks) {
        chrome.bookmarks.move(id, dest, (node) => res(node || null));
      } else {
        res(null);
      }
    }),
  removeBookmark: (id) =>
    new Promise((res) => {
      if (IS_CHROME && chrome.bookmarks) {
        chrome.bookmarks.remove(id, () => res(true));
      } else {
        res(false);
      }
    }),
  removeBookmarkTree: (id) =>
    new Promise((res) => {
      if (IS_CHROME && chrome.bookmarks) {
        chrome.bookmarks.removeTree(id, () => res(true));
      } else {
        res(false);
      }
    }),
  deleteHistoryUrl: (url) =>
    new Promise((res) => {
      if (IS_CHROME && chrome.history) {
        chrome.history.deleteUrl({ url }, () => res(true));
      } else {
        res(false);
      }
    }),
  deleteAllHistory: () =>
    new Promise((res) => {
      if (IS_CHROME && chrome.history) {
        chrome.history.deleteAll(() => res(true));
      } else {
        res(false);
      }
    }),
  showDownload: (id) => {
    if (IS_CHROME && chrome.downloads) chrome.downloads.show(id);
  },
};

// ===== SIDEBAR ICON LOOKUP =====
// Inner <svg> markup (no outer <svg> tag) for each icon key, reused by
// renderSidebar() and the group/item icon pickers. Paths are lifted
// verbatim from the icons that used to be hardcoded per-group in
// newtab.html, so the visual language doesn't change.
const SB_ICONS = {
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  google: '<path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M12 12h6.5"/><path d="M12 7v5"/>',
  socials: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  ai: '<path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/>',
  bookmark: '<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  sessions: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  notes: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  journal: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  reading: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  habits: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 6"/><path d="M14 11a5 5 0 0 0-7.07 0L5.5 12.4a5 5 0 0 0 7.07 7.07L14 18"/>',
  nestodo: '<rect x="2" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="18" y="3" width="5" height="16" rx="1"/>',
  workspaces: '<polygon points="12 2 22 8.5 12 15 2 8.5 12 2"/><polyline points="2 15.5 12 22 22 15.5"/>',
};

// Default sidebar shown on a fresh install. Kept lean on purpose — Google/
// Socials/AI ship empty (users add their own links); Home/Personal ship 3
// broadly-useful items each. Item ids are stable strings so migration and
// "already added" checks can key off them.
const DEFAULT_SIDEBAR = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    items: [
      { id: "bookmarks", label: "Bookmarks", icon: "bookmark", kind: "view", view: "bookmarks" },
      { id: "history", label: "History", icon: "history", kind: "view", view: "history" },
      { id: "downloads", label: "Downloads", icon: "download", kind: "view", view: "downloads" },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    icon: "user",
    items: [
      { id: "notes", label: "Notes", icon: "notes", kind: "view", view: "notes" },
      { id: "nestodo", label: "Nestodo", icon: "nestodo", kind: "view", view: "kanban" },
      { id: "journal", label: "Journal", icon: "journal", kind: "view", view: "journal" },
      { id: "reading", label: "Reading Queue", icon: "reading", kind: "view", view: "reading" },
    ],
  },
  { id: "google", label: "Google", icon: "google", items: [] },
  { id: "socials", label: "Socials", icon: "socials", items: [] },
  { id: "ai", label: "AI", icon: "ai", items: [] },
];

// Every "view" kind item that isn't in DEFAULT_SIDEBAR by default but is
// still a real internal view a user might want to add back (Task 9's "Add
// item" picker offers these plus a free-form link option).
const SIDEBAR_ADDABLE_VIEWS = [
  { view: "sessions", label: "Tab Sessions", icon: "sessions" },
  { view: "trash", label: "Trash", icon: "trash" },
  { view: "habits", label: "Habits", icon: "habits" },
];

// ===== DEFAULT DATA =====
// Fresh installs get one flat starter set — no more per-workspace fixtures
// (workspaces were removed as a feature; this is what "Home" used to seed).
const DEFAULT_QUICK_ACCESS = [
    { id: 101, name: "Gmail",           url: "https://mail.google.com" },
    { id: 102, name: "Google Calendar", url: "https://calendar.google.com" },
    { id: 103, name: "Google Drive",    url: "https://drive.google.com" },
    { id: 104, name: "YouTube",         url: "https://youtube.com" },
    { id: 105, name: "Google Maps",     url: "https://maps.google.com" },
    { id: 106, name: "Amazon",          url: "https://amazon.com" },
    { id: 107, name: "Wikipedia",       url: "https://wikipedia.org" },
    { id: 108, name: "Reddit",          url: "https://reddit.com" },
    { id: 109, name: "LinkedIn",        url: "https://linkedin.com/feed" },
    { id: 110, name: "Netflix",         url: "https://netflix.com" },
];

const DEFAULT_FOLDERS = [{ name: "Google" }, { name: "Social Media" }];

const DEFAULT_IMPORTED_BOOKMARKS = [
    // Google Services
    {
      id: "ws1_001",
      title: "Google",
      url: "https://google.com",
      folderName: "Google",
    },
    {
      id: "ws1_002",
      title: "Gmail",
      url: "https://mail.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_003",
      title: "YouTube",
      url: "https://youtube.com",
      folderName: "Google",
    },
    {
      id: "ws1_004",
      title: "Google Drive",
      url: "https://drive.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_005",
      title: "Google Maps",
      url: "https://maps.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_006",
      title: "Google Photos",
      url: "https://photos.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_007",
      title: "Google Docs",
      url: "https://docs.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_008",
      title: "Google Sheets",
      url: "https://sheets.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_009",
      title: "Google Slides",
      url: "https://slides.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_010",
      title: "Google Calendar",
      url: "https://calendar.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_011",
      title: "Google Meet",
      url: "https://meet.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_012",
      title: "Google Translate",
      url: "https://translate.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_013",
      title: "Google News",
      url: "https://news.google.com",
      folderName: "Google",
    },
    {
      id: "ws1_014",
      title: "Google Forms",
      url: "https://forms.google.com",
      folderName: "Google",
    },
    // Social Media
    {
      id: "ws1_101",
      title: "Facebook",
      url: "https://facebook.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_102",
      title: "X (Twitter)",
      url: "https://x.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_103",
      title: "Instagram",
      url: "https://instagram.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_104",
      title: "LinkedIn",
      url: "https://linkedin.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_105",
      title: "Reddit",
      url: "https://reddit.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_106",
      title: "TikTok",
      url: "https://tiktok.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_107",
      title: "Pinterest",
      url: "https://pinterest.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_108",
      title: "WhatsApp Web",
      url: "https://web.whatsapp.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_109",
      title: "Telegram Web",
      url: "https://web.telegram.org",
      folderName: "Social Media",
    },
    {
      id: "ws1_110",
      title: "Discord",
      url: "https://discord.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_111",
      title: "Snapchat",
      url: "https://snapchat.com",
      folderName: "Social Media",
    },
    {
      id: "ws1_112",
      title: "Threads",
      url: "https://threads.net",
      folderName: "Social Media",
    },
];

// Same shape/ids _migrateLegacyTasksIntoKanban used to produce at runtime —
// now baked in directly since there is only ever one board to seed.
const DEFAULT_KANBAN = {
  todo: [
    { id: 2001, title: "Review and merge open pull requests", desc: "", createdAt: 2001, remindAt: null, notified: false },
    { id: 2002, title: "Update project dependencies to latest stable versions", desc: "", createdAt: 2002, remindAt: null, notified: false },
    { id: 2003, title: "Write unit tests for the authentication module", desc: "", createdAt: 2003, remindAt: null, notified: false },
    { id: 2005, title: "Fix navigation layout bug on mobile viewport", desc: "", createdAt: 2005, remindAt: null, notified: false },
  ],
  doing: [],
  done: [
    { id: 2004, title: "Send weekly status report to the team", desc: "", createdAt: 2004, remindAt: null, notified: false },
    { id: 2006, title: "Document design system color tokens in Notion", desc: "", createdAt: 2006, remindAt: null, notified: false },
  ],
};

// Bundled quote list — this used to be topped up from a personal Vercel
// deployment (motivational-spark-api.vercel.app), but that's a dangling-
// subdomain risk: if that project is ever deleted, the *.vercel.app name
// becomes claimable by anyone, who could then serve arbitrary text into
// every installed user's new-tab page. The feature doesn't need to be
// dynamic, so it's bundled and the network call/host permission are gone.
const HERO_QUOTES = [
  { quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { quote: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "Well done is better than well said.", author: "Benjamin Franklin" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "Do not wait to strike till the iron is hot, but make it hot by striking.", author: "William Butler Yeats" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { quote: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { quote: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { quote: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { quote: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { quote: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { quote: "Opportunities don't happen, you create them.", author: "Chris Grosser" },
  { quote: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { quote: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { quote: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { quote: "The harder the conflict, the more glorious the triumph.", author: "Thomas Paine" },
  { quote: "Life is 10% what happens to us and 90% how we react to it.", author: "Charles R. Swindoll" },
  { quote: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
  { quote: "Try not to become a person of success, but rather try to become a person of value.", author: "Albert Einstein" },
  { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { quote: "It is never too late to be what you might have been.", author: "George Eliot" },
  { quote: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { quote: "Winners never quit, and quitters never win.", author: "Vince Lombardi" },
  { quote: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Rohn" },
  { quote: "The mind is everything. What you think you become.", author: "Buddha" },
  { quote: "The best revenge is massive success.", author: "Frank Sinatra" },
  { quote: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
  { quote: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { quote: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { quote: "Whatever the mind can conceive and believe, it can achieve.", author: "Napoleon Hill" },
  { quote: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { quote: "Two roads diverged in a wood, and I—I took the one less traveled by, and that has made all the difference.", author: "Robert Frost" },
  { quote: "I attribute my success to this: I never gave or took any excuse.", author: "Florence Nightingale" },
  { quote: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou" },
  { quote: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { quote: "Our lives begin to end the day we become silent about things that matter.", author: "Martin Luther King Jr." },
  { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { quote: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { quote: "Act as if what you do makes a difference. It does.", author: "William James" },
  { quote: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
  { quote: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { quote: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau" },
  { quote: "When I let go of what I am, I become what I might be.", author: "Lao Tzu" },
  { quote: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { quote: "If you look at what you have in life, you'll always have more.", author: "Oprah Winfrey" },
  { quote: "Change your thoughts and you change your world.", author: "Norman Vincent Peale" },
  { quote: "Nothing is impossible. The word itself says 'I'm possible!'", author: "Audrey Hepburn" },
  { quote: "There is only one way to avoid criticism: do nothing, say nothing, and be nothing.", author: "Aristotle" },
  { quote: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
];

// ===== STATE =====
let S = {
  user: {
    name: "",
    avatarColor: "#7c3aed",
    googlePicture: null,
    googleName: null,
  },
  quickAccess: [],
  notes: [],
  folders: [],
  importedBookmarks: [],
  kanban: { todo: [], doing: [], done: [] },
  reminders: [],
  trash: [],
  settings: {
    theme: "dark",
    accentColor: "#fe8019",
    clockFormat: "12",
    showSeconds: true,
    cardGlow: "glow",
    // Fresh-install defaults: Quick Access has no visibility toggle (always
    // shown) and Calendar/Reminders are the only other widgets on by
    // default — Timer/Notes/To-Do stay available but opt-in via Settings.
    widgets: {
      notes: false,
      timer: false,
      calendar: true,
      todo: false,
      reminders: true,
    },
    sidebarCollapsed: false,
    sidebar: null, // populated by migrateSidebarToDataModel() on first load after this update, or DEFAULT_SIDEBAR on a fresh install
    heroBg: null,
    qaMode: "icon",
    heroQuote: null,
    e2e: { enabled: false },
    focus: { enabled: false, blockedSites: [] },
    ai: { enabled: false },
    aiBriefingCache: null,
    sbLinks: {
      google: [
        { id: 4001, name: "Colab", url: "https://colab.research.google.com" },
        { id: 4002, name: "Firebase", url: "https://firebase.google.com" },
        {
          id: 4003,
          name: "Cloud Console",
          url: "https://console.cloud.google.com",
        },
        { id: 4004, name: "Fonts", url: "https://fonts.google.com" },
        {
          id: 4005,
          name: "Search Console",
          url: "https://search.google.com/search-console",
        },
        { id: 4006, name: "Sheets", url: "https://sheets.google.com" },
        { id: 4007, name: "Meet", url: "https://meet.google.com" },
        { id: 4008, name: "Photos", url: "https://photos.google.com" },
        { id: 4009, name: "Maps", url: "https://maps.google.com" },
        { id: 4010, name: "Keep", url: "https://keep.google.com" },
      ],
      projects: [
        { id: 6001, name: "Asana", url: "https://asana.com" },
        { id: 6002, name: "Jira", url: "https://atlassian.com/software/jira" },
        { id: 6003, name: "ClickUp", url: "https://clickup.com" },
        { id: 6004, name: "Basecamp", url: "https://basecamp.com" },
        { id: 6005, name: "Airtable", url: "https://airtable.com" },
        { id: 6006, name: "Slack", url: "https://slack.com" },
        { id: 6007, name: "Miro", url: "https://miro.com" },
        { id: 6008, name: "Todoist", url: "https://todoist.com" },
        {
          id: 6009,
          name: "Confluence",
          url: "https://atlassian.com/software/confluence",
        },
        { id: 6010, name: "Smartsheet", url: "https://smartsheet.com" },
      ],
      others: [
        { id: 5001, name: "Notion", url: "https://notion.so" },
        { id: 5002, name: "Readwise", url: "https://readwise.io" },
        { id: 5003, name: "Raindrop", url: "https://raindrop.io" },
        // Generic replacements for the former "Hamro Patro" / "Upwork" seeds.
        // migrateSyncSbLinksToQA() mirrors every sbLinks group into Quick
        // Access on boot, so personal-preference entries here land on a
        // fresh install's dashboard regardless of DEFAULT_QUICK_ACCESS. New
        // ids (not 5004/5005) so _topUpSbGroup can never top an existing
        // user's saved list up into two entries sharing one id.
        { id: 5011, name: "Dropbox", url: "https://dropbox.com" },
        { id: 5012, name: "Canva", url: "https://canva.com" },
        { id: 5006, name: "Luma", url: "https://lu.ma" },
        { id: 5007, name: "ProductHunt", url: "https://producthunt.com" },
        { id: 5008, name: "Mobbin", url: "https://mobbin.com" },
        { id: 5009, name: "Clockify", url: "https://clockify.me" },
        { id: 5010, name: "Kagi", url: "https://kagi.com" },
      ],
      socials: [
        { id: 7001, name: "Facebook", url: "https://facebook.com" },
        { id: 7002, name: "TikTok", url: "https://tiktok.com" },
        { id: 7003, name: "Pinterest", url: "https://pinterest.com" },
        { id: 7004, name: "WhatsApp", url: "https://web.whatsapp.com" },
        { id: 7005, name: "Telegram", url: "https://web.telegram.org" },
        { id: 7006, name: "Snapchat", url: "https://snapchat.com" },
        { id: 7007, name: "Threads", url: "https://threads.net" },
        { id: 7008, name: "Twitch", url: "https://twitch.tv" },
        { id: 7009, name: "Mastodon", url: "https://mastodon.social" },
        { id: 7010, name: "Bluesky", url: "https://bsky.app" },
      ],
    },
  },
  allBookmarks: [], // parsed flat array of folders
  timer: { total: 1500, remaining: 1500, running: false, interval: null },
  editingNoteId: null,
  notesViewSearch: "",
  notesViewTagFilter: null,
  bmFolderFilter: null,
  bmSort: "az",
  googleUser: null,
  weatherLocation: null, // null = auto-detect, string = manual city
  // New features
  habits: [],
  readingQueue: [],
  tabSessions: [],
  journal: {},
  _kanbanDragCard: null,
  _kanbanDragCol: null,
  _sbAddLinkGroup: null,
  _kanbanTargetCol: null,
  calEvents: [], // { id, title, date, type, weekday, customDays }
  _calMonth: null, // { year, month } — currently viewed month
  // Google Calendar (read-only) — local cache only, deliberately NOT part of
  // the Drive backup payload: Google Calendar is already the source of
  // truth, so backing it up a second time would just be redundant bloat.
  // Persisted to chrome.storage.local so cached events still show on next
  // boot before the live refetch completes (the "offline" requirement).
  googleCalEvents: [], // { id, title, date, allDay, link }
  _gcalLastSync: 0,
  _gcalStatus: "idle", // idle | loading | connected | unauthorized | error | offline
  _gcalError: null,
  _qaDeleted: new Set(), // normalized URLs of explicitly-deleted QA items (tombstones)
  _cloudResetDone: false, // one-time cloud wipe+reupload has run on this install
  _freshInstall: false, // set by loadState(): storage was empty before this boot (session-only, never persisted)
};

// ===== BOOT =====
document.addEventListener("DOMContentLoaded", async () => {
  // Source the About panel's version from the manifest so it can't drift out of
  // sync with the shipped build the way the hardcoded string previously did.
  const _verEl = document.getElementById("aboutVersion");
  if (_verEl && IS_CHROME && chrome.runtime?.getManifest) {
    _verEl.textContent = "Version " + chrome.runtime.getManifest().version;
  }
  await loadState();
  migrateAddSocials();
  migrateSidebarToDataModel();
  migrateAddNestodoSidebarItem();
  migrateRemoveWorkspacesSidebarGroup();
  renderSidebar();
  migrateSyncSbLinksToQA();
  initClock();
  updateGreeting();
  autoDetectWeather();
  loadHeroBg();
  loadHeroQuote();
  setupEventListeners();
  setupSearch();
  initTooltips();
  _cmdInitKeyboard();
  renderAll();
  loadBookmarks();
  loadHistory("");
  _scheduleHabitNotifications();
  _checkDueReminders();
  setInterval(_checkDueReminders, 60000);
  loadDownloads();
  checkGoogleIdentity();
  _registerLiveStorageSync();

  // Auto-push ~2 s after last edit; pull on visibility regain and sign-in.
  // Other open tabs on this device pick up any change instantly via
  // chrome.storage.onChanged — no polling interval needed either way.

  // Pull when this tab regains focus (switching back from another device's session)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && S.googleUser) pullFromDrive();
  });

  document.addEventListener("keydown", (e) => {
    const inInput = ["INPUT", "TEXTAREA"].includes(e.target.tagName);
    // S.settings.shortcuts stays unset until the user visits Settings and
    // hits Save, so fall back to the same defaults shown in that form —
    // but only when the user has never saved a config at all. Once they
    // have, an empty field there is a deliberate "disable this shortcut"
    // and must stay disabled rather than reverting to the default.
    const kb = S.settings.shortcuts;
    const searchKey = kb ? kb.search ?? "/" : "/";
    const timerKey = kb ? kb.timer ?? "" : "Alt+T";
    const noteKey = kb ? kb.note ?? "" : "Alt+N";
    const taskKey = kb ? kb.task ?? "" : "Alt+K";

    if (!inInput) {
      if (searchKey && _kbMatch(e, searchKey)) { e.preventDefault(); openCmdPalette(); return; }
      if (timerKey && _kbMatch(e, timerKey)) { e.preventDefault(); timerPlay(); return; }
      if (noteKey && _kbMatch(e, noteKey)) { e.preventDefault(); navigateTo("notes"); return; }
      if (taskKey && _kbMatch(e, taskKey)) { e.preventDefault(); openNestodoModal(); return; }
    }
    if (e.key === "Escape") {
      if (el("cmdPaletteOverlay").classList.contains("open")) {
        closeCmdPalette();
        return;
      }
      closeAllModals();
      closeSettings();
      closeFab();
    }
  });
});

// ===== PERSIST =====
// One-time flatten: older saves/backups stored bookmarks, notes, quick
// access, Nestodo, and reminders per-workspace. Workspaces were removed as
// a feature — this merges everything from every workspace into one flat
// set, so upgrading never loses data. Used by both loadState() (local
// storage) and applyCloudData() (a Drive backup that predates the removal).
function _flattenLegacyWorkspaceData(raw) {
  const workspaces = Array.isArray(raw.workspaces) ? raw.workspaces : [];
  const wsData = raw.wsData && typeof raw.wsData === "object" ? raw.wsData : {};
  // kanban/reminders share a storage key with the post-migration flat shape
  // (an object with todo/doing/done, vs. a plain array respectively) — if
  // this ever runs a second time after they've already been written in the
  // new shape (e.g. the legacy workspaces/wsData cleanup lagging behind a
  // save on a later load), reading them as an empty legacy map would wipe
  // the data instead of leaving it alone.
  const kanbanAlreadyFlat =
    raw.kanban && typeof raw.kanban === "object" && !Array.isArray(raw.kanban) &&
    ("todo" in raw.kanban || "doing" in raw.kanban || "done" in raw.kanban);
  const remindersAlreadyFlat = Array.isArray(raw.reminders);
  const legacyKanban = !kanbanAlreadyFlat && raw.kanban && typeof raw.kanban === "object" ? raw.kanban : {};
  const legacyReminders = !remindersAlreadyFlat && raw.reminders && typeof raw.reminders === "object" ? raw.reminders : {};
  const wsIds = workspaces.length
    ? workspaces.map((w) => Number(w.id))
    : [...new Set([...Object.keys(wsData), ...Object.keys(legacyKanban), ...Object.keys(legacyReminders)].map(Number))];

  let quickAccess = [], notes = [], folders = [], importedBookmarks = [];
  let reminders = remindersAlreadyFlat ? [...raw.reminders] : [];
  const kanban = kanbanAlreadyFlat
    ? {
        todo: Array.isArray(raw.kanban.todo) ? [...raw.kanban.todo] : [],
        doing: Array.isArray(raw.kanban.doing) ? [...raw.kanban.doing] : [],
        done: Array.isArray(raw.kanban.done) ? [...raw.kanban.done] : [],
      }
    : { todo: [], doing: [], done: [] };

  wsIds.forEach((id) => {
    const wd = wsData[id];
    if (wd) {
      quickAccess = quickAccess.concat(Array.isArray(wd.quickAccess) ? wd.quickAccess : []);
      notes = notes.concat(Array.isArray(wd.notes) ? wd.notes : []);
      folders = folders.concat(Array.isArray(wd.folders) ? wd.folders : []);
      importedBookmarks = importedBookmarks.concat(Array.isArray(wd.importedBookmarks) ? wd.importedBookmarks : []);
    }
    if (!kanbanAlreadyFlat) {
      const kb = legacyKanban[id];
      if (kb) {
        kanban.todo = kanban.todo.concat(Array.isArray(kb.todo) ? kb.todo : []);
        kanban.doing = kanban.doing.concat(Array.isArray(kb.doing) ? kb.doing : []);
        kanban.done = kanban.done.concat(Array.isArray(kb.done) ? kb.done : []);
      }
    }
    if (!remindersAlreadyFlat) {
      reminders = reminders.concat(Array.isArray(legacyReminders[id]) ? legacyReminders[id] : []);
    }
  });

  quickAccess = _dedupeByUrl(quickAccess);
  importedBookmarks = _dedupeByUrl(importedBookmarks);
  const seenFolders = new Set();
  folders = folders.filter((f) => {
    const key = (f?.name || "").toLowerCase();
    if (!key || seenFolders.has(key)) return false;
    seenFolders.add(key);
    return true;
  });
  const seenCardIds = new Set();
  ["todo", "doing", "done"].forEach((col) => {
    kanban[col] = kanban[col].filter((c) => {
      if (seenCardIds.has(c.id)) return false;
      seenCardIds.add(c.id);
      return true;
    });
  });
  const seenReminderIds = new Set();
  reminders = reminders.filter((r) => {
    if (seenReminderIds.has(r.id)) return false;
    seenReminderIds.add(r.id);
    return true;
  });

  return { quickAccess, notes, folders, importedBookmarks, kanban, reminders };
}

async function loadState() {
  let d = await API.getLocal([
    "user",
    "trash",
    "settings",
    "weatherLocation",
    "quickAccess",
    "notes",
    "folders",
    "importedBookmarks",
    "habits",
    "readingQueue",
    "tabSessions",
    "journal",
    "kanban",
    "reminders",
    "calEvents",
    "googleCalEvents",
    "_gcalLastSync",
    "_savedAt",
    "googleUser",
    "_focusSessions",
    "_focusMinutes",
    "_qaDeleted",
    "_cloudResetDone",
    // Legacy per-workspace keys — read once so _flattenLegacyWorkspaceData
    // can merge them, then removed from storage below.
    "workspaces",
    "activeWsId",
    "wsData",
  ]);
  // One-time migration: pull from sync storage if local is still empty
  if (!d.settings && IS_CHROME && chrome.storage) {
    const synced = await API.get(["user", "trash", "settings", "weatherLocation"]);
    if (synced.settings) {
      d = { ...d, ...synced };
      save();
    }
  }
  // "Genuinely fresh install" = storage held nothing for this profile. This
  // MUST be captured here: before any of the merges below fold the hardcoded
  // defaults in S into the live state, and after the sync-storage fallback
  // above so a profile recovered from sync isn't misread as fresh. Migrations
  // that need to tell "brand new user" from "existing user who never
  // customized a default" have to use this flag — they cannot infer it from a
  // default-seeded field like settings.sbLinks, which is baked into S and is
  // therefore never empty. Session-only: no save()/Drive path persists it.
  S._freshInstall = !(d.settings || d.wsData || d.workspaces || d.quickAccess || d.user);
  S.user = d.user || S.user;
  S.trash = Array.isArray(d.trash) ? d.trash : [];
  // Restore deletion tombstones before merging settings/sbLinks below, since
  // _topUpSbGroup needs S._qaDeleted to avoid re-adding removed links.
  S._qaDeleted = new Set(Array.isArray(d._qaDeleted) ? d._qaDeleted : []);
  S.settings = d.settings
    ? {
        ...S.settings,
        ...d.settings,
        widgets: { ...S.settings.widgets, ...(d.settings.widgets || {}) },
        sbLinks: {
          ...S.settings.sbLinks,
          ...(d.settings.sbLinks || {}),
          // Per-group: keep saved links, but top up to at least 10 with any
          // newly-added defaults the user hasn't already got (by URL).
          others: _topUpSbGroup(d.settings.sbLinks?.others, S.settings.sbLinks.others),
          google: _topUpSbGroup(d.settings.sbLinks?.google, S.settings.sbLinks.google),
          projects: _topUpSbGroup(d.settings.sbLinks?.projects, S.settings.sbLinks.projects),
          socials: _topUpSbGroup(d.settings.sbLinks?.socials, S.settings.sbLinks.socials),
        },
      }
    : S.settings;
  // Self-heal duplicate sidebar links (e.g. left over from id-based merges
  // across versions where default link ids were renumbered).
  ["google", "projects", "others", "socials"].forEach((g) => {
    S.settings.sbLinks[g] = _dedupeByUrl(S.settings.sbLinks[g]);
  });
  S.weatherLocation = d.weatherLocation || null;

  // Bookmarks/notes/quick access/Nestodo/reminders used to be stored per
  // workspace. Workspaces were removed as a feature — flatten everything
  // from every workspace into the shared set exactly once so upgrading
  // never drops data, then stop writing the old keys.
  if (Array.isArray(d.workspaces) || (d.wsData && typeof d.wsData === "object")) {
    const flat = _flattenLegacyWorkspaceData(d);
    S.quickAccess = flat.quickAccess;
    S.notes = flat.notes;
    S.folders = flat.folders;
    S.importedBookmarks = flat.importedBookmarks;
    S.kanban = flat.kanban;
    S.reminders = flat.reminders;
    if (IS_CHROME && chrome.storage?.local) {
      chrome.storage.local.remove(["workspaces", "activeWsId", "wsData"]);
    } else {
      ["workspaces", "activeWsId", "wsData"].forEach((k) => localStorage.removeItem("ftL_" + k));
    }
    save();
  } else if (S._freshInstall) {
    S.quickAccess = DEFAULT_QUICK_ACCESS.map((q) => ({ ...q }));
    S.notes = [];
    S.folders = DEFAULT_FOLDERS.map((f) => ({ ...f }));
    S.importedBookmarks = DEFAULT_IMPORTED_BOOKMARKS.map((b) => ({ ...b }));
    S.kanban = {
      todo: DEFAULT_KANBAN.todo.map((c) => ({ ...c })),
      doing: [],
      done: DEFAULT_KANBAN.done.map((c) => ({ ...c })),
    };
    S.reminders = [];
  } else {
    S.quickAccess = Array.isArray(d.quickAccess) ? d.quickAccess : [];
    S.notes = Array.isArray(d.notes) ? d.notes : [];
    S.folders = Array.isArray(d.folders) ? d.folders : [];
    S.importedBookmarks = Array.isArray(d.importedBookmarks) ? d.importedBookmarks : [];
    S.kanban =
      d.kanban && typeof d.kanban === "object"
        ? { todo: [], doing: [], done: [], ...d.kanban }
        : { todo: [], doing: [], done: [] };
    S.reminders = Array.isArray(d.reminders) ? d.reminders : [];
  }
  // Self-heal duplicate Quick Access / imported-bookmark entries.
  S.quickAccess = _dedupeByUrl(S.quickAccess);
  S.importedBookmarks = _dedupeByUrl(S.importedBookmarks);

  // Load new feature state
  S.habits = Array.isArray(d.habits) ? d.habits : [];
  S.readingQueue = Array.isArray(d.readingQueue) ? d.readingQueue : [];
  S.tabSessions = Array.isArray(d.tabSessions) ? d.tabSessions : [];
  S.journal = d.journal && typeof d.journal === "object" ? d.journal : {};
  S.calEvents = Array.isArray(d.calEvents) ? d.calEvents : [];
  S.googleCalEvents = Array.isArray(d.googleCalEvents) ? d.googleCalEvents : [];
  S._gcalLastSync = typeof d._gcalLastSync === "number" ? d._gcalLastSync : 0;
  S._focusSessions = d._focusSessions && typeof d._focusSessions === "object" ? d._focusSessions : {};
  S._focusMinutes = d._focusMinutes && typeof d._focusMinutes === "object" ? d._focusMinutes : {};
  // Filter any tombstoned URLs out of Quick Access
  if (S._qaDeleted.size) {
    S.quickAccess = S.quickAccess.filter((q) => !S._qaDeleted.has(_normUrl(q.url)));
  }
  S._cloudResetDone = !!d._cloudResetDone;
  S._savedAt = d._savedAt || 0;
  // Restore Google user so the signed-in state survives hard refresh
  if (d.googleUser?.email) S.googleUser = d.googleUser;
  // Drive._fileId intentionally NOT restored from storage — push always POSTs fresh each session
  // each session to avoid 403s when the OAuth client changes.
  applyAccent(S.settings.accentColor);
  applyTheme(S.settings.theme);
  applyCardGlow(S.settings.cardGlow || "glow");
  _syncFocusModeUI();
  _syncAiUI();
  document.body.classList.toggle(
    "sidebar-collapsed",
    !!S.settings.sidebarCollapsed,
  );
  el("sidebarToggleBtn")?.classList.toggle(
    "active",
    !!S.settings.sidebarCollapsed,
  );
  updateAvatarDisplay();
}

function save() {
  S._savedAt = Date.now();
  const p = API.setLocal({
    user: S.user,
    googleUser: S.googleUser,
    trash: S.trash,
    settings: S.settings,
    weatherLocation: S.weatherLocation,
    quickAccess: S.quickAccess,
    notes: S.notes,
    folders: S.folders,
    importedBookmarks: S.importedBookmarks,
    habits: S.habits,
    readingQueue: S.readingQueue,
    tabSessions: S.tabSessions,
    journal: S.journal,
    kanban: S.kanban,
    reminders: S.reminders,
    calEvents: S.calEvents,
    googleCalEvents: S.googleCalEvents,
    _gcalLastSync: S._gcalLastSync,
    _savedAt: S._savedAt,
    _focusSessions: S._focusSessions || {},
    _focusMinutes: S._focusMinutes || {},
    _qaDeleted: [...(S._qaDeleted || new Set())],
  });
  // Debounce cloud push — near-instant (2 s after last change)
  if (S.googleUser) scheduleDriveSync();
  // Never let a storage failure become an uncaught rejection at 100+ call
  // sites that don't (and shouldn't have to) handle it individually — but
  // never let it stay silent either.
  return p.catch((err) => _warnSaveFailed(err));
}

// A failed local-storage write (most commonly QUOTA_BYTES exceeded, since
// this extension doesn't request "unlimitedStorage") must never be silent —
// the UI shows "Saved!" everywhere save() is called, so this is the one
// place that can catch it. Throttled so a burst of failing saves doesn't
// spam the toast.
let _lastSaveFailedToastAt = 0;
function _warnSaveFailed(err) {
  const now = Date.now();
  if (now - _lastSaveFailedToastAt < 10000) return;
  _lastSaveFailedToastAt = now;
  console.error("save() failed:", err);
  showToast(
    "Couldn't save — local storage may be full. Recent changes may be lost.",
    "error",
  );
}

// ===== HELPERS =====
const el = (id) => document.getElementById(id);
const escH = (s) =>
  s
    ? String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
    : "";

// Normalize a user-supplied URL: prepend https:// if missing, block unsafe schemes.
const safeUrl = (raw) => {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : "https://" + trimmed;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    return u.href;
  } catch {
    return "";
  }
};

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};
const fmtTimeAgo = (ms) => {
  const d = Date.now() - ms,
    m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
};
const fmtBytes = (b) => {
  if (!b) return "0 B";
  const k = 1024,
    s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + " " + s[i];
};
const fileIcon = (e) =>
  ({
    pdf: "📄",
    zip: "📦",
    rar: "📦",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    webp: "🖼️",
    mp4: "🎬",
    mkv: "🎬",
    mp3: "🎵",
    wav: "🎵",
    doc: "📝",
    docx: "📝",
    txt: "📝",
    xls: "📊",
    xlsx: "📊",
    csv: "📊",
    exe: "⚙️",
    dmg: "⚙️",
    js: "💻",
    ts: "💻",
    py: "💻",
    html: "💻",
    css: "💻",
  })[e] || "📁";
function debounce(fn, d) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), d);
  };
}
function favSrc(url) {
  try {
    const origin = new URL(url).origin;
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(origin)}&size=64`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=32`;
  }
}

// Bookmark/folder edit state (Chrome native bookmarks)
let _bmEditId = null;
let _bmEditParentId = null;
let _folderEditId = null;
let _folderParentId = "1";
let _openFolderId = null;

// Workspace bookmark/folder edit state
let _wsFolderEditName = null;
let _wsBmEditId = null;
let _wsBmDefaultFolder = null;
let _wsBmFolderValue = null; // currently selected value in custom folder dropdown
let _qaEditId = null;

// Bookmarks/notes/quick access data helpers. wsData() used to look up the
// active workspace's slot in S.wsData; workspaces are gone, so it's now a
// thin proxy onto the flat S fields — get/set both pass straight through,
// so callers that reassign a whole array (`wsData().notes = [...]`) still
// land on S.notes, not a disconnected copy.
const _wsDataProxy = {
  get quickAccess() { return S.quickAccess; },
  set quickAccess(v) { S.quickAccess = v; },
  get notes() { return S.notes; },
  set notes(v) { S.notes = v; },
  get folders() { return S.folders; },
  set folders(v) { S.folders = v; },
  get importedBookmarks() { return S.importedBookmarks; },
  set importedBookmarks(v) { S.importedBookmarks = v; },
};
function wsData() {
  return _wsDataProxy;
}
function wsNotes() {
  return wsData().notes;
}
function wsQA() {
  return wsData().quickAccess;
}
function wsBookmarks() {
  const d = wsData();
  if (!d.importedBookmarks) d.importedBookmarks = [];
  return d.importedBookmarks;
}
function wsFolders() {
  return wsData().folders;
}

// Returns all folder names: explicit empty ones first, then any derived from bookmarks not yet in the explicit list
function allWsFolderNames() {
  const explicit = wsFolders().map((f) => f.name);
  const seen = new Set(explicit);
  wsBookmarks().forEach((b) => {
    const k = b.folderName || "Other";
    if (!seen.has(k)) {
      seen.add(k);
      explicit.push(k);
    }
  });
  return explicit;
}

// ===== CLOCK =====
let clockInterval = null;
function initClock() {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}
function updateClock() {
  const n = new Date();
  let h = n.getHours(),
    m = n.getMinutes(),
    s = n.getSeconds();
  let ampm = "";
  if (S.settings.clockFormat === "12") {
    ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
  }
  let str = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  if (S.settings.showSeconds) str += `:${String(s).padStart(2, "0")}`;
  el("clockDisplay").textContent = str;
  el("clockAmPm").textContent = ampm;
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  el("dateDisplay").textContent =
    `${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}, ${n.getFullYear()}`;
}

function updateGreeting() {
  const h = new Date().getHours();
  const g =
    h >= 5 && h < 12
      ? "Good morning"
      : h >= 12 && h < 17
        ? "Good afternoon"
        : h >= 17 && h < 21
          ? "Good evening"
          : "Good night";
  el("greetingText").textContent = S.user.name
    ? `${g}, ${S.user.name} 👋`
    : `${g}! 👋`;
}

// ===== WEATHER =====
async function fetchWeather(locationOverride) {
  const loc =
    locationOverride !== undefined ? locationOverride : S.weatherLocation;
  const url = loc
    ? `https://wttr.in/${encodeURIComponent(loc)}?format=j1`
    : "https://wttr.in/?format=j1";
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) throw new Error("bad response");
    const d = await r.json();
    const c = d.current_condition[0];
    const a = d.nearest_area[0];
    const apiCity = a.areaName[0]?.value || "";
    const country = a.country[0]?.value || "";
    const isCoords = loc && /^-?\d+\.\d+,-?\d+\.\d+$/.test(loc);
    const isManual = loc && !isCoords;
    // Auto-detect: show city name only. Manual entry: show what user typed.
    const cityName = isManual ? loc : apiCity || country || "Unknown";
    el("weatherIcon").textContent = weatherEmoji(parseInt(c.weatherCode));
    el("weatherTemp").textContent = c.temp_C + "°C";
    el("weatherCity").textContent = cityName;
    el("weatherDesc").textContent = c.weatherDesc?.[0]?.value || "";
    // Render 3-day forecast
    const forecastEl = el("weatherForecast");
    if (forecastEl && d.weather && d.weather.length) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      forecastEl.innerHTML = d.weather
        .slice(0, 3)
        .map((w) => {
          const date = new Date(w.date + "T00:00:00");
          const isToday = w.date === _dateKey(new Date());
          const label = isToday ? "Today" : days[date.getDay()];
          const code = parseInt(
            w.hourly?.[4]?.weatherCode || w.hourly?.[0]?.weatherCode || "113",
          );
          const emoji = weatherEmoji(code);
          return `<div class="weather-forecast-day">
          <span class="wf-day">${escH(label)}</span>
          <span class="wf-icon">${escH(emoji)}</span>
          <span class="wf-hi">${escH(String(parseInt(w.maxtempC, 10) || 0))}°</span>
          <span class="wf-lo">${escH(String(parseInt(w.mintempC, 10) || 0))}°</span>
        </div>`;
        })
        .join("");
    }
    return true;
  } catch {
    el("weatherCity").textContent = "Unavailable";
    el("weatherDesc").textContent = "";
    return false;
  }
}

// Detect city from IP — uses ipwho.is (free, no Cloudflare block)
// Returns true if a city was resolved and weather fetched successfully.
async function detectByIP() {
  try {
    const r = await fetch("https://ipwho.is/", {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error("ipwho fail");
    const d = await r.json();
    const cityName = d.city || d.region || null;
    if (cityName) {
      const ok = await fetchWeather(cityName);
      if (ok) {
        S.weatherLocation = cityName;
        save();
        return true;
      }
    }
  } catch {}
  // Fallback: let wttr.in detect from the extension's outgoing IP
  await fetchWeather(undefined);
  return false;
}

// Reverse-geocode GPS coords to city via Nominatim (OpenStreetMap) — no key needed
async function reversGeocode(lat, lon) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: { "Accept-Language": "en" },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!r.ok) throw new Error();
    const d = await r.json();
    // city > town > village > county, in order of preference
    return (
      d.address?.city ||
      d.address?.town ||
      d.address?.village ||
      d.address?.county ||
      null
    );
  } catch {
    return null;
  }
}

// ipwho.is → (GPS → Nominatim fallback) → wttr.in bare IP
//
// IP-based detection is tried FIRST, not GPS+Nominatim. Two reasons: it
// needs no geolocation permission prompt on a fresh install, and it cuts
// Nominatim call volume across the whole install base, since GPS+reverse-
// geocoding now only runs for the minority of users whose IP-based city
// lookup failed — Nominatim is a shared, volunteer-funded instance with a
// ~1req/s unattributed-use policy.
async function autoDetectWeather() {
  if (S.weatherLocation) {
    fetchWeather(S.weatherLocation);
    return;
  }
  el("weatherCity").textContent = "Detecting...";
  el("weatherTemp").textContent = "--°C";
  el("weatherDesc").textContent = "";

  const gotCity = await detectByIP();
  if (gotCity || !navigator.geolocation) return;
  // This runs automatically at boot, not from a click — can't call
  // chrome.permissions.request() here (Chrome silently denies prompts
  // outside a user gesture). Only proceed if geolocation was already
  // granted (e.g. via the manual "Detect" button); otherwise IP-based
  // detection above is already the result.
  if (IS_CHROME && chrome.permissions) {
    const has = await chrome.permissions
      .contains({ permissions: ["geolocation"] })
      .catch(() => false);
    if (!has) return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const city = await reversGeocode(lat, lon);
      if (city) {
        const ok = await fetchWeather(city);
        if (ok) {
          S.weatherLocation = city;
          save();
        }
      }
    },
    () => {},
    { timeout: 7000, maximumAge: 600000 },
  );
}

// Force re-detect (clears saved location first)
async function reDetectWeather() {
  S.weatherLocation = null;
  save();
  autoDetectWeather();
}

// Weather location modal
function openWeatherLocationModal() {
  el("weatherLocationInput").value = S.weatherLocation || "";
  el("weatherLocationStatus").textContent = "";
  openModal("weatherLocationModal");
}

async function saveWeatherLocation() {
  const city = el("weatherLocationInput").value.trim();
  if (!city) {
    showToast("Enter a city name", "error");
    return;
  }
  el("weatherLocationStatus").textContent = "Checking...";
  const ok = await fetchWeather(city);
  if (ok) {
    S.weatherLocation = city;
    save();
    closeModal("weatherLocationModal");
    showToast(`Weather set to ${city}`, "success");
  } else {
    el("weatherLocationStatus").textContent =
      "⚠ City not found. Try a different name.";
  }
}

async function detectWeatherLocation() {
  const status = el("weatherLocationStatus");
  status.textContent = "📡 Detecting your location...";
  if (!navigator.geolocation) {
    status.textContent = "⚠ Geolocation not supported by this browser.";
    return;
  }
  const granted = await _ensurePermission(["geolocation"]);
  if (!granted) {
    status.textContent = "⚠ Location permission denied.";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      // 1 decimal place (~11km) is city-block precision, not the ~11m that
      // 4 decimals gives — this gets stored indefinitely and synced to
      // Drive, so it shouldn't be more precise than the feature needs.
      const locStr = `${lat.toFixed(1)},${lon.toFixed(1)}`;
      status.textContent = "🌐 Fetching weather...";
      const ok = await fetchWeather(locStr);
      if (ok) {
        S.weatherLocation = locStr;
        save();
        status.textContent = "✓ Location detected!";
        setTimeout(() => closeModal("weatherLocationModal"), 700);
        showToast("Location detected!", "success");
      } else {
        status.textContent = "⚠ Could not fetch weather for your location.";
      }
    },
    (err) => {
      status.textContent =
        err.code === 1
          ? "⚠ Permission denied. Allow location access in Chrome settings."
          : "⚠ Could not determine location. Try entering a city manually.";
    },
    { timeout: 8000 },
  );
}

function weatherEmoji(c) {
  if (c === 113) return "☀️";
  if (c === 116) return "⛅";
  if (c === 119 || c === 122) return "☁️";
  if (c >= 386 && c <= 395) return "⛈️"; // thundery (must check before rain)
  if (c >= 323 && c <= 377) return "❄️"; // snow/sleet (correct wttr.in range, before rain)
  if (c >= 176 && c <= 321) return "🌧️"; // rain/drizzle
  return "🌤️";
}

// ===== GOOGLE AUTH + DRIVE CLOUD SYNC ====================================
// OAuth scopes are declared in manifest.json's "oauth2.scopes" — that's the
// only place chrome.identity.getAuthToken() reads them from.

const DRIVE_FILE_NAME = "nestpane-sync.json";
// Pre-rename filenames. Backups written by the "novatab"- or "llmaotab"-era
// build still carry these; the read-side query below checks all three names,
// and a successful push always rewrites the file under the current
// DRIVE_FILE_NAME, migrating it forward for that user from then on.
const DRIVE_FILE_NAME_LEGACY = "llmaotab-sync.json";
const DRIVE_FILE_NAME_LEGACY_2 = "novatab-sync.json";
const DRIVE_SPACES = "appDataFolder";
// Drive namespace
const Drive = {
  _fileId: null,
  _syncTimer: null,
  _lastSyncAt: 0,
  _status: "idle",
};

// ── Google auth via chrome.identity.getAuthToken() ───────────────────────
// Uses the "oauth2" client_id declared in manifest.json (Google Cloud
// Console client type "Chrome Extension" — no client_secret exists for this
// type). Chrome owns the token cache and refresh entirely: non-interactive
// calls return a cached/silently-refreshed token or null; interactive calls
// show Chrome's native account picker/consent UI. This replaces the old
// manual PKCE + token-exchange + refresh + cross-tab-lock machinery, which
// existed only to work around not using this API.
let _lastAuthTokenError = null;

function getAuthToken(interactive = false) {
  return new Promise((resolve) => {
    if (!IS_CHROME || !chrome.identity) {
      resolve(null);
      return;
    }
    chrome.identity.getAuthToken({ interactive }, (result) => {
      if (chrome.runtime.lastError || !result) {
        _lastAuthTokenError = chrome.runtime.lastError?.message || null;
        if (chrome.runtime.lastError && interactive) {
          console.warn(
            "[Nestpane] Google sign-in failed or was cancelled.",
            chrome.runtime.lastError.message,
          );
        }
        resolve(null);
        return;
      }
      _lastAuthTokenError = null;
      // MV3 chrome.identity.getAuthToken resolves { token, grantedScopes };
      // some older typings/environments hand back a bare string — accept both.
      resolve(typeof result === "string" ? result : result.token || null);
    });
  });
}

// Brave self-identifies via navigator.brave.isBrave() (Brave's own official
// detection API — https://github.com/brave/brave-browser/wiki/Detecting-Brave-Users).
// chrome.identity.getAuthToken() needs Google's proprietary API keys baked
// into real Google Chrome; Brave lacks them and its internal fallback sends a
// request Google's servers reject with "Custom URI scheme is not supported on
// Chrome apps" — a known, currently unresolved Brave limitation with no
// workaround (brave/brave-browser#38066). Detect it up front so users get an
// honest message instead of Google's confusing "Access blocked" error page.
async function _isBrave() {
  try {
    return !!(await navigator.brave?.isBrave?.());
  } catch {
    return false;
  }
}

// Evicts a specific token from Chrome's cache (e.g. after the API rejects it
// as expired/revoked) so the next getAuthToken() call fetches a fresh one
// instead of handing back the same bad token again.
function _forgetToken(token) {
  return new Promise((resolve) => {
    if (!IS_CHROME || !chrome.identity || !token) {
      resolve();
      return;
    }
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });
}

// ── Fetch Google user profile ───────────────────────────────────────────
async function fetchGoogleProfile(token) {
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    return await r.json(); // { sub, email, name, picture, ... }
  } catch {
    return null;
  }
}

// ── Apply profile data to state ─────────────────────────────────────────
function applyGoogleProfile(profile) {
  if (!profile || !profile.email) return;
  S.googleUser = {
    email: profile.email,
    picture: profile.picture || null,
    sub: profile.sub,
  };
  S.user.googlePicture = profile.picture || S.user.googlePicture;
  if (profile.name && !S.user.googleName) {
    S.user.name = profile.name;
    S.user.googleName = profile.name;
  }
}

// ── Sync status UI ──────────────────────────────────────────────────────
function setSyncStatus(status, detail = "") {
  Drive._status = status;
  const card = el("syncCard");
  const title = el("syncTitle");
  const desc = el("syncDesc");
  if (!card) return;

  // Reset icon visibility
  ["syncIconCloud", "syncIconSpin", "syncIconOk", "syncIconErr"].forEach(
    (id) => {
      const e = el(id);
      if (e) e.style.display = "none";
    },
  );

  // Preserve popup-open state across status changes
  const wasOpen = card.classList.contains("popup-open");
  card.className = "sb-sync" + (wasOpen ? " popup-open" : "");

  // Footer button elements
  const ftrName = el("sbFtrName");
  const ftrSub  = el("sbFtrSub");
  const ftrDot  = el("sbFtrDot");
  if (ftrDot) ftrDot.className = "sb-ftr-dot";
  if (ftrSub) ftrSub.className = "sb-ftr-sub";
  const uname = S.user.name || S.user.googleName || S.googleUser?.email?.split("@")[0] || detail?.split("@")[0] || "";

  if (status === "signed-out") {
    el("syncIconCloud").style.display = "";
    if (title) title.textContent = "Sync across devices";
    if (desc) desc.textContent = "Sign in to back up your data.";
    el("signInBtn").style.display = "";
    el("syncNowBtn").style.display = "none";
    if (ftrName) ftrName.textContent = "Connect Drive";
    if (ftrSub)  { ftrSub.textContent = "Sign in to sync"; ftrSub.classList.add("sync-err"); }
  } else if (status === "needs-auth") {
    el("syncIconCloud").style.display = "";
    card.classList.add("syncing");
    const displayName = S.user.name || S.user.googleName || (detail ? detail.split("@")[0] : "your account");
    if (title) title.textContent = `Hi, ${displayName}`;
    if (desc) desc.textContent = "Connect Google Drive to sync.";
    el("signInBtn").style.display = "";
    el("signInBtn").textContent = "Connect Drive";
    el("syncNowBtn").style.display = "none";
    if (ftrName) ftrName.textContent = displayName;
    if (ftrSub)  { ftrSub.textContent = "Connect Drive"; ftrSub.classList.add("sync-err"); }
  } else if (status === "syncing") {
    el("syncIconSpin").style.display = "";
    card.classList.add("syncing");
    if (title) title.textContent = "Syncing…";
    if (desc) desc.textContent = "Saving your data to Google Drive.";
    el("signInBtn").style.display = "none";
    el("syncNowBtn").style.display = "none";
    if (ftrName) ftrName.textContent = uname || "Syncing…";
    if (ftrSub)  ftrSub.textContent  = "Syncing…";
    if (ftrDot)  ftrDot.classList.add("syncing");
  } else if (status === "synced") {
    el("syncIconOk").style.display = "";
    card.classList.add("synced");
    const ago = _timeAgo(Drive._lastSyncAt);
    if (title) title.textContent = uname || "Synced";
    if (desc) desc.textContent = `Synced ${ago}`;
    el("signInBtn").style.display = "none";
    el("syncNowBtn").style.display = "";
    _showManualSyncBtns(true);
    _updateSyncTimestamp();
    if (ftrName) ftrName.textContent = uname || "Synced";
    if (ftrSub)  { ftrSub.textContent = `Synced ${ago}`; ftrSub.classList.add("sync-ok"); }
    if (ftrDot)  ftrDot.classList.add("synced");
  } else if (status === "error") {
    el("syncIconErr").style.display = "";
    card.classList.add("error");
    if (title) title.textContent = "Sync failed";
    if (desc) desc.textContent = detail || "Check your connection and try again.";
    el("signInBtn").style.display = "none";
    el("syncNowBtn").style.display = "";
    if (ftrName) ftrName.textContent = uname || "Sync error";
    if (ftrSub)  { ftrSub.textContent = "Sync failed"; ftrSub.classList.add("sync-err"); }
    if (ftrDot)  ftrDot.classList.add("error");
  } else if (status === "offline") {
    el("syncIconCloud").style.display = "";
    if (title) title.textContent = "Offline";
    if (desc) desc.textContent = "Will sync when connected.";
    el("signInBtn").style.display = "none";
    el("syncNowBtn").style.display = "";
    if (ftrName) ftrName.textContent = uname || "Offline";
    if (ftrSub)  { ftrSub.textContent = "Offline"; ftrSub.classList.add("sync-err"); }
  } else {
    // idle / connected
    el("syncIconCloud").style.display = "";
    card.classList.add("synced");
    if (title) title.textContent = uname || "Connected";
    if (desc) desc.textContent = "Ready to sync.";
    el("signInBtn").style.display = "none";
    el("syncNowBtn").style.display = "";
    if (ftrName) ftrName.textContent = uname || "Connected";
    if (ftrSub)  { ftrSub.textContent = "Ready to sync"; ftrSub.classList.add("sync-ok"); }
    if (ftrDot)  ftrDot.classList.add("synced");
  }
}

function _timeAgo(ts) {
  if (!ts) return "just now";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Find or remember the Drive file ID ─────────────────────────────────
// findDriveFile is used ONLY for pull (reading cloud data).
// Returns all file IDs sorted newest-first so pullFromDrive can try each on 403.
// Push never calls this — it uses Drive._fileId set by a successful POST in this session.
async function findDriveFiles(token) {
  try {
    const r = await fetch(
      `https://www.googleapis.com/drive/v3/files?spaces=${DRIVE_SPACES}&q=${encodeURIComponent(`name='${DRIVE_FILE_NAME}' or name='${DRIVE_FILE_NAME_LEGACY}' or name='${DRIVE_FILE_NAME_LEGACY_2}'`)}&fields=files(id%2CmodifiedTime)&orderBy=modifiedTime%20desc`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.files || []).map((f) => f.id);
  } catch {}
  return [];
}

// ===== END-TO-END ENCRYPTED SYNC =====
// The passphrase is stored locally (chrome.storage.local) under a key that
// is intentionally excluded from buildDrivePayload()/_persistLocalState(), so
// it never leaves this device and is never written into the synced file.
let _e2ePassCache = null;

async function _e2eLoadPassphrase() {
  if (_e2ePassCache !== null) return _e2ePassCache;
  const d = await API.getLocal(["_e2ePass"]);
  _e2ePassCache = d._e2ePass || "";
  return _e2ePassCache;
}

async function _e2eSavePassphrase(pass) {
  _e2ePassCache = pass || "";
  await API.setLocal({ _e2ePass: _e2ePassCache });
}

function _e2eBytesToB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function _e2eB64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// OWASP-current PBKDF2-SHA256 iteration count for new backups. Old backups
// carry their own `iterations` in the envelope (see _e2eDecryptPayload) so
// they keep decrypting correctly after this constant is raised.
const E2E_PBKDF2_ITERATIONS = 600000;
const E2E_MIN_PASSPHRASE_LEN = 12;

function _e2ePassphraseIsWeak(pass) {
  return !pass || pass.length < E2E_MIN_PASSPHRASE_LEN;
}

async function _e2eDeriveKey(passphrase, saltBytes, iterations = E2E_PBKDF2_ITERATIONS) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// Encrypts a payload into a self-describing envelope. _savedAt/_version are
// kept outside the ciphertext so pullFromDrive can compare freshness without
// decrypting first.
async function _e2eEncryptPayload(payload, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await _e2eDeriveKey(passphrase, salt, E2E_PBKDF2_ITERATIONS);
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    _e2e: 1,
    _version: payload._version,
    _savedAt: payload._savedAt,
    salt: _e2eBytesToB64(salt),
    iv: _e2eBytesToB64(iv),
    iterations: E2E_PBKDF2_ITERATIONS,
    data: _e2eBytesToB64(new Uint8Array(cipher)),
  };
}

async function _e2eDecryptPayload(envelope, passphrase) {
  const salt = _e2eB64ToBytes(envelope.salt);
  const iv = _e2eB64ToBytes(envelope.iv);
  const data = _e2eB64ToBytes(envelope.data);
  // Envelopes written before this field existed were derived at 100,000
  // iterations — fall back to that exact value so old backups still decrypt.
  const iterations = envelope.iterations || 100000;
  const key = await _e2eDeriveKey(passphrase, salt, iterations);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return JSON.parse(new TextDecoder().decode(plain));
}

// ===== AI ASSISTANT (Anthropic) =====
// The API key is stored locally (chrome.storage.local) under a key that is
// intentionally excluded from buildDrivePayload()/_persistLocalState(), so
// it never leaves this device and is never written into the synced file.
const AI_MODEL = "claude-haiku-4-5-20251001";
let _aiKeyCache = null;

async function _aiLoadApiKey() {
  if (_aiKeyCache !== null) return _aiKeyCache;
  const d = await API.getLocal(["_aiApiKey"]);
  _aiKeyCache = d._aiApiKey || "";
  return _aiKeyCache;
}

async function _aiSaveApiKey(key) {
  _aiKeyCache = key || "";
  await API.setLocal({ _aiApiKey: _aiKeyCache });
}

function aiEnabled() {
  return !!S.settings.ai?.enabled;
}

// AI conversation history for multi-turn chat in the Command Bar
let _aiConvHistory = [];

function _aiResetConversation() {
  _aiConvHistory = [];
}

// Non-streaming single-turn call (used by briefing, smart-organize, voice)
async function aiComplete(prompt, opts = {}) {
  const apiKey = await _aiLoadApiKey();
  if (!apiKey) {
    const err = new Error("AI not configured");
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }
  const messages = opts.messages || [{ role: "user", content: prompt }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: opts.model || AI_MODEL,
      max_tokens: opts.maxTokens || 1024,
      ...(opts.system ? { system: opts.system } : {}),
      messages,
    }),
  });
  if (!res.ok) {
    const err = new Error(`AI request failed (${res.status})`);
    err.code = "AI_REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

// Streaming multi-turn call — appends to _aiConvHistory, calls onChunk(text) per delta
async function aiStream(userPrompt, opts = {}) {
  const apiKey = await _aiLoadApiKey();
  if (!apiKey) {
    const err = new Error("AI not configured");
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }
  _aiConvHistory.push({ role: "user", content: userPrompt });
  const messages = _aiConvHistory.slice();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: opts.model || AI_MODEL,
      max_tokens: opts.maxTokens || 2048,
      stream: true,
      ...(opts.system ? { system: opts.system } : {}),
      messages,
    }),
  });
  if (!res.ok) {
    _aiConvHistory.pop(); // roll back
    const err = new Error(`AI request failed (${res.status})`);
    err.code = "AI_REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") break;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          const chunk = evt.delta.text || "";
          fullText += chunk;
          if (opts.onChunk) opts.onChunk(chunk, fullText);
        }
      } catch { /* ignore malformed SSE line */ }
    }
  }
  _aiConvHistory.push({ role: "assistant", content: fullText });
  return fullText;
}

// Tests the API key currently typed into the settings field (not yet saved).
async function testAiApiKey() {
  const status = el("aiTestStatus");
  const key = el("aiApiKey").value.trim();
  if (!status) return;
  if (!key) {
    status.textContent = "Enter an API key first.";
    status.style.color = "var(--error)";
    return;
  }
  status.textContent = "Testing…";
  status.style.color = "var(--text-3)";
  const prevCache = _aiKeyCache;
  _aiKeyCache = key;
  try {
    await aiComplete("Reply with just the word OK.", { maxTokens: 5 });
    status.textContent = "✓ Connected successfully.";
    status.style.color = "var(--success)";
  } catch (err) {
    status.textContent = `✗ ${err.message || "Connection failed"}`;
    status.style.color = "var(--error)";
  } finally {
    _aiKeyCache = prevCache;
  }
}

// ── Build the payload that goes to Drive ────────────────────────────────
function buildDrivePayload() {
  return {
    _version: 2,
    _savedAt: Date.now(),
    user: S.user,
    quickAccess: S.quickAccess,
    notes: S.notes,
    folders: S.folders,
    importedBookmarks: S.importedBookmarks,
    settings: S.settings,
    habits: S.habits,
    readingQueue: S.readingQueue,
    tabSessions: S.tabSessions,
    journal: S.journal,
    kanban: S.kanban,
    reminders: S.reminders,
    calEvents: S.calEvents,
    weatherLocation: S.weatherLocation,
    trash: S.trash,
    _qaDeleted: [...(S._qaDeleted || new Set())],
  };
}

// ── Apply cloud data pulled from Drive ──────────────────────────────────
function applyCloudData(cloud) {
  if (!cloud || cloud._version < 1) return;
  // Merge tombstones first so we can filter QA below
  if (Array.isArray(cloud._qaDeleted)) {
    S._qaDeleted = new Set([...S._qaDeleted, ...cloud._qaDeleted]);
  }
  if (Array.isArray(cloud.workspaces) || (cloud.wsData && typeof cloud.wsData === "object")) {
    // Backup predates workspace removal — flatten into the current model.
    const flat = _flattenLegacyWorkspaceData(cloud);
    S.quickAccess = flat.quickAccess;
    S.notes = flat.notes;
    S.folders = flat.folders;
    S.importedBookmarks = flat.importedBookmarks;
    S.kanban = flat.kanban;
    S.reminders = flat.reminders;
  } else {
    if (Array.isArray(cloud.quickAccess)) S.quickAccess = cloud.quickAccess;
    if (Array.isArray(cloud.notes)) S.notes = cloud.notes;
    if (Array.isArray(cloud.folders)) S.folders = cloud.folders;
    if (Array.isArray(cloud.importedBookmarks)) S.importedBookmarks = cloud.importedBookmarks;
    if (cloud.kanban && typeof cloud.kanban === "object")
      S.kanban = { todo: [], doing: [], done: [], ...cloud.kanban };
    if (Array.isArray(cloud.reminders)) S.reminders = cloud.reminders;
  }
  if (S._qaDeleted.size) {
    S.quickAccess = S.quickAccess.filter((q) => !S._qaDeleted.has(_normUrl(q.url)));
  }
  S.habits = Array.isArray(cloud.habits) ? cloud.habits : S.habits;
  S.readingQueue = Array.isArray(cloud.readingQueue)
    ? cloud.readingQueue
    : S.readingQueue;
  S.tabSessions = Array.isArray(cloud.tabSessions)
    ? cloud.tabSessions
    : S.tabSessions;
  S.journal =
    cloud.journal && typeof cloud.journal === "object"
      ? cloud.journal
      : S.journal;
  S.calEvents = Array.isArray(cloud.calEvents) ? cloud.calEvents : S.calEvents;
  S.trash = Array.isArray(cloud.trash) ? cloud.trash : S.trash;
  if (cloud.weatherLocation !== undefined)
    S.weatherLocation = cloud.weatherLocation;
  if (cloud.settings)
    S.settings = {
      ...S.settings,
      ...cloud.settings,
      widgets: { ...S.settings.widgets, ...(cloud.settings.widgets || {}) },
      sbLinks: {
        ...(S.settings.sbLinks || {}),
        ...(cloud.settings.sbLinks || {}),
      },
    };
  if (cloud.user) {
    S.user = { ...S.user, ...cloud.user };
    if (S.googleUser) {
      S.user.googlePicture = S.googleUser.picture || S.user.googlePicture;
    }
  }
  S._savedAt = cloud._savedAt || 0;
}

// Remove duplicate entries by normalized URL, keeping the first occurrence.
// Self-heals any duplicates already sitting in local/cloud storage from
// earlier id-based merges or renumbered defaults.
// Drops/normalizes any imported link whose URL isn't a safe http(s) URL —
// import must go through the same scheme validation as manually adding a
// link, not just rely on render-time escaping.
function _sanitizeImportedLinks(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr
    .map((item) => {
      if (!item || typeof item !== "object" || !item.url) return item;
      const clean = safeUrl(item.url);
      return clean ? { ...item, url: clean } : null;
    })
    .filter(Boolean);
}

function _dedupeByUrl(arr) {
  if (!Array.isArray(arr)) return arr;
  const seen = new Set();
  return arr.filter((item) => {
    const key = item?.url ? _normUrl(item.url) : (item?.id ?? JSON.stringify(item));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Fetch the raw payload from Drive, trying each file newest-first and
// skipping any that return 403/404 (file from a previous OAuth client).
async function _fetchCloudPayload(token, fileIds) {
  for (const fileId of fileIds) {
    try {
      const r = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (r.ok) return await r.json();
      if (r.status !== 403 && r.status !== 404) return null; // unexpected error — stop
      // 403/404: file from a previous OAuth client — try next
    } catch {
      return null;
    }
  }
  return null;
}

// Persist the current in-memory state to local storage.
async function _persistLocalState() {
  await API.setLocal({
    user: S.user,
    googleUser: S.googleUser,
    quickAccess: S.quickAccess,
    notes: S.notes,
    folders: S.folders,
    importedBookmarks: S.importedBookmarks,
    settings: S.settings,
    habits: S.habits,
    readingQueue: S.readingQueue,
    tabSessions: S.tabSessions,
    journal: S.journal,
    kanban: S.kanban,
    reminders: S.reminders,
    calEvents: S.calEvents,
    weatherLocation: S.weatherLocation,
    trash: S.trash,
    _savedAt: S._savedAt,
    _focusSessions: S._focusSessions || {},
    _focusMinutes: S._focusMinutes || {},
    _qaDeleted: [...(S._qaDeleted || new Set())],
  });
}

// Re-apply theme/accent and re-render everything after cloud data lands.
function _refreshAfterCloudApply() {
  applyTheme(S.settings.theme || "dark");
  applyAccent(S.settings.accentColor || "#fe8019");
  renderAll();
  updateGreeting();
  updateAvatarDisplay();
  window._heroBgSessionCache = null;
  loadHeroBg();
}

// ── Instant cross-tab sync: every open new tab shares the same
// chrome.storage.local, so a change saved in one tab can be reflected in
// every other open tab immediately, with no cloud round-trip. `_savedAt` is
// set to Date.now() in-memory *before* the write that triggers this event,
// so a tab reacting to its own save always sees newValue === S._savedAt and
// skips — only tabs that are actually behind pick up the change. ─────────
function _registerLiveStorageSync() {
  if (!IS_CHROME || !chrome.storage?.onChanged) return;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes._savedAt) return;
    const newSavedAt = changes._savedAt.newValue || 0;
    if (newSavedAt <= S._savedAt) return;
    _applyLiveStorageChange(changes);
  });
}

// KNOWN LIMITATION: this wholesale-replaces each top-level collection
// rather than merging by item id. An
// id-based union merge was considered and deliberately NOT implemented —
// every delete in this app (habits, reading queue, sessions, events, etc.)
// is a hard delete with no tombstone, so a naive union would "resurrect"
// items a concurrent tab just deleted, which is a worse and more confusing
// failure mode than the rare edit-loss race this would fix. A correct fix
// needs either per-collection tombstones (like _qaDeleted already does for
// quick-access) or a real 3-way/CRDT merge — both larger changes than a
// safe drop-in here. This function still meaningfully narrows the window
// versus no cross-tab sync at all.
function _applyLiveStorageChange(changes) {
  if (changes.user) S.user = changes.user.newValue || S.user;
  if (changes.googleUser) S.googleUser = changes.googleUser.newValue || null;
  if (changes.quickAccess) S.quickAccess = changes.quickAccess.newValue || [];
  if (changes.notes) S.notes = changes.notes.newValue || [];
  if (changes.folders) S.folders = changes.folders.newValue || [];
  if (changes.importedBookmarks) S.importedBookmarks = changes.importedBookmarks.newValue || [];
  if (changes.trash) S.trash = changes.trash.newValue || [];
  if (changes.settings) {
    const ns = changes.settings.newValue || {};
    S.settings = {
      ...S.settings,
      ...ns,
      widgets: { ...S.settings.widgets, ...(ns.widgets || {}) },
      sbLinks: { ...S.settings.sbLinks, ...(ns.sbLinks || {}) },
    };
  }
  if (changes.weatherLocation) S.weatherLocation = changes.weatherLocation.newValue;
  if (changes.habits) S.habits = changes.habits.newValue || [];
  if (changes.readingQueue) S.readingQueue = changes.readingQueue.newValue || [];
  if (changes.tabSessions) S.tabSessions = changes.tabSessions.newValue || [];
  if (changes.journal) S.journal = changes.journal.newValue || {};
  if (changes.kanban) S.kanban = changes.kanban.newValue || { todo: [], doing: [], done: [] };
  if (changes.reminders) S.reminders = changes.reminders.newValue || [];
  if (changes.calEvents) S.calEvents = changes.calEvents.newValue || [];
  if (changes._focusSessions) S._focusSessions = changes._focusSessions.newValue || {};
  if (changes._focusMinutes) S._focusMinutes = changes._focusMinutes.newValue || {};
  if (changes._qaDeleted) S._qaDeleted = new Set(changes._qaDeleted.newValue || []);

  if (S._qaDeleted.size) {
    S.quickAccess = S.quickAccess.filter((q) => !S._qaDeleted.has(_normUrl(q.url)));
  }
  S._savedAt = changes._savedAt.newValue || S._savedAt;
  _refreshAfterCloudApply();
}

// ── Pull from Drive: called on sign-in and on new tab load ───────────────
async function pullFromDrive() {
  const token = await getAuthToken(false);
  if (!token) return false;
  const fileIds = await findDriveFiles(token);
  if (!fileIds.length) return false; // no cloud save yet

  const cloud = await _fetchCloudPayload(token, fileIds);
  if (!cloud) return false;

  let decoded = cloud;
  if (cloud._e2e === 1) {
    const pass = await _e2eLoadPassphrase();
    if (!pass) {
      showToast(
        "Cloud backup is encrypted — enter your sync passphrase in Settings",
        "error",
      );
      return false;
    }
    try {
      decoded = await _e2eDecryptPayload(cloud, pass);
    } catch {
      showToast(
        "Could not decrypt cloud backup — check your sync passphrase",
        "error",
      );
      return false;
    }
  }

  try {
    if ((decoded._savedAt || 0) > S._savedAt) {
      applyCloudData(decoded);
      await _persistLocalState();
      _refreshAfterCloudApply();
      showToast("Data synced from cloud ☁", "success");
    }
    return true;
  } catch {
    return false;
  }
}

// ── Push to Drive: called via debounce after every save() ───────────────
async function pushToDrive() {
  if (!S.googleUser) return;
  if (!navigator.onLine) {
    setSyncStatus("offline");
    return;
  }
  const token = await getAuthToken(false);
  if (!token) {
    // Show needs-auth (not error) so the sign-in button is visible
    setSyncStatus("needs-auth", S.googleUser?.email || "");
    return;
  }
  await _doPush(token);
}

async function _doPush(token) {
  setSyncStatus("syncing");
  const payload = buildDrivePayload();
  let body;
  if (S.settings.e2e?.enabled) {
    const pass = await _e2eLoadPassphrase();
    if (!pass) {
      // Never silently upload plaintext when the user believes E2E is on.
      setSyncStatus("error");
      showToast(
        "Sync paused: E2E encryption is enabled but no passphrase is set. Add one in Settings.",
        "error",
      );
      return;
    }
    body = JSON.stringify(await _e2eEncryptPayload(payload, pass));
  } else {
    body = JSON.stringify(payload);
  }
  const boundary = "nestpane_boundary_" + Date.now();
  // Only PATCH if Drive._fileId was set by a successful POST *in this session*.
  // Never search for existing files on push — avoids 403s from files created by
  // a previous OAuth client that pass GET-metadata checks but fail on PATCH.
  const fileId = Drive._fileId || null;

  const fileMeta = fileId
    ? { name: DRIVE_FILE_NAME, mimeType: "application/json" }
    : { name: DRIVE_FILE_NAME, mimeType: "application/json", parents: [DRIVE_SPACES] };

  const multipart = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(fileMeta),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    body,
    `--${boundary}--`,
  ].join("\r\n");

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
  const method = fileId ? "PATCH" : "POST";

  try {
    const r = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary="${boundary}"`,
      },
      body: multipart,
    });
    if (r.ok) {
      const result = await r.json();
      if (!fileId) {
        // New file created — cache the ID for PATCH on subsequent pushes this session
        Drive._fileId = result.id;
      }
      Drive._lastSyncAt = Date.now();
      // Keep local _savedAt in step with what we just pushed so an immediately
      // following pull doesn't treat our own data as a "newer" cloud change.
      S._savedAt = payload._savedAt;
      await API.setLocal({ _savedAt: S._savedAt });
      setSyncStatus("synced");
      return true;
    } else {
      const err = await r.json().catch(() => ({}));
      if (r.status === 401) {
        await _forgetToken(token);
        setSyncStatus("needs-auth", S.googleUser?.email || "");
      } else if (r.status === 403 && fileId) {
        // PATCH failed — this file is from a previous OAuth client.
        // Clear the cached ID and POST a fresh file instead.
        Drive._fileId = null;
        return await _doPush(token); // retry immediately with POST
      } else if (r.status === 403) {
        // POST failed 403 — access token lacks drive.appdata scope (pre-dates scope grant).
        // Keep session alive (user is signed in) but signal Drive needs re-auth.
        setSyncStatus("needs-auth", S.googleUser?.email || "");
        showToast("Drive permission missing. Sign out then sign back in.", "error");
      } else {
        setSyncStatus(
          "error",
          err?.error?.message || `Drive error ${r.status}`,
        );
      }
      return false;
    }
  } catch (e) {
    setSyncStatus(navigator.onLine ? "error" : "offline", e.message);
    return false;
  }
}

// ── Debounce: push 2 s after the last edit (reset on every save()) — short
// enough to feel instant, long enough to collapse a burst of rapid edits
// (e.g. dragging a kanban card, typing a title) into a single request. ────
function scheduleDriveSync() {
  clearTimeout(Drive._syncTimer);
  Drive._syncTimer = setTimeout(pushToDrive, 2000);
}

// ── Manual push/pull buttons ──────────────────────────────────────────────
async function manualPushToDrive() {
  const btn = el("pushCloudBtn");
  if (btn) btn.disabled = true;
  try {
    await pushToDrive();
    showToast("Pushed to cloud ☁️", "success");
    _updateSyncTimestamp();
  } catch {
    showToast("Push failed", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function manualPullFromDrive() {
  const btn = el("pullCloudBtn");
  if (btn) btn.disabled = true;
  try {
    const pulled = await pullFromDrive();
    showToast(pulled ? "Pulled from cloud ☁️" : "Already up to date", "success");
    _updateSyncTimestamp();
  } catch {
    showToast("Pull failed", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

function _updateSyncTimestamp() {
  const ts = el("sbSyncTs");
  if (!ts) return;
  const now = new Date();
  ts.textContent = `Last sync: ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function _showManualSyncBtns(show) {
  const d = el("sbSyncManual");
  if (d) d.style.display = show ? "flex" : "none";
}

// ── Main identity check: called on every new tab open ───────────────────
async function checkGoogleIdentity() {
  // chrome.identity.getAuthToken() (and Google sign-in generally) only
  // works in actual Google Chrome — it depends on Chrome's own Google API
  // keys and profile/sign-in system, which forks like Brave/Edge/Vivaldi
  // don't support. On those browsers this silently resolves null and the
  // UI falls through to the normal signed-out state below.
  const token = await getAuthToken(false);

  if (!token) {
    // No valid token. Show "needs-auth" if we have a cached user, else "signed-out".
    if (S.googleUser?.email) {
      setSyncStatus("needs-auth", S.googleUser.email);
    } else {
      // Fall back to Chrome identity as last resort
      const info = await API.identity().catch(() => null);
      if (info?.email) {
        setSyncStatus("needs-auth", info.email);
      } else {
        S.googleUser = null;
        setSyncStatus("signed-out");
      }
    }
    return;
  }

  // Valid token — restore session without requiring Chrome identity API.
  if (!S.googleUser) {
    // No cached user (first run or cache cleared) — fetch fresh profile.
    const profile = await fetchGoogleProfile(token);
    if (!profile?.email) {
      setSyncStatus("error", "Could not verify account.");
      return;
    }
    applyGoogleProfile(profile);
    save();
  }

  updateAvatarDisplay();
  updateGreeting();
  await syncWithDriveOnConnect(token);
  setSyncStatus("synced");
  fetchGoogleCalendarEvents(false);
  _gcalStartAutoRefresh();
}

// Delete every existing cloud backup file for this app and replace it with a
// fresh upload of the current local state. No merge — local simply becomes
// the new source of truth in the cloud.
async function _wipeAndReuploadCloud(token) {
  const fileIds = await findDriveFiles(token);
  for (const fileId of fileIds) {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
  Drive._fileId = null; // force the next push to POST a brand-new file
  return await _doPush(token);
}

// ── First contact with Drive for this install: wipe whatever's already up
// there and replace it with the current local state instead of merging —
// this runs exactly once, gated by S._cloudResetDone, so a stale/duplicate
// snapshot from a previous install or account can never come back. Every
// later connect just compares _savedAt and takes whichever side is newest,
// which is deterministic (unlike a union-merge, which is what let deleted/
// stale items resurface). ─────────────────────────────────────────────────
async function syncWithDriveOnConnect(token) {
  if (!S._cloudResetDone) {
    const ok = await _wipeAndReuploadCloud(token);
    if (ok) {
      // Only latch the flag on success — if this failed (e.g. offline), the
      // cloud may still hold stale data, so retry the reset on next connect.
      S._cloudResetDone = true;
      await API.setLocal({ _cloudResetDone: true });
    }
    return;
  }

  const fileIds = await findDriveFiles(token);
  if (!fileIds.length) {
    // No cloud backup yet (e.g. deleted externally) — push current data.
    await pushToDrive();
    return;
  }

  const cloud = await _fetchCloudPayload(token, fileIds);
  if (!cloud) return;

  let decoded = cloud;
  if (cloud._e2e === 1) {
    const pass = await _e2eLoadPassphrase();
    if (!pass) return;
    try {
      decoded = await _e2eDecryptPayload(cloud, pass);
    } catch {
      return;
    }
  }

  if ((decoded._savedAt || 0) > S._savedAt) {
    applyCloudData(decoded);
    await _persistLocalState();
    _refreshAfterCloudApply();
  } else if ((decoded._savedAt || 0) < S._savedAt) {
    // Local is newest — make sure the cloud reflects it.
    await pushToDrive();
  }
}

// ── Sign in: interactive token request ──────────────────────────────────
// Requests one or more optional permissions. Must be called from a user
// gesture (click handler) — Chrome silently denies chrome.permissions.request()
// calls made outside one. Resolves true if already granted or just granted.
async function _ensurePermission(names) {
  if (!IS_CHROME || !chrome.permissions) return true;
  try {
    const has = await chrome.permissions.contains({ permissions: names });
    if (has) return true;
    return await chrome.permissions.request({ permissions: names });
  } catch {
    return false;
  }
}

async function signIn() {
  if (!IS_CHROME) {
    openModal("profileModal");
    return;
  }
  if (await _isBrave()) {
    showToast("Google sign-in only works in Google Chrome — Brave isn't supported.", "error");
    return;
  }
  // chrome.identity is undefined until the (now-optional) "identity"
  // permission is granted — request it BEFORE checking for the namespace,
  // not after, or a fresh install could never pass this check at all.
  const granted = await _ensurePermission(["identity", "identity.email"]);
  if (!granted || !chrome.identity) {
    showToast("Google sign-in needs the identity permission to continue", "error");
    return;
  }
  setSyncStatus("syncing");
  const token = await getAuthToken(true); // interactive = true
  if (!token) {
    setSyncStatus("signed-out");
    if (_lastAuthTokenError) {
      showToast("Google sign-in failed — this browser may not fully support it. Try Google Chrome.", "error");
    } else {
      showToast("Sign-in cancelled");
    }
    return;
  }
  const profile = await fetchGoogleProfile(token);
  if (!profile || !profile.email) {
    setSyncStatus("error", "Could not fetch profile.");
    return;
  }

  applyGoogleProfile(profile);
  save();
  updateAvatarDisplay();
  updateGreeting();
  // First load for this account: upload local data to Drive before retrieving
  // anything from the cloud, so local items are never overwritten by a stale
  // or empty cloud copy.
  await syncWithDriveOnConnect(token);
  setSyncStatus("synced");
  showToast("Signed in & synced ☁", "success");
  fetchGoogleCalendarEvents(false);
  _gcalStartAutoRefresh();
}

// ── Sign out: revoke token, clear state ──────────────────────────────────
// Revokes the Google grant server-side and evicts it from Chrome's cache.
// Shared by signOut() and "Clear All Data" so neither one can leave a live
// OAuth grant behind while claiming to have signed the user out / wiped
// everything.
async function _revokeGoogleAccess() {
  const token = await getAuthToken(false);
  if (IS_CHROME && chrome.identity && token) {
    // Revoke on Google's servers
    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: "POST",
    }).catch(() => {});
    // Remove from Chrome's token cache
    await _forgetToken(token);
  }
}

async function signOut() {
  await _revokeGoogleAccess();
  S.googleUser = null;
  S.user.googlePicture = null;
  S.user.googleName = null;
  Drive._fileId = null;
  Drive._lastSyncAt = 0;
  clearTimeout(Drive._syncTimer);
  clearInterval(_gcalRefreshTimer);
  S.googleCalEvents = [];
  S._gcalStatus = "idle";
  S._gcalError = null;
  save();
  updateAvatarDisplay();
  updateGreeting();
  setSyncStatus("signed-out");
  renderCalSyncStatus();
  renderCalendarWidget();
  closeModal("profileModal");
  showToast("Signed out", "success");
}

// Update avatar: show Google photo if available, else letter
function updateAvatarDisplay() {
  const avatarEl = el("userAvatar");
  const ftrAvatar = el("sbFtrAvatar");
  const pic = (S.googleUser && S.googleUser.picture) || S.user.googlePicture;

  if (avatarEl) {
    if (pic) {
      const img = document.createElement("img");
      img.src = pic;
      img.alt = "Profile picture";
      img.className = "avatar-google-img";
      img.addEventListener("error", () => {
        img.remove();
        avatarEl.textContent = S.user.name ? S.user.name[0].toUpperCase() : "U";
        avatarEl.style.background = S.user.avatarColor || "#7c3aed";
        avatarEl.style.padding = "";
      });
      avatarEl.innerHTML = "";
      avatarEl.appendChild(img);
      avatarEl.style.background = "transparent";
      avatarEl.style.padding = "0";
    } else {
      avatarEl.textContent = S.user.name ? S.user.name[0].toUpperCase() : "U";
      avatarEl.style.background = S.user.avatarColor || "#7c3aed";
      avatarEl.style.padding = "";
    }
  }

  if (ftrAvatar) {
    if (pic) {
      ftrAvatar.innerHTML = `<img src="${pic}" alt="avatar">`;
      ftrAvatar.style.background = "transparent";
    } else if (S.googleUser?.email || S.user.name) {
      const letter = (S.user.name || S.googleUser?.email || "U")[0].toUpperCase();
      ftrAvatar.textContent = letter;
      ftrAvatar.style.background = S.user.avatarColor || "#7c3aed";
    } else {
      ftrAvatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`;
      ftrAvatar.style.background = "";
    }
  }
}

// ===== RENDER ALL =====
function renderAll() {
  renderSidebar();
  renderSidebarFolders();
  applyWidgetVisibility();
  renderQuickAccess();
  renderWorkspaceBookmarks();
  renderNotesWidget();
  renderKanbanDash();
  renderNotesView();
  renderTrash();
  renderCalendarWidget();
  renderTimerStats();
  updateSidebarTabActive();
}

// ===== DATA-DRIVEN SIDEBAR RENDERER =====
// Shared "dotted square" drag handle — the one drag affordance used
// everywhere something is reorderable (sidebar groups and sidebar items).
const SB_DRAG_HANDLE = `<span class="sb-drag-handle" data-tip="Drag to reorder">
  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
    <circle cx="8" cy="6" r="1.6"/><circle cx="16" cy="6" r="1.6"/>
    <circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/>
    <circle cx="8" cy="18" r="1.6"/><circle cx="16" cy="18" r="1.6"/>
  </svg>
</span>`;

function _sbItemInner(item, groupId) {
  const icon = SB_ICONS[item.icon] || SB_ICONS.link;
  // Only two controls per row in edit mode — drag (reorder) and edit (which
  // opens the rename/delete popup). No separate move-up/down or delete icon.
  const editControls = S.sidebarEditMode
    ? `
    <div class="sb-item-edit-actions">
      ${SB_DRAG_HANDLE}
      <button class="sb-icon-mini sb-icon-mini-edit" data-sb-rename-item="${escH(item.id)}" data-sb-item-group="${escH(groupId)}" title="Edit">✎</button>
    </div>`
    : "";
  const rowAttrs = `data-sb-row-item-id="${escH(item.id)}" data-sb-row-group-id="${escH(groupId)}"`;
  if (item.kind === "view") {
    return `
    <div class="sb-item-row${S.sidebarEditMode ? " sb-item-row-edit" : ""}" ${rowAttrs}>
      <a href="#" class="sb-item" data-view="${escH(item.view)}" data-sb-item-id="${escH(item.id)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
        <span class="sb-item-label">${escH(item.label)}</span>
      </a>
      ${editControls}
    </div>`;
  }
  return `
    <div class="sb-item-row${S.sidebarEditMode ? " sb-item-row-edit" : ""}" ${rowAttrs}>
      <div class="sb-item sb-link-item" data-sb-item-id="${escH(item.id)}" data-tip="${escH(item.label)}">
        <a href="${escH(safeUrl(item.url) || "#")}" class="sb-link-main" target="_blank" rel="noopener">
          <img class="sb-fav" src="${favSrc(item.url)}" alt="">
          <span class="sb-item-label">${escH(item.label)}</span>
        </a>
      </div>
      ${editControls}
    </div>`;
}

function renderSidebar() {
  const container = el("sbGroupsContainer");
  if (!container || !S.settings.sidebar) return;
  // The flyout holds a snapshot of a group's items HTML plus a reference to
  // the .sb-group node it was opened from — the innerHTML rebuild below
  // discards that node and invalidates the snapshot, so close it first. Safe
  // when nothing is open, and when this runs at boot before the flyout
  // element even exists (_sbCloseFlyout null-guards _sbFlyoutEl).
  _sbCloseFlyout();
  container.innerHTML = S.settings.sidebar
    .map((group) => {
      const icon = SB_ICONS[group.icon] || SB_ICONS.link;
      const itemsHtml = group.items.length
        ? group.items.map((it) => _sbItemInner(it, group.id)).join("")
        : `<div class="sb-empty-state">No links yet — click + to add</div>`;
      // Same two-control pattern as items: drag + edit only. Edit opens the
      // rename/delete popup instead of separate move/rename/delete icons.
      const groupEditActions = `
          <div class="sb-group-edit-actions">
            ${SB_DRAG_HANDLE}
            <button class="sb-icon-mini sb-icon-mini-edit" data-sb-rename-group="${escH(group.id)}" title="Edit">✎</button>
          </div>`;
      const addBtn = `
          <button class="sb-gplus" data-addlink="${escH(group.id)}" title="Add link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>`;
      return `
      <div class="sb-group" id="sbg-${escH(group.id)}" data-sb-group-id="${escH(group.id)}">
        <div class="sb-group-hd${S.sidebarEditMode ? " sb-group-hd-edit" : ""}">
          <button class="sb-group-btn" data-group="${escH(group.id)}" data-tip="${escH(group.label)}" aria-expanded="false">
            <svg class="sb-group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
            <span class="sb-group-label">${escH(group.label)}</span>
            <svg class="sb-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          ${S.sidebarEditMode ? groupEditActions : addBtn}
        </div>
        <div class="sb-group-items">${itemsHtml}</div>
      </div>`;
    })
    .join("") +
    (S.sidebarEditMode
      ? `<button class="sb-add-group-btn" id="sbAddGroupBtn">+ Add group</button>`
      : "");
  if (S.sidebarEditMode) {
    _addDragDrop(container, ".sb-group", "sbGroupId", reorderSidebarGroups, ".sb-group-hd .sb-drag-handle");
    container.querySelectorAll(".sb-group").forEach((groupEl) => {
      const groupId = groupEl.dataset.sbGroupId;
      const itemsContainer = groupEl.querySelector(".sb-group-items");
      if (!itemsContainer) return;
      _addDragDrop(
        itemsContainer,
        ".sb-item-row",
        "sbRowItemId",
        (fromId, toId) => reorderSidebarItemsInGroup(groupId, fromId, toId),
        ".sb-drag-handle",
      );
    });
  }
  initSidebarTabs();
  updateSidebarTabActive();
}

// ===== SIDEBAR GROUP CRUD =====
function toggleSidebarEditMode() {
  S.sidebarEditMode = !S.sidebarEditMode;
  el("sbEditModeBtn")?.classList.toggle("active", S.sidebarEditMode);
  renderSidebar();
}

function addSidebarGroup() {
  sbPrompt("New group", "", (label) => {
    const id = `g${Date.now()}`;
    S.settings.sidebar.push({ id, label, icon: "link", items: [] });
    save();
    renderSidebar();
  });
}

function renameSidebarGroup(id) {
  const group = S.settings.sidebar.find((g) => g.id === id);
  if (!group) return;
  sbPrompt(
    "Edit group",
    group.label,
    (label) => {
      group.label = label;
      save();
      renderSidebar();
    },
    () => deleteSidebarGroup(id),
  );
}

function deleteSidebarGroup(id) {
  const group = S.settings.sidebar.find((g) => g.id === id);
  if (!group) return;
  confirm2(
    "Delete group?",
    `"${group.label}" and its ${group.items.length} item(s) will be moved to Trash.`,
    () => {
      S.trash.push({ ...group, _type: "sidebarGroup", _deletedAt: Date.now() });
      S.settings.sidebar = S.settings.sidebar.filter((g) => g.id !== id);
      save();
      renderSidebar();
      showToast("Group deleted", "success");
    },
  );
}

// Drag-and-drop reorder — sidebar groups and items only reorder by drag now,
// no separate move-up/down controls.
function reorderSidebarGroups(fromId, toId) {
  const arr = S.settings.sidebar;
  const from = arr.findIndex((g) => g.id === fromId);
  const to = arr.findIndex((g) => g.id === toId);
  if (from < 0 || to < 0) return;
  const [group] = arr.splice(from, 1);
  arr.splice(to, 0, group);
  save();
  renderSidebar();
}

function reorderSidebarItemsInGroup(groupId, fromItemId, toItemId) {
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  if (!group) return;
  const from = group.items.findIndex((it) => String(it.id) === String(fromItemId));
  const to = group.items.findIndex((it) => String(it.id) === String(toItemId));
  if (from < 0 || to < 0) return;
  const [item] = group.items.splice(from, 1);
  group.items.splice(to, 0, item);
  save();
  renderSidebar();
}

// ===== SIDEBAR ITEM CRUD =====
function renameSidebarItem(groupId, itemId) {
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  const item = group?.items.find((it) => it.id === itemId);
  if (!item) return;
  sbPrompt(
    "Edit item",
    item.label,
    (label) => {
      item.label = label;
      save();
      renderSidebar();
    },
    () => deleteSidebarItem(groupId, itemId),
  );
}

function deleteSidebarItem(groupId, itemId) {
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  const item = group?.items.find((it) => it.id === itemId);
  if (!group || !item) return;
  // NO _qaDeleted tombstone here. That tombstone dates from when adding a
  // sidebar link also mirrored it into Home's Quick Access, so deleting the
  // sidebar copy had to suppress the mirrored copy from coming back. Sidebar
  // items and Quick Access tiles are independent now, and _qaDeleted is
  // global (it filters quickAccess on every load, cloud apply and cross-tab
  // sync, and is only ever unioned on Drive pull) — so writing to it here
  // silently deleted unrelated Quick Access tiles everywhere, permanently.
  group.items = group.items.filter((it) => it.id !== itemId);
  save();
  renderSidebar();
  showToast("Item removed", "success");
}

function openSbAddLink(groupId) {
  S._sbAddLinkGroup = groupId;
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  el("sbAddLinkTitle").textContent = `Add to ${group ? group.label : "Sidebar"}`;
  el("sbAddLinkName").value = "";
  el("sbAddLinkUrl").value = "";
  const addableViews = SIDEBAR_ADDABLE_VIEWS.filter(
    (v) => !group?.items.some((it) => it.kind === "view" && it.view === v.view),
  );
  const pickerEl = el("sbAddLinkViewPicker");
  if (pickerEl) {
    pickerEl.innerHTML = addableViews
      .map(
        (v) => `<button type="button" class="sb-view-pick-btn" data-add-view="${escH(v.view)}">${escH(v.label)}</button>`,
      )
      .join("");
    pickerEl.style.display = addableViews.length ? "" : "none";
  }
  openModal("sbAddLinkModal");
  setTimeout(() => el("sbAddLinkName").focus(), 80);
}

function addSidebarViewItem(groupId, view) {
  const group = S.settings.sidebar.find((g) => g.id === groupId);
  const meta = SIDEBAR_ADDABLE_VIEWS.find((v) => v.view === view);
  if (!group || !meta) return;
  group.items.push({ id: `view-${view}-${Date.now()}`, label: meta.label, icon: meta.icon, kind: "view", view: meta.view });
  save();
  renderSidebar();
  closeModal("sbAddLinkModal");
  showToast(`${meta.label} added`, "success");
}

function saveSbLink() {
  const name = el("sbAddLinkName").value.trim();
  const url = el("sbAddLinkUrl").value.trim();
  if (!name || !url) {
    showToast("Enter a name and URL", "error");
    return;
  }
  const group = S.settings.sidebar.find((g) => g.id === S._sbAddLinkGroup);
  if (!group) return;
  group.items.push({ id: `link-${Date.now()}`, label: name, url: safeUrl(url), icon: "link", kind: "link" });
  save();
  renderSidebar();
  closeModal("sbAddLinkModal");
  showToast("Link added", "success");
}

// ===== SIDEBAR TAB COLLAPSIBLE LOGIC =====
// Module-level flyout state — the element and its document-level listeners
// are created once (initSidebarFlyout, called at boot); initSidebarTabs is
// called again after every renderSidebar() and only touches per-button
// listeners, so it never creates a second flyout or a second global listener.
let _sbFlyoutEl = null;
let _sbFlyoutGroup = null;

function _sbCloseFlyout() {
  if (_sbFlyoutEl) _sbFlyoutEl.classList.remove("open");
  _sbFlyoutGroup = null;
}

function _sbOpenFlyout(group, btn) {
  const itemsEl = group.querySelector(".sb-group-items");
  if (!itemsEl || !_sbFlyoutEl) return;
  _sbFlyoutEl.innerHTML =
    `<div class="sb-flyout-title">${escH(btn.dataset.tip || "")}</div>` +
    itemsEl.innerHTML;
  const rect = btn.getBoundingClientRect();
  _sbFlyoutEl.style.left = rect.right + 8 + "px";
  // .open is what removes display:none, so it must go on BEFORE offsetHeight
  // is read — measuring a display:none element returns 0 and the clamp below
  // would silently never clamp, letting tall flyouts run off the viewport.
  _sbFlyoutEl.classList.add("open");
  _sbFlyoutEl.style.top = Math.max(
    12,
    Math.min(rect.top, window.innerHeight - _sbFlyoutEl.offsetHeight - 12),
  ) + "px";
  _sbFlyoutGroup = group;
}

// Called ONCE at boot (from setupEventListeners). Idempotent guard included
// defensively, but callers must still only call this once.
function initSidebarFlyout() {
  if (_sbFlyoutEl) return;
  _sbFlyoutEl = document.createElement("div");
  _sbFlyoutEl.className = "sb-flyout";
  _sbFlyoutEl.id = "sbFlyout";
  document.body.appendChild(_sbFlyoutEl);
  document.addEventListener("click", (e) => {
    if (
      _sbFlyoutGroup &&
      !_sbFlyoutEl.contains(e.target) &&
      !e.target.closest(".sb-group-btn")
    ) {
      _sbCloseFlyout();
    }
  });
  document.addEventListener("scroll", _sbCloseFlyout, true);
}

// Called at boot AND after every renderSidebar() — (re)attaches per-element
// click listeners to whatever .sb-group-btn elements currently exist. Safe
// to call repeatedly: old elements (and their listeners) are gone once
// renderSidebar() replaces the DOM, so there is nothing to double-attach to.
function initSidebarTabs() {
  document.querySelectorAll(".sb-group-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".sb-group");
      if (S.settings.sidebarCollapsed) {
        if (_sbFlyoutGroup === group) _sbCloseFlyout();
        else _sbOpenFlyout(group, btn);
        return;
      }
      const isOpen = group.classList.contains("open");
      document
        .querySelectorAll(".sb-group")
        .forEach((g) => g.classList.remove("open"));
      if (!isOpen) group.classList.add("open");
    });
  });
}

function updateSidebarTabActive() {
  const activeView =
    document.querySelector(".view.active")?.id?.replace("view-", "") || "home";
  const viewToTab = {
    home: "home",
    bookmarks: "home",
    history: "home",
    downloads: "home",
    reading: "home",
    sessions: "home",
    trash: "home",
    notes: "personal",
    analytics: "personal",
    journal: "personal",
    habits: "personal",
  };
  // Update .sb-item active states
  document.querySelectorAll(".sb-item[data-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === activeView);
  });
  // Update group tab-active
  const activeTab = viewToTab[activeView] || "";
  document.querySelectorAll(".sb-group").forEach((g) => {
    const btn = g.querySelector(".sb-group-btn");
    g.classList.toggle("tab-active", btn?.dataset?.group === activeTab);
  });
}

// Shared drag-to-reorder wiring — one implementation for every reorderable
// list in the app (sidebar groups, sidebar items within a group).
// `dataAttr` names the dataset key each item carries its id in (e.g.
// "sbGroupId" for data-sb-group-id); `onReorder(fromId, toId)` applies the move
// to the underlying data and re-renders. Items themselves stay clickable —
// only the element matching `handleSelector` (if given) triggers the drag,
// so a "drag the whole row" list can still register normal clicks.
function _addDragDrop(container, itemSelector, dataAttr, onReorder, handleSelector) {
  let dragId = null;
  container.querySelectorAll(itemSelector).forEach((item) => {
    const handle = handleSelector ? item.querySelector(handleSelector) : item;
    if (!handle) return;
    item.setAttribute("draggable", "true");
    if (handleSelector) {
      // Only start a drag from the handle — mousedown elsewhere behaves normally.
      item.addEventListener("mousedown", (e) => {
        item.dataset._dragOk = handle.contains(e.target) ? "1" : "";
      });
      item.addEventListener("dragstart", (e) => {
        if (item.dataset._dragOk !== "1") { e.preventDefault(); return; }
        dragId = item.dataset[dataAttr];
        item.classList.add("drag-active");
        e.dataTransfer.effectAllowed = "move";
      });
    } else {
      item.addEventListener("dragstart", (e) => {
        dragId = item.dataset[dataAttr];
        item.classList.add("drag-active");
        e.dataTransfer.effectAllowed = "move";
      });
    }
    item.addEventListener("dragend", () => {
      dragId = null;
      container
        .querySelectorAll(itemSelector)
        .forEach((el) => el.classList.remove("drag-active", "drag-over"));
    });
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      container
        .querySelectorAll(itemSelector)
        .forEach((el) => el.classList.remove("drag-over"));
      if (item.dataset[dataAttr] !== dragId) item.classList.add("drag-over");
    });
    item.addEventListener("dragleave", () =>
      item.classList.remove("drag-over"),
    );
    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("drag-over");
      if (dragId && item.dataset[dataAttr] !== dragId)
        onReorder(dragId, item.dataset[dataAttr]);
    });
  });
}


// ===== FIX #2 — BOOKMARKS (Real Chrome API) =====
async function loadBookmarks() {
  el("bookmarksLoading").style.display = "flex";
  el("allBookmarksList").innerHTML = "";
  if (el("sidebarFoldersList"))
    el("sidebarFoldersList").innerHTML =
      '<div style="color:var(--text-muted);font-size:11.5px;padding:4px 9px">Loading...</div>';
  const tree = await API.bookmarks();
  S.allBookmarks = parseBookmarkTree(tree);
  el("bookmarksLoading").style.display = "none";
  S.bmFolderFilter = null;
  renderAllBookmarks(S.allBookmarks);
  renderSidebarFolders();
}

// Recursively flatten bookmark tree into array of folder objects
function parseBookmarkTree(nodes) {
  const folders = [];
  function walk(node) {
    if (!node.url && node.title && node.children) {
      // It's a folder
      const items = [];
      collectLeafs(node.children, items);
      if (items.length > 0 || node.id !== "0") {
        // Only add if has bookmarks
        if (items.length > 0) {
          folders.push({ id: node.id, title: node.title || "Untitled", items });
        }
      }
      // Also recurse subfolders
      node.children.forEach((child) => {
        if (!child.url) walk(child);
      });
    }
  }
  function collectLeafs(children, arr) {
    if (!children) return;
    children.forEach((c) => {
      if (c.url) {
        arr.push(c);
      }
      // Don't recurse into sub-folders here, they become their own folders
    });
  }
  // Start from root children
  if (nodes && nodes[0] && nodes[0].children) {
    nodes[0].children.forEach((rootFolder) => {
      walk(rootFolder);
    });
  }
  return folders;
}

// Sidebar bookmark folders list (click to open popup)
function renderSidebarFolders() {
  /* folders feature removed */
}

// FIX #6 — Folders click opens modal
function renderFolders(folders) {
  const grid = el("foldersGrid");
  if (!folders || !folders.length) {
    grid.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📂</div><div class="empty-state-text">No bookmark folders found</div></div>';
    return;
  }
  const colors = [
    "#e11d48",
    "#7c3aed",
    "#059669",
    "#f59e0b",
    "#3b82f6",
    "#ec4899",
  ];
  grid.innerHTML = folders
    .slice(0, 5)
    .map((f, i) => {
      const color = colors[i % colors.length];
      const prev = f.items.slice(0, 4);
      const extra = f.items.length - prev.length;
      const favs = prev
        .map((it) => `<img class="favicon-img" src="${favSrc(it.url)}" alt="">`)
        .join("");
      return `
      <div class="folder-card" data-fid="${escH(f.id)}">
        <div class="folder-card-top">
          <div class="folder-card-icon" style="background:${color}22">
            <span style="font-size:16px">📁</span>
          </div>
          <div class="folder-card-text">
            <div class="folder-card-name">${escH(f.title)}</div>
            <div class="folder-card-count">${f.items.length} bookmark${f.items.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div class="folder-favicons">
          ${favs}
          ${extra > 0 ? `<div class="favicon-more">+${extra}</div>` : ""}
        </div>
      </div>`;
    })
    .join("");
  grid.querySelectorAll(".folder-card[data-fid]").forEach((card) => {
    card.addEventListener("click", () => openFolderModal(card.dataset.fid));
  });
}

// FIX #6 — Folder modal actually shows bookmarks and they're clickable
function openFolderModal(folderId) {
  const folder = S.allBookmarks.find((f) => f.id === folderId);
  if (!folder) return;
  _openFolderId = folderId;
  el("folderModalIcon").textContent = "📁";
  el("folderModalTitle").textContent = folder.title;
  el("folderModalCount").textContent = `${folder.items.length} bookmarks`;

  // Header action buttons (rename / delete folder)
  const actionsEl = el("folderModalActions");
  if (actionsEl) {
    actionsEl.innerHTML = IS_CHROME
      ? `
      <button class="icon-btn" id="_fmRename" data-tip="Rename folder" style="width:26px;height:26px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn" id="_fmDelete" data-tip="Delete folder" style="width:26px;height:26px;color:var(--red)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>`
      : "";
    if (IS_CHROME) {
      actionsEl
        .querySelector("#_fmRename")
        ?.addEventListener("click", () => openEditFolderModal(folderId));
      actionsEl
        .querySelector("#_fmDelete")
        ?.addEventListener("click", () => deleteChromeFolder(folderId));
    }
  }

  const editIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const delIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;

  const itemsEl = el("folderModalItems");
  itemsEl.innerHTML =
    folder.items
      .map(
        (item) => `
    <div class="folder-modal-row">
      <a href="${escH(safeUrl(item.url) || "#")}" class="folder-modal-item" target="_blank" rel="noopener" style="flex:1">
        <img src="${favSrc(item.url)}" alt="">
        <div class="folder-modal-item-info">
          <span class="folder-modal-item-title">${escH(item.title || item.url)}</span>
          <span class="folder-modal-item-url">${escH(getDomain(item.url))}</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:.4"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
      ${
        IS_CHROME
          ? `
        <button class="folder-modal-action-btn" data-bmid="${escH(item.id)}" data-action="edit" data-tip="Edit bookmark">${editIcon}</button>
        <button class="folder-modal-action-btn folder-modal-del-btn" data-bmid="${escH(item.id)}" data-action="del" data-tip="Delete bookmark">${delIcon}</button>
      `
          : ""
      }
    </div>`,
      )
      .join("") +
    (IS_CHROME
      ? `<button class="bm-add-item-btn" id="_fmAddBm" style="padding:9px 12px;border-top:1px solid var(--border);margin-top:4px;width:100%">+ Add bookmark to this folder</button>`
      : "");

  // Close modal on link click
  itemsEl.querySelectorAll(".folder-modal-item").forEach((a) => {
    a.addEventListener("click", () => closeModal("folderModal"));
  });
  if (IS_CHROME) {
    itemsEl.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener("click", () =>
        openEditBookmarkModal(btn.dataset.bmid),
      );
    });
    itemsEl.querySelectorAll('[data-action="del"]').forEach((btn) => {
      btn.addEventListener("click", () => deleteChromeBm(btn.dataset.bmid));
    });
    itemsEl
      .querySelector("#_fmAddBm")
      ?.addEventListener("click", () => openAddBookmarkModal(folderId));
  }
  openModal("folderModal");
}

function renderBmToolbar(folderNames) {
  const filtersEl = el("bmFolderFilters");
  const sortEl = el("bmSortSelect");
  if (sortEl) sortEl.value = S.bmSort;

  if (!filtersEl) return;
  // "All" chip + one chip per folder
  const chips = [
    { label: "All", value: null },
    ...folderNames.map((n) => ({ label: n, value: n })),
  ];
  filtersEl.innerHTML = chips
    .map(
      (c) =>
        `<button class="bm-folder-chip${S.bmFolderFilter === c.value ? " active" : ""}" data-folder="${c.value === null ? "" : escH(c.value)}">${escH(c.label)}</button>`,
    )
    .join("");
  filtersEl.querySelectorAll(".bm-folder-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      S.bmFolderFilter = btn.dataset.folder === "" ? null : btn.dataset.folder;
      // re-render whichever view is active
      if (S.allBookmarks && S.allBookmarks.length)
        renderAllBookmarks(S.allBookmarks);
      else renderBmForActiveWorkspace();
    });
  });
}

function renderAllBookmarks(folders) {
  const list = el("allBookmarksList");
  if (!folders || !folders.length) {
    list.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">🔖</div><div class="empty-state-text">No bookmarks found</div></div>';
    return;
  }

  // Build toolbar
  renderBmToolbar(folders.map((f) => f.title));

  // Apply folder filter
  let visible = S.bmFolderFilter
    ? folders.filter((f) => f.title === S.bmFolderFilter)
    : folders;

  // Sort items within each folder
  visible = visible.map((f) => {
    let items = [...f.items];
    if (S.bmSort === "az")
      items.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (S.bmSort === "za")
      items.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    else if (S.bmSort === "newest")
      items.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
    else if (S.bmSort === "oldest")
      items.sort((a, b) => (a.dateAdded || 0) - (b.dateAdded || 0));
    // 'most' — no reliable visit count from Chrome bookmarks API, keep as-is
    return { ...f, items };
  });

  const editIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const delIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;

  list.innerHTML = visible
    .map(
      (f) => `
    <div class="bm-folder${S.bmFolderFilter ? " open" : ""}" id="bm-${escH(f.id)}">
      <div class="bm-folder-header" data-fid="${escH(f.id)}">
        <span class="bm-folder-chevron">▶</span>
        <div class="bm-folder-icon-wrap">📁</div>
        <span class="bm-folder-name">${escH(f.title)}</span>
        ${
          IS_CHROME
            ? `
          <button class="bm-action-btn" data-action="edit-folder" data-fid="${escH(f.id)}" data-tip="Rename">${editIcon}</button>
          <button class="bm-action-btn bm-del-btn" data-action="delete-folder" data-fid="${escH(f.id)}" data-tip="Delete">${delIcon}</button>
        `
            : ""
        }
        <span class="bm-folder-count">${f.items.length}</span>
      </div>
      <div class="bm-items">
        <div class="bm-items-inner">
          ${f.items
            .map(
              (it) => `
            <a href="${escH(safeUrl(it.url) || "#")}" class="bm-item" target="_self">
              <img src="${favSrc(it.url)}" alt="" width="16" height="16" style="border-radius:3px;flex-shrink:0">
              <span class="bm-item-title">${escH(it.title || it.url)}</span>
              <span class="bm-item-url">${escH(getDomain(it.url))}</span>
              ${IS_CHROME ? `<span class="bm-item-actions">
                <button class="bm-action-btn" data-action="edit-bm" data-bmid="${escH(it.id)}" data-tip="Edit">${editIcon}</button>
                <button class="bm-action-btn bm-del-btn" data-action="delete-bm" data-bmid="${escH(it.id)}" data-tip="Delete">${delIcon}</button>
              </span>` : ""}
            </a>`,
            )
            .join("")}
          ${IS_CHROME ? `<button class="bm-add-item-btn" data-action="add-bm" data-fid="${escH(f.id)}">+ Add bookmark</button>` : ""}
        </div>
      </div>
    </div>`,
    )
    .join("");

  list.querySelectorAll(".bm-folder-header[data-fid]").forEach((h) => {
    h.addEventListener("click", (e) => {
      if (!e.target.closest("[data-action]")) toggleBmFolder(h.dataset.fid);
    });
  });
  list.querySelectorAll('[data-action="edit-folder"]').forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditFolderModal(b.dataset.fid);
    });
  });
  list.querySelectorAll('[data-action="delete-folder"]').forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChromeFolder(b.dataset.fid);
    });
  });
  list.querySelectorAll('[data-action="edit-bm"]').forEach((b) => {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditBookmarkModal(b.dataset.bmid);
    });
  });
  list.querySelectorAll('[data-action="delete-bm"]').forEach((b) => {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteChromeBm(b.dataset.bmid);
    });
  });
  list.querySelectorAll('[data-action="add-bm"]').forEach((b) => {
    b.addEventListener("click", () => openAddBookmarkModal(b.dataset.fid));
  });
}

function toggleBmFolder(id) {
  // Works for Chrome bookmark folders (id="bm-{id}") and ws folders (data-folder header's parent)
  const byId = el("bm-" + id);
  if (byId) {
    byId.classList.toggle("open");
    return;
  }
  // Workspace folder: find header by data-folder, toggle parent .bm-folder
  const header = document.querySelector(
    `.bm-ws-folder-header[data-folder="${CSS.escape(id)}"]`,
  );
  header?.closest(".bm-folder")?.classList.toggle("open");
}

// ===== BOOKMARK CRUD =====
function populateFolderSelect(selectId, selectedId) {
  const sel = el(selectId);
  if (!sel) return;
  sel.innerHTML = S.allBookmarks
    .map(
      (f) =>
        `<option value="${escH(f.id)}"${f.id === selectedId ? " selected" : ""}>${escH(f.title)}</option>`,
    )
    .join("");
}

function openAddBookmarkModal(parentId) {
  if (!IS_CHROME) {
    showToast("Bookmark editing requires Chrome", "error");
    return;
  }
  _bmEditId = null;
  _bmEditParentId =
    parentId || (S.allBookmarks[0] && S.allBookmarks[0].id) || "1";
  el("bookmarkEditModalTitle").textContent = "Add Bookmark";
  el("bmEditName").value = "";
  el("bmEditUrl").value = "";
  el("bmEditDeleteBtn").style.display = "none";
  populateFolderSelect("bmEditFolder", _bmEditParentId);
  openModal("bookmarkEditModal");
}

function openEditBookmarkModal(bmId) {
  if (!IS_CHROME) {
    showToast("Bookmark editing requires Chrome", "error");
    return;
  }
  let item = null,
    parentId = null;
  for (const f of S.allBookmarks) {
    const found = f.items.find((i) => i.id === bmId);
    if (found) {
      item = found;
      parentId = f.id;
      break;
    }
  }
  if (!item) return;
  _bmEditId = bmId;
  _bmEditParentId = parentId;
  el("bookmarkEditModalTitle").textContent = "Edit Bookmark";
  el("bmEditName").value = item.title || "";
  el("bmEditUrl").value = item.url || "";
  el("bmEditDeleteBtn").style.display = "block";
  populateFolderSelect("bmEditFolder", parentId);
  openModal("bookmarkEditModal");
}

async function saveBookmarkEdit() {
  const title = el("bmEditName").value.trim();
  const url = el("bmEditUrl").value.trim();
  const newParentId = el("bmEditFolder").value;
  if (!title) {
    showToast("Enter a title", "error");
    return;
  }
  if (!url) {
    showToast("Enter a URL", "error");
    return;
  }
  const fullUrl = safeUrl(url);
  if (_bmEditId) {
    await API.updateBookmark(_bmEditId, { title, url: fullUrl });
    if (newParentId && newParentId !== _bmEditParentId) {
      await API.moveBookmark(_bmEditId, { parentId: newParentId });
    }
    showToast("Bookmark updated!", "success");
  } else {
    const node = await API.createBookmark({
      parentId: newParentId || "1",
      title,
      url: fullUrl,
    });
    if (!node) {
      showToast("Failed to create bookmark", "error");
      return;
    }
    showToast("Bookmark added!", "success");
  }
  closeModal("bookmarkEditModal");
  await loadBookmarks();
}

function deleteChromeBm(bmId) {
  if (!IS_CHROME) {
    showToast("Requires Chrome", "error");
    return;
  }
  confirm2(
    "Delete Bookmark?",
    "This will permanently remove it from Chrome.",
    async () => {
      await API.removeBookmark(bmId);
      closeModal("bookmarkEditModal");
      showToast("Bookmark deleted", "success");
      await loadBookmarks();
      if (_openFolderId) openFolderModal(_openFolderId);
    },
  );
}

// ===== FOLDER CRUD =====
function openAddFolderModal(parentId) {
  if (!IS_CHROME) {
    showToast("Folder creation requires Chrome", "error");
    return;
  }
  _folderEditId = null;
  _folderParentId = parentId || "1";
  el("folderEditModalTitle").textContent = "New Folder";
  el("folderEditName").value = "";
  el("folderEditSaveBtn").textContent = "Create";
  openModal("folderEditModal");
}

function openEditFolderModal(folderId) {
  if (!IS_CHROME) {
    showToast("Folder editing requires Chrome", "error");
    return;
  }
  const folder = S.allBookmarks.find((f) => f.id === folderId);
  if (!folder) return;
  _folderEditId = folderId;
  el("folderEditModalTitle").textContent = "Rename Folder";
  el("folderEditName").value = folder.title || "";
  el("folderEditSaveBtn").textContent = "Save";
  openModal("folderEditModal");
}

async function saveFolderEdit() {
  const name = el("folderEditName").value.trim();
  if (!name) {
    showToast("Enter a folder name", "error");
    return;
  }
  if (_folderEditId) {
    await API.updateBookmark(_folderEditId, { title: name });
    showToast("Folder renamed!", "success");
  } else {
    const node = await API.createBookmark({
      parentId: _folderParentId,
      title: name,
    });
    if (!node) {
      showToast("Failed to create folder", "error");
      return;
    }
    showToast("Folder created!", "success");
  }
  closeModal("folderEditModal");
  await loadBookmarks();
}

function deleteChromeFolder(folderId) {
  if (!IS_CHROME) {
    showToast("Requires Chrome", "error");
    return;
  }
  const folder = S.allBookmarks.find((f) => f.id === folderId);
  const title = folder ? folder.title : "this folder";
  confirm2(
    `Delete "${title}"?`,
    "All bookmarks inside will be permanently deleted from Chrome.",
    async () => {
      await API.removeBookmarkTree(folderId);
      closeModal("folderModal");
      showToast("Folder deleted", "success");
      await loadBookmarks();
    },
  );
}

// ===== WORKSPACE BOOKMARKS =====
function renderWorkspaceBookmarks() {
  const section = el("wsBmSection");
  if (!section) return;
  if (!IS_CHROME) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  const grid = el("wsBmGrid");
  // Group bookmarks by folderName first
  const groups = {};
  wsBookmarks().forEach((bm) => {
    const key = bm.folderName || "Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(bm);
  });
  // Only show folders that have at least one bookmark
  const folderNames = allWsFolderNames().filter(
    (f) => (groups[f] || []).length > 0,
  );
  if (!folderNames.length) {
    grid.innerHTML = `<button class="qa-add-btn ws-bm-add-card" id="_wsBmAddCard">
      <div class="qa-add-icon">+</div>
      <span style="font-size:11px;color:var(--text-muted)">Add</span>
    </button>`;
    grid
      .querySelector("#_wsBmAddCard")
      ?.addEventListener("click", openWsBmChooser);
    return;
  }
  const colors = [
    "#e11d48",
    "#7c3aed",
    "#059669",
    "#f59e0b",
    "#3b82f6",
    "#ec4899",
    "#0891b2",
    "#d97706",
  ];
  grid.innerHTML =
    folderNames
      .map((folder, i) => {
        const bms = groups[folder] || [];
        const color = colors[i % colors.length];
        const prev = bms.slice(0, 4);
        const extra = bms.length - prev.length;
        const favs = prev
          .map(
            (bm) =>
              `<img class="favicon-img" src="${favSrc(bm.url)}" alt="">`,
          )
          .join("");
        return `
      <div class="folder-card ws-bm-folder-card" data-folder="${escH(folder)}" draggable="true">
        <button class="ws-folder-menu-btn" data-folder="${escH(folder)}" data-tip="Options">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
        <div class="folder-card-top">
          <div class="folder-card-icon" style="background:${color}22">
            <span style="font-size:16px">📁</span>
          </div>
          <div class="folder-card-text">
            <div class="folder-card-name">${escH(folder)}</div>
            <div class="folder-card-count">${bms.length} bookmark${bms.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div class="folder-favicons">
          ${favs}
          ${extra > 0 ? `<div class="favicon-more">+${extra}</div>` : ""}
        </div>
      </div>`;
      })
      .join("") +
    `<button class="qa-add-btn ws-bm-add-card" id="_wsBmAddCard">
    <div class="qa-add-icon">+</div>
    <span style="font-size:11px;color:var(--text-muted)">Add</span>
  </button>`;
  // Click card body → open folder modal; three-dot → folder menu
  grid.querySelectorAll(".ws-bm-folder-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".ws-folder-menu-btn")) return;
      const fn = card.dataset.folder;
      openWsBmFolderModal(fn, groups[fn] || []);
    });
  });
  grid.querySelectorAll(".ws-folder-menu-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openFolderCardCtxMenu(
        btn,
        btn.dataset.folder,
        groups[btn.dataset.folder] || [],
      );
    });
  });
  grid
    .querySelector("#_wsBmAddCard")
    ?.addEventListener("click", openWsBmChooser);

  initDragReorder(grid, ".ws-bm-folder-card", () => {
    const newOrder = [...grid.querySelectorAll(".ws-bm-folder-card")].map(
      (el) => el.dataset.folder,
    );
    const d = wsData();
    const existingMap = new Map((d.folders || []).map((f) => [f.name, f]));
    // Persist new order; convert any bookmark-derived folders to explicit entries
    d.folders = newOrder.map((name) => existingMap.get(name) || { name });
    save();
  });

  // Collapse to 2 rows if there are many folders
  let viewMoreBtn = el("_wsBmViewMore");
  if (viewMoreBtn) viewMoreBtn.remove();

  // Calculate how many items fit in 2 rows based on current grid width
  const colWidth = 200 + 12; // minmax + gap
  const gridWidth =
    grid.offsetWidth || section.offsetWidth || window.innerWidth - 260;
  const cols = Math.max(2, Math.floor((gridWidth + 12) / colWidth));
  const twoRowsMax = cols * 2;
  const totalCards = folderNames.length + 1; // +1 for Add card

  const addCard = grid.querySelector("#_wsBmAddCard");

  function placeAddCardCollapsed() {
    if (!addCard) return;
    const allCards = [...grid.querySelectorAll(".folder-card")];
    // Insert add card at slot twoRowsMax-1 (last slot of 2nd row)
    const insertBefore = allCards[twoRowsMax - 1];
    if (insertBefore) grid.insertBefore(addCard, insertBefore);
  }

  function placeAddCardExpanded() {
    if (addCard) grid.appendChild(addCard);
  }

  if (totalCards > twoRowsMax) {
    // Place add card at last slot of 2nd row, hiding one extra folder card
    placeAddCardCollapsed();
    // Measure actual card height after render and set max-height for 2 rows
    requestAnimationFrame(() => {
      const firstCard = grid.querySelector(".folder-card");
      if (firstCard) {
        const cardH = firstCard.offsetHeight;
        grid.style.maxHeight = cardH * 2 + 12 + 8 + "px"; // +8 for padding
      }
    });
    grid.classList.add("ws-bm-grid-collapsed");
    viewMoreBtn = document.createElement("button");
    viewMoreBtn.id = "_wsBmViewMore";
    viewMoreBtn.className = "ws-bm-view-more-btn";
    // hidden = all folders not visible + the one displaced by add card
    const hiddenCount = folderNames.length - (twoRowsMax - 1);
    viewMoreBtn.innerHTML = `View ${hiddenCount} more <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6,9 12,15 18,9"/></svg>`;
    viewMoreBtn.addEventListener("click", () => {
      const collapsed = grid.classList.toggle("ws-bm-grid-collapsed");
      if (collapsed) {
        placeAddCardCollapsed();
        const firstCard = grid.querySelector(".folder-card");
        if (firstCard)
          grid.style.maxHeight = firstCard.offsetHeight * 2 + 12 + 8 + "px";
      } else {
        placeAddCardExpanded();
        // scrollHeight returns full content height even while max-height is constraining it
        grid.style.maxHeight = grid.scrollHeight + "px";
      }
      viewMoreBtn.innerHTML = collapsed
        ? `View ${hiddenCount} more <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6,9 12,15 18,9"/></svg>`
        : `Show less <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18,15 12,9 6,15"/></svg>`;
    });
    section.appendChild(viewMoreBtn);
  } else {
    grid.classList.remove("ws-bm-grid-collapsed");
  }
}

// ===== BOOKMARK CONTEXT MENU =====
let _ctxMenu = null;
let _ctxSub = null;
let _ctxCurrentFolder = null;

function _getOrCreateCtxMenu() {
  if (!_ctxMenu) {
    _ctxMenu = document.createElement("div");
    _ctxMenu.className = "bm-ctx-menu";
    document.body.appendChild(_ctxMenu);
    _ctxSub = document.createElement("div");
    _ctxSub.className = "bm-ctx-sub";
    document.body.appendChild(_ctxSub);
    document.addEventListener("click", (e) => {
      if (!_ctxMenu.contains(e.target) && !_ctxSub.contains(e.target))
        closeCtxMenu();
    });
  }
  return _ctxMenu;
}

function closeCtxMenu() {
  _ctxMenu?.classList.remove("open");
  _ctxSub?.classList.remove("open");
}

function openFolderCardCtxMenu(btn, folderName, items) {
  const menu = _getOrCreateCtxMenu();
  const rect = btn.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const top = spaceBelow >= 160 ? rect.bottom + 4 : rect.top - 160;
  menu.style.top = Math.max(4, top) + "px";
  menu.style.left = Math.min(rect.left, window.innerWidth - 210) + "px";
  menu.innerHTML = `
    <div class="bm-ctx-item" data-action="add">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add Bookmark
    </div>
    <div class="bm-ctx-item" data-action="rename">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Rename
    </div>
    <div class="bm-ctx-sep"></div>
    <div class="bm-ctx-item danger" data-action="delete">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      Delete folder
    </div>`;
  menu.querySelector('[data-action="add"]').addEventListener("click", () => {
    closeCtxMenu();
    openWsBookmarkEditModal(folderName, null);
  });
  menu.querySelector('[data-action="rename"]').addEventListener("click", () => {
    closeCtxMenu();
    openWsFolderEditModal(folderName);
  });
  menu.querySelector('[data-action="delete"]').addEventListener("click", () => {
    closeCtxMenu();
    const count = items.length;
    confirm2(
      `Delete "${folderName}"?`,
      count
        ? `This will also delete ${count} bookmark${count !== 1 ? "s" : ""} inside.`
        : "The folder is empty.",
      () => removeWsFolder(folderName),
    );
  });
  menu.classList.add("open");
  _ctxSub.classList.remove("open");
}

function openBmCtxMenu(btn, bm, currentFolder) {
  const menu = _getOrCreateCtxMenu();
  _ctxCurrentFolder = currentFolder;

  // Position below/above the button
  const rect = btn.getBoundingClientRect();
  menu.style.top = rect.bottom + 4 + "px";
  menu.style.left = Math.min(rect.left, window.innerWidth - 210) + "px";

  const otherFolders = allWsFolderNames().filter((f) => f !== currentFolder);
  const isPinned = wsQA().some((q) => q.url === bm.url);

  menu.innerHTML = `
    <div class="bm-ctx-item" data-action="edit">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Edit
    </div>
    <div class="bm-ctx-item" data-action="pin">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ${isPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
    </div>
    ${
      otherFolders.length
        ? `<div class="bm-ctx-item" data-action="move-folder">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
      Move to folder
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:auto"><polyline points="9,6 15,12 9,18"/></svg>
    </div>`
        : ""
    }
    <div class="bm-ctx-sep"></div>
    <div class="bm-ctx-item danger" data-action="delete">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      Delete
    </div>`;

  menu.querySelector('[data-action="edit"]')?.addEventListener("click", () => {
    closeCtxMenu();
    closeModal("folderModal");
    openWsBookmarkEditModal(currentFolder, bm.id);
  });

  menu.querySelector('[data-action="pin"]')?.addEventListener("click", () => {
    closeCtxMenu();
    if (isPinned) {
      const d = wsData();
      d.quickAccess = d.quickAccess.filter((q) => q.url !== bm.url);
      save();
      renderQuickAccess();
      showToast("Unpinned from Quick Access", "success");
    } else {
      addQA(bm.title || getDomain(bm.url), bm.url);
    }
  });

  menu
    .querySelector('[data-action="move-folder"]')
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemRect = e.currentTarget.getBoundingClientRect();
      _ctxSub.innerHTML = otherFolders
        .map(
          (f) =>
            `<div class="bm-ctx-sub-item" data-folder="${escH(f)}">📁 ${escH(f)}</div>`,
        )
        .join("");
      _ctxSub.classList.add("open");
      requestAnimationFrame(() => {
        const subW = _ctxSub.offsetWidth,
          subH = _ctxSub.offsetHeight;
        const spaceRight = window.innerWidth - itemRect.right - 8;
        const left =
          spaceRight >= subW ? itemRect.right + 4 : itemRect.left - subW - 4;
        _ctxSub.style.left = Math.max(4, left) + "px";
        _ctxSub.style.top =
          Math.min(itemRect.top, window.innerHeight - subH - 8) + "px";
      });
      _ctxSub.querySelectorAll(".bm-ctx-sub-item").forEach((opt) => {
        opt.addEventListener("click", async () => {
          const d = wsData();
          d.importedBookmarks = (d.importedBookmarks || []).map((b) =>
            b.id === bm.id ? { ...b, folderName: opt.dataset.folder } : b,
          );
          await save();
          closeCtxMenu();
          closeModal("folderModal");
          renderWorkspaceBookmarks();
          renderSidebarFolders();
          showToast(`Moved to "${opt.dataset.folder}"`, "success");
        });
      });
    });

  menu
    .querySelector('[data-action="delete"]')
    ?.addEventListener("click", () => {
      closeCtxMenu();
      confirm2(
        "Delete bookmark?",
        `"${bm.title || bm.url}" will be permanently removed.`,
        async () => {
          await removeWsBm(bm.id);
          closeModal("folderModal");
          showToast("Bookmark deleted", "success");
        },
      );
    });

  menu.classList.add("open");
  _ctxSub.classList.remove("open");
}

function openWsBmFolderModal(folderName, items) {
  closeCtxMenu();
  el("folderModalIcon").textContent = "📁";
  el("folderModalTitle").textContent = folderName;
  el("folderModalCount").textContent = items.length
    ? `${items.length} bookmark${items.length !== 1 ? "s" : ""}`
    : "Empty";

  const actionsEl = el("folderModalActions");
  actionsEl.innerHTML = `
    <button class="btn-primary" id="_wsFmAddBm" style="font-size:12px;padding:5px 10px">+ Add Bookmark</button>
    <button class="icon-btn" id="_wsFmRename" data-tip="Rename folder" style="width:26px;height:26px">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>
    <button class="icon-btn" id="_wsFmDelete" data-tip="Delete folder" style="width:26px;height:26px;color:var(--red)">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
    </button>`;

  actionsEl.querySelector("#_wsFmAddBm").addEventListener("click", () => {
    closeModal("folderModal");
    openWsBookmarkEditModal(folderName, null);
  });
  actionsEl.querySelector("#_wsFmRename").addEventListener("click", () => {
    closeModal("folderModal");
    openWsFolderEditModal(folderName);
  });
  actionsEl.querySelector("#_wsFmDelete").addEventListener("click", () => {
    const count = items.length;
    confirm2(
      `Delete "${folderName}"?`,
      count
        ? `This will also delete ${count} bookmark${count !== 1 ? "s" : ""} inside.`
        : "The folder is empty.",
      () => removeWsFolder(folderName),
    );
  });

  const itemsEl = el("folderModalItems");
  if (!items.length) {
    itemsEl.style.display = "block";
    itemsEl.innerHTML =
      '<div style="color:var(--text-muted);font-size:13px;padding:20px 0;text-align:center">No bookmarks yet. Click "+ Add Bookmark" above.</div>';
  } else {
    itemsEl.style.display = "";
    itemsEl.innerHTML = items
      .map((bm) => {
        const letter = (bm.title || getDomain(bm.url) || "?")[0].toUpperCase();
        return `
      <a class="bm-card" href="${escH(safeUrl(bm.url) || "#")}" target="_self" data-bmid="${escH(bm.id)}" draggable="true">
        <button class="bm-card-menu" data-bmid="${escH(bm.id)}" data-tip="Options">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
        <div class="bm-card-icon" data-letter="${escH(letter)}">
          <img src="${favSrc(bm.url)}" data-img-fallback="bm-icon" alt="">
        </div>
        <div class="bm-card-name">${escH(bm.title || getDomain(bm.url))}</div>
        <div class="bm-card-domain">${escH(getDomain(bm.url))}</div>
      </a>`;
      })
      .join("");
    itemsEl.querySelectorAll(".bm-card-menu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const bm = items.find((b) => b.id === btn.dataset.bmid);
        if (bm) openBmCtxMenu(btn, bm, folderName);
      });
    });
    initDragReorder(itemsEl, ".bm-card", () => {
      const newIds = [...itemsEl.querySelectorAll(".bm-card")].map(
        (el) => el.dataset.bmid,
      );
      const d = wsData();
      // Replace this folder's bookmarks in-place within the flat array
      const folderIndices = d.importedBookmarks.reduce((acc, b, i) => {
        if ((b.folderName || "Other") === folderName) acc.push(i);
        return acc;
      }, []);
      const reordered = newIds
        .map((id) => d.importedBookmarks.find((b) => b.id === id))
        .filter(Boolean);
      folderIndices.forEach((origIdx, i) => {
        if (reordered[i]) d.importedBookmarks[origIdx] = reordered[i];
      });
      save();
    });
  }
  openModal("folderModal");
}

async function removeWsBm(id) {
  const d = wsData();
  d.importedBookmarks = (d.importedBookmarks || []).filter((b) => b.id !== id);
  await save();
  renderWorkspaceBookmarks();
}

function openWsBmChooser() {
  openModal("wsBmChooserModal");
}

function openWsFolderEditModal(existingName) {
  _wsFolderEditName = existingName || null;
  const isEdit = !!existingName;
  el("wsFolderEditTitle").textContent = isEdit ? "Rename Folder" : "New Folder";
  el("wsFolderEditNameInput").value = existingName || "";
  el("wsFolderEditSaveBtn").textContent = isEdit ? "Save" : "Create";
  openModal("wsFolderEditModal");
}

async function saveWsFolderEdit() {
  const name = el("wsFolderEditNameInput").value.trim();
  if (!name) {
    showToast("Enter a folder name", "error");
    return;
  }
  const d = wsData();
  if (_wsFolderEditName) {
    // Rename: update folders array + all bookmark folderName references
    const f = d.folders.find((x) => x.name === _wsFolderEditName);
    if (f) f.name = name;
    else d.folders.push({ name });
    d.importedBookmarks = (d.importedBookmarks || []).map((b) =>
      b.folderName === _wsFolderEditName ? { ...b, folderName: name } : b,
    );
    showToast("Folder renamed!", "success");
  } else {
    // Create: check for duplicate
    const existing = allWsFolderNames();
    if (existing.includes(name)) {
      showToast("A folder with that name already exists", "error");
      return;
    }
    d.folders.push({ name });
    showToast("Folder created!", "success");
  }
  await save();
  closeModal("wsFolderEditModal");
  renderWorkspaceBookmarks();
  renderSidebarFolders();
}

function _setWsBmFolder(value, label) {
  _wsBmFolderValue = value;
  el("wsBmFolderLabel").textContent = label || value;
  el("wsBmFolderLabel").style.color = value
    ? "var(--text-primary)"
    : "var(--text-muted)";
  // Update selected highlight
  el("wsBmFolderDropdown")
    .querySelectorAll(".csel-option")
    .forEach((o) => {
      o.classList.toggle("selected", o.dataset.value === value);
    });
  _closeCsel();
}

function _closeCsel() {
  el("wsBmFolderBtn")?.classList.remove("open");
  el("wsBmFolderDropdown")?.classList.remove("open");
}

function openWsBookmarkEditModal(defaultFolderName, bmId) {
  _wsBmEditId = bmId || null;
  _wsBmDefaultFolder = defaultFolderName || null;
  const isEdit = !!bmId;
  const folders = allWsFolderNames();

  // Build custom dropdown options
  const dropdown = el("wsBmFolderDropdown");
  if (!folders.length) {
    dropdown.innerHTML = `<div class="csel-option" data-value="__new__">📁 Create a folder first...</div>`;
    _setWsBmFolder("__new__", "📁 Create a folder first...");
  } else {
    dropdown.innerHTML = folders
      .map(
        (f) =>
          `<div class="csel-option" data-value="${escH(f)}">📁 ${escH(f)}</div>`,
      )
      .join("");
    const initial =
      (isEdit
        ? wsBookmarks().find((b) => b.id === bmId)?.folderName
        : defaultFolderName) || folders[0];
    _setWsBmFolder(initial, `📁 ${initial}`);
  }
  dropdown.querySelectorAll(".csel-option").forEach((opt) => {
    opt.addEventListener("click", () =>
      _setWsBmFolder(opt.dataset.value, opt.textContent),
    );
  });

  if (isEdit) {
    const bm = wsBookmarks().find((b) => b.id === bmId);
    if (!bm) return;
    el("wsBookmarkEditTitle").textContent = "Edit Bookmark";
    el("wsBmEditTitle").value = bm.title || "";
    el("wsBmEditUrl").value = bm.url || "";
    el("wsBmEditDeleteBtn").style.display = "block";
    el("wsBmEditSaveBtn").textContent = "Save";
  } else {
    el("wsBookmarkEditTitle").textContent = "Add Bookmark";
    el("wsBmEditTitle").value = "";
    el("wsBmEditUrl").value = "";
    el("wsBmEditDeleteBtn").style.display = "none";
    el("wsBmEditSaveBtn").textContent = "Add Bookmark";
  }
  openModal("wsBookmarkEditModal");
}

async function saveWsBookmarkEdit() {
  const folder = _wsBmFolderValue;
  if (folder === "__new__") {
    closeModal("wsBookmarkEditModal");
    openWsFolderEditModal(null);
    return;
  }
  const title = el("wsBmEditTitle").value.trim();
  const url = el("wsBmEditUrl").value.trim();
  if (!url) {
    showToast("Enter a URL", "error");
    return;
  }
  const fullUrl = safeUrl(url);
  const d = wsData();
  if (_wsBmEditId) {
    d.importedBookmarks = (d.importedBookmarks || []).map((b) =>
      b.id === _wsBmEditId
        ? { ...b, title: title || fullUrl, url: fullUrl, folderName: folder }
        : b,
    );
    showToast("Bookmark updated!", "success");
  } else {
    const newBm = {
      id: "ws_" + Date.now(),
      title: title || fullUrl,
      url: fullUrl,
      folderName: folder,
    };
    d.importedBookmarks = [...(d.importedBookmarks || []), newBm];
    showToast("Bookmark added!", "success");
  }
  await save();
  closeModal("wsBookmarkEditModal");
  renderWorkspaceBookmarks();
  renderSidebarFolders();
}

async function removeWsFolder(folderName) {
  const d = wsData();
  d.folders = (d.folders || []).filter((f) => f.name !== folderName);
  d.importedBookmarks = (d.importedBookmarks || []).filter(
    (b) => (b.folderName || "Other") !== folderName,
  );
  await save();
  closeModal("folderModal");
  renderWorkspaceBookmarks();
  renderSidebarFolders();
  showToast("Folder deleted", "success");
}

// ===== DRAG REORDER =====
function initDragReorder(container, itemSelector, onDrop) {
  let dragSrc = null;
  let placeholder = null;
  let didDrop = false;

  function getItems() {
    return [...container.querySelectorAll(itemSelector)];
  }

  function clearTransforms() {
    getItems().forEach((el) => {
      el.style.transition = "";
      el.style.transform = "";
    });
  }

  // FLIP: snapshot positions → move placeholder → animate items to new positions
  function movePlaceholder(newNext) {
    if (placeholder.nextElementSibling === newNext) return; // already there
    const snap = new Map(
      getItems().map((el) => [el, el.getBoundingClientRect()]),
    );
    container.insertBefore(placeholder, newNext);
    getItems().forEach((el) => {
      const before = snap.get(el);
      if (!before) return;
      const after = el.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px,${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.16s ease";
        el.style.transform = "";
      });
    });
  }

  container.addEventListener("dragstart", (e) => {
    if (e.target.closest("button")) {
      e.preventDefault();
      return;
    }
    const item = e.target.closest(itemSelector);
    if (!item) return;
    dragSrc = item;
    didDrop = false;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");

    // Custom ghost: slightly scaled + shadow so it looks "lifted"
    const ghost = item.cloneNode(true);
    Object.assign(ghost.style, {
      position: "fixed",
      top: "-9999px",
      left: "-9999px",
      width: item.offsetWidth + "px",
      pointerEvents: "none",
      transform: "scale(1.05) rotate(-1deg)",
      boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
      borderRadius: getComputedStyle(item).borderRadius,
      opacity: "0.95",
    });
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(
      ghost,
      item.offsetWidth / 2,
      item.offsetHeight / 2,
    );
    requestAnimationFrame(() => ghost.remove());

    // Hide original + insert placeholder in its spot
    requestAnimationFrame(() => {
      if (!dragSrc) return;
      placeholder = document.createElement("div");
      placeholder.className = "drag-placeholder";
      placeholder.style.cssText = `width:${item.offsetWidth}px;height:${item.offsetHeight}px;flex-shrink:0`;
      container.insertBefore(placeholder, dragSrc);
      dragSrc.style.display = "none";
    });
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!dragSrc || !placeholder) return;
    const target = e.target.closest(itemSelector);
    if (!target || target === dragSrc) return;
    const rect = target.getBoundingClientRect();
    const after = e.clientX > rect.left + rect.width / 2;
    movePlaceholder(after ? target.nextElementSibling : target);
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!dragSrc || !placeholder) return;
    didDrop = true;
    clearTransforms();
    dragSrc.style.display = "";
    container.insertBefore(dragSrc, placeholder);
    placeholder.remove();
    placeholder = null;
    dragSrc = null;
    onDrop();
  });

  container.addEventListener("dragend", () => {
    if (didDrop) return;
    clearTransforms();
    if (dragSrc) {
      dragSrc.style.display = "";
      if (placeholder) container.insertBefore(dragSrc, placeholder);
    }
    placeholder?.remove();
    placeholder = null;
    dragSrc = null;
  });
}

// ===== HISTORY =====
function _historyDateLabel(ts) {
  const nowDay = new Date();
  nowDay.setHours(0, 0, 0, 0);
  const itemDay = new Date(ts);
  itemDay.setHours(0, 0, 0, 0);
  const diff = Math.round((nowDay - itemDay) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This Week";
  if (diff < 30) return "This Month";
  return "Older";
}

async function loadHistory(q) {
  el("historyLoading").style.display = "flex";
  const items = await API.history(q);
  el("historyLoading").style.display = "none";
  const list = el("historyList");
  if (!items.length) {
    list.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">🕐</div><div class="empty-state-text">No history found</div></div>';
    return;
  }
  const groups = {};
  const groupOrder = [];
  items.slice(0, 150).forEach((it) => {
    const lbl = _historyDateLabel(it.lastVisitTime);
    if (!groups[lbl]) {
      groups[lbl] = [];
      groupOrder.push(lbl);
    }
    groups[lbl].push(it);
  });
  list.innerHTML = groupOrder
    .map(
      (lbl) => `
    <div class="history-date-group">
      <div class="history-date-label">${lbl}</div>
      <div class="history-group-items">
        ${groups[lbl]
          .map((it) => {
            const initial = escH(
              (it.title || getDomain(it.url) || "?")[0].toUpperCase(),
            );
            return `<div class="history-item-wrap">
            <a href="${escH(safeUrl(it.url) || "#")}" class="history-item" target="_blank" rel="noopener">
              <img src="${favSrc(it.url)}" alt="" width="16" height="16" style="border-radius:3px;flex-shrink:0">
              <span class="history-item-title">${escH(it.title || getDomain(it.url) || it.url)}</span>
              <span class="history-item-url">${escH(getDomain(it.url))}</span>
              <span class="history-item-time">${fmtTimeAgo(it.lastVisitTime)}</span>
            </a>
            <button class="history-delete-btn" data-url="${escH(it.url)}" data-tip="Remove from history">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>`;
          })
          .join("")}
      </div>
    </div>`,
    )
    .join("");

  list.querySelectorAll(".history-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const url = btn.dataset.url;
      await API.deleteHistoryUrl(url);
      btn.closest(".history-item-wrap").remove();
    });
  });

  const clearAllBtn = el("historyClearAllBtn");
  if (clearAllBtn) {
    clearAllBtn.onclick = async () => {
      if (!confirm("Clear all browsing history? This cannot be undone."))
        return;
      await API.deleteAllHistory();
      list.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">🕐</div><div class="empty-state-text">History cleared</div></div>';
    };
  }
}

// ===== DOWNLOADS =====
function _extBadgeColor(ext) {
  const m = {
    pdf: ["#f87171", "rgba(239,68,68,.14)"],
    zip: ["#fbbf24", "rgba(245,158,11,.14)"],
    rar: ["#fbbf24", "rgba(245,158,11,.14)"],
    "7z": ["#fbbf24", "rgba(245,158,11,.14)"],
    tar: ["#fbbf24", "rgba(245,158,11,.14)"],
    gz: ["#fbbf24", "rgba(245,158,11,.14)"],
    jpg: ["#34d399", "rgba(16,185,129,.14)"],
    jpeg: ["#34d399", "rgba(16,185,129,.14)"],
    png: ["#34d399", "rgba(16,185,129,.14)"],
    gif: ["#34d399", "rgba(16,185,129,.14)"],
    webp: ["#34d399", "rgba(16,185,129,.14)"],
    svg: ["#34d399", "rgba(16,185,129,.14)"],
    mp4: ["#a78bfa", "rgba(139,92,246,.14)"],
    mov: ["#a78bfa", "rgba(139,92,246,.14)"],
    avi: ["#a78bfa", "rgba(139,92,246,.14)"],
    mkv: ["#a78bfa", "rgba(139,92,246,.14)"],
    webm: ["#a78bfa", "rgba(139,92,246,.14)"],
    mp3: ["#f472b6", "rgba(236,72,153,.14)"],
    wav: ["#f472b6", "rgba(236,72,153,.14)"],
    flac: ["#f472b6", "rgba(236,72,153,.14)"],
    js: ["#fde047", "rgba(234,179,8,.14)"],
    ts: ["#60a5fa", "rgba(59,130,246,.14)"],
    jsx: ["#60a5fa", "rgba(59,130,246,.14)"],
    tsx: ["#60a5fa", "rgba(59,130,246,.14)"],
    doc: ["#60a5fa", "rgba(59,130,246,.14)"],
    docx: ["#60a5fa", "rgba(59,130,246,.14)"],
    xls: ["#4ade80", "rgba(34,197,94,.14)"],
    xlsx: ["#4ade80", "rgba(34,197,94,.14)"],
    json: ["#94a3b8", "rgba(148,163,184,.1)"],
  };
  const [color, bg] = m[ext] || ["#94a3b8", "rgba(148,163,184,.1)"];
  return { color, bg };
}

async function loadDownloads() {
  el("downloadsLoading").style.display = "flex";
  const items = await API.downloads();
  el("downloadsLoading").style.display = "none";
  const list = el("downloadsList");
  if (!items.length) {
    list.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">⬇️</div><div class="empty-state-text">No downloads found</div></div>';
    return;
  }
  list.innerHTML = items
    .map((it) => {
      const fn = (it.filename || "").split(/[/\\]/).pop() || "Unknown";
      const ext = fn.includes(".") ? fn.split(".").pop().toLowerCase() : "";
      const badge = ext ? ext.slice(0, 4) : "?";
      const { color, bg } = _extBadgeColor(ext);
      const stateCls =
        it.state === "complete"
          ? "dl-complete"
          : it.state === "in_progress"
            ? "dl-progress"
            : "dl-interrupted";
      const stateLabel =
        it.state === "complete"
          ? "Complete"
          : it.state === "in_progress"
            ? "In Progress"
            : it.state === "interrupted"
              ? "Interrupted"
              : "Unknown";
      return `<div class="download-item ${stateCls}">
      <div class="download-ext-badge" style="color:${color};background:${bg}">${escH(badge)}</div>
      <span class="download-name">${escH(fn)}</span>
      <span class="download-meta">${fmtBytes(it.fileSize || 0)}<span class="dl-sep">·</span>${it.startTime ? new Date(it.startTime).toLocaleDateString() : ""}</span>
      <span class="download-status-badge">${stateLabel}</span>
      ${
        it.state === "complete"
          ? `<button class="dl-show-btn" data-dlid="${it.id}" data-tip="Show in folder">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><polyline points="9,14 12,17 15,14"/></svg>
        Show in folder
      </button>`
          : ""
      }
    </div>`;
    })
    .join("");

  list.querySelectorAll(".dl-show-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      API.showDownload(Number(btn.dataset.dlid)),
    );
  });
}

// ===== FIX #5 — QUICK ACCESS WITH REMOVE =====
function renderQuickAccess() {
  const grid = el("quickAccessGrid");
  if (!grid) return;
  const items = wsQA();
  const mode = S.settings.qaMode || "icon";

  grid.dataset.qaMode = mode;
  // Sync mode buttons
  document
    .querySelectorAll("#qaModeBtns .qa-mode-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));

  grid.innerHTML =
    items
      .map((item) => {
        const domain = getDomain(item.url);
        return `<a href="${escH(safeUrl(item.url) || "#")}" class="qa-card" data-qaid="${item.id}" draggable="true">
      <button class="qa-menu-btn" data-qaid="${item.id}" title="Options">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
      </button>
      <div class="qa-favicon"><img src="${favSrc(item.url)}" alt=""></div>
      <span class="qa-name">${escH(item.name)}</span>
      <span class="qa-desc">${escH(domain)}</span>
    </a>`;
      })
      .join("") +
    `<button class="qa-card qa-add-card" id="_qaAddBtn">
    <div class="qa-add-icon">+</div>
    <span class="qa-name">Add</span>
  </button>`;

  grid.querySelectorAll(".qa-menu-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const item = items.find((q) => String(q.id) === btn.dataset.qaid);
      if (item) openQACtxMenu(btn, item);
    });
  });

  initDragReorder(grid, ".qa-card:not(.qa-add-card)", () => {
    const newOrder = [
      ...grid.querySelectorAll(".qa-card:not(.qa-add-card)"),
    ].map((el) => Number(el.dataset.qaid));
    wsData().quickAccess = newOrder
      .map((id) => items.find((q) => q.id === id))
      .filter(Boolean);
    save();
  });

  grid
    .querySelector("#_qaAddBtn")
    ?.addEventListener("click", () => openQAEditModal(null));
}

function removeQA(e, id) {
  e.preventDefault();
  e.stopPropagation();
  const qaId = Number(id);
  const data = wsData();
  const item = data.quickAccess.find((q) => q.id === qaId);
  if (!item) return;
  data.quickAccess = data.quickAccess.filter((q) => q.id !== qaId);
  if (item.url) S._qaDeleted.add(_normUrl(item.url));
  S.trash.push({
    ...item,
    _type: "quickAccess",
    _deletedAt: Date.now(),
  });
  save();
  renderQuickAccess();
  renderTrash();
  showToast("Removed from Quick Access", "success");
}

const QA_MAX = 100;

// Maps domain → category label for Quick Access section headers
const QA_CATEGORY_MAP = {
  "claude.ai": "AI", "chat.openai.com": "AI", "gemini.google.com": "AI",
  "perplexity.ai": "AI", "cursor.com": "AI", "bolt.new": "AI",
  "midjourney.com": "AI", "v0.dev": "AI", "copilot.microsoft.com": "AI",
  "github.com": "Dev", "vercel.com": "Dev", "supabase.com": "Dev",
  "cloudflare.com": "Dev", "hub.docker.com": "Dev", "linear.app": "Dev",
  "stripe.com": "Dev", "dev.to": "Dev", "stackoverflow.com": "Dev",
  "postman.com": "Dev", "railway.app": "Dev", "render.com": "Dev",
  "python.org": "Frameworks", "djangoproject.com": "Frameworks",
  "django-rest-framework.org": "Frameworks", "fastapi.tiangolo.com": "Frameworks",
  "rust-lang.org": "Frameworks", "react.dev": "Frameworks",
  "nextjs.org": "Frameworks", "tailwindcss.com": "Frameworks",
  "notion.so": "Productivity", "readwise.io": "Productivity",
  "raindrop.io": "Productivity", "lu.ma": "Productivity",
  "upwork.com": "Productivity", "producthunt.com": "Productivity",
  "mobbin.com": "Productivity", "n8n.io": "Productivity",
  "hamropatro.com": "Productivity",
  "x.com": "Socials", "twitter.com": "Socials", "linkedin.com": "Socials",
  "instagram.com": "Socials", "reddit.com": "Socials",
  "discord.com": "Socials", "youtube.com": "Socials",
  "mail.google.com": "Google", "drive.google.com": "Google",
  "calendar.google.com": "Google", "docs.google.com": "Google",
  "meet.google.com": "Google", "sheets.google.com": "Google",
  "photos.google.com": "Google",
};

function addQA(name, url) {
  const data = wsData();
  const item = { id: Date.now(), name, url };
  S._qaDeleted.delete(_normUrl(url)); // allow intentional re-add
  if (data.quickAccess.filter(q => !q.__section).length >= QA_MAX) {
    openQAReplaceModal(item);
    return;
  }
  data.quickAccess.push(item);
  save();
  renderQuickAccess();
  showToast("Quick access added!", "success");
}

function openQAReplaceModal(newItem) {
  const current = wsData().quickAccess;
  el("qaReplaceNewName").textContent = newItem.name;
  const list = el("qaReplaceList");
  list.innerHTML = current
    .map(
      (q) => `
    <button class="qa-replace-row" data-qaid="${q.id}">
      <img src="${favSrc(q.url)}" width="16" height="16" style="border-radius:3px;flex-shrink:0">
      <span class="qa-replace-name">${escH(q.name)}</span>
      <span class="qa-replace-url">${escH(getDomain(q.url))}</span>
      <span class="qa-replace-tag">Replace</span>
    </button>`,
    )
    .join("");
  list.querySelectorAll(".qa-replace-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = wsData();
      const idx = d.quickAccess.findIndex(
        (q) => String(q.id) === btn.dataset.qaid,
      );
      if (idx !== -1) d.quickAccess[idx] = newItem;
      save();
      renderQuickAccess();
      closeModal("qaReplaceModal");
      showToast(`Replaced with "${newItem.name}"`, "success");
    });
  });
  openModal("qaReplaceModal");
}

function openQAEditModal(item) {
  _qaEditId = item ? item.id : null;
  const modal = el("quickAccessModal");
  modal.querySelector("h3").textContent = item
    ? "Edit Quick Access"
    : "Add Quick Access";
  el("qaName").value = item ? item.name : "";
  el("qaUrl").value = item ? item.url : "";
  el("saveQuickAccessBtn").textContent = item ? "Save" : "Add";
  openModal("quickAccessModal");
}

function openQACtxMenu(btn, item) {
  const menu = _getOrCreateCtxMenu();
  const rect = btn.getBoundingClientRect();
  const menuH = 76;
  const spaceBelow = window.innerHeight - rect.bottom;
  const top = spaceBelow >= menuH + 6 ? rect.bottom + 4 : rect.top - menuH - 4;
  menu.style.top = Math.max(4, top) + "px";
  menu.style.left = Math.min(rect.left, window.innerWidth - 180) + "px";
  menu.innerHTML = `
    <div class="bm-ctx-item" data-action="edit">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Edit
    </div>
    <div class="bm-ctx-sep"></div>
    <div class="bm-ctx-item danger" data-action="delete">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      Delete
    </div>`;
  menu.querySelector('[data-action="edit"]').addEventListener("click", () => {
    closeCtxMenu();
    openQAEditModal(item);
  });
  menu.querySelector('[data-action="delete"]').addEventListener("click", () => {
    closeCtxMenu();
    confirm2(
      "Remove from Quick Access?",
      `"${item.name}" will be moved to trash.`,
      () => {
        const data = wsData();
        const found = data.quickAccess.find((q) => q.id === item.id);
        if (found) {
          if (found.url) S._qaDeleted.add(_normUrl(found.url));
          S.trash.push({
            ...found,
            _type: "quickAccess",
            _deletedAt: Date.now(),
          });
        }
        data.quickAccess = data.quickAccess.filter((q) => q.id !== item.id);
        save();
        renderQuickAccess();
        renderTrash();
        showToast("Removed from Quick Access", "success");
      },
    );
  });
  menu.classList.add("open");
  _ctxSub.classList.remove("open");
}

// ===== MARKDOWN RENDERER =====
function _mdRender(text) {
  if (!text) return "";
  let html = escH(text);
  // Code blocks (``` ... ```)
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="md-code-block"><code>${code.trim()}</code></pre>`);
  // Inline code
  html = html.replace(/`([^`]+)`/g, (_, c) => `<code class="md-code">${c}</code>`);
  // Headers
  html = html.replace(/^### (.+)$/gm, (_, t) => `<h3 class="md-h3">${t}</h3>`);
  html = html.replace(/^## (.+)$/gm, (_, t) => `<h2 class="md-h2">${t}</h2>`);
  html = html.replace(/^# (.+)$/gm, (_, t) => `<h1 class="md-h1">${t}</h1>`);
  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, (_, t) => `<strong><em>${t}</em></strong>`);
  html = html.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
  html = html.replace(/\*(.+?)\*/g, (_, t) => `<em>${t}</em>`);
  html = html.replace(/__(.+?)__/g, (_, t) => `<strong>${t}</strong>`);
  html = html.replace(/_(.+?)_/g, (_, t) => `<em>${t}</em>`);
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, (_, t) => `<del>${t}</del>`);
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    const clean = safeUrl(u);
    return clean ? `<a href="${clean}" target="_blank" rel="noopener" class="md-link">${t}</a>` : t;
  });
  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, (_, t) => `<li class="md-li">${t}</li>`);
  html = html.replace(/(<li.*<\/li>\n?)+/g, (m) => `<ul class="md-ul">${m}</ul>`);
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, (_, t) => `<li class="md-li">${t}</li>`);
  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, (_, t) => `<blockquote class="md-bq">${t}</blockquote>`);
  // Horizontal rule
  html = html.replace(/^---+$/gm, "<hr class='md-hr'>");
  // Newlines → <br> (skip inside blocks)
  html = html.replace(/\n/g, "<br>");
  return html;
}

let _noteMdPreviewOn = false;

function _toggleNoteMarkdown() {
  const ta = el("noteContent");
  const preview = el("noteMdPreview");
  const btn = el("noteMdToggle");
  if (!ta || !preview || !btn) return;
  _noteMdPreviewOn = !_noteMdPreviewOn;
  btn.setAttribute("aria-pressed", String(_noteMdPreviewOn));
  if (_noteMdPreviewOn) {
    preview.innerHTML = _mdRender(ta.value);
    preview.style.display = "";
    ta.style.display = "none";
    btn.classList.add("active");
  } else {
    preview.style.display = "none";
    ta.style.display = "";
    ta.focus();
    btn.classList.remove("active");
  }
}

// ===== NOTES =====
function renderNotesWidget() {
  const notes = wsNotes();
  const list = el("notesList");
  if (!notes.length) {
    list.innerHTML = `<div class="widget-empty-state">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      <span>No notes yet</span></div>`;
    return;
  }
  list.innerHTML = notes
    .slice(0, 5)
    .map(
      (n) => `
    <div class="note-item" data-nid="${n.id}">
      <svg class="note-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <div class="note-item-body">
        <div class="note-item-title">${n.pinned ? '<span class="note-pinned-dot"></span>' : ""}${escH(n.title || n.content)}</div>
        ${n.content && n.title ? `<div class="note-item-preview">${escH(n.content.slice(0, 60))}</div>` : ""}
      </div>
    </div>`,
    )
    .join("");
  list.querySelectorAll(".note-item[data-nid]").forEach((item) => {
    item.addEventListener("click", () =>
      openNoteEdit(Number(item.dataset.nid)),
    );
  });
}

function renderNotesView() {
  const allNotes = wsNotes();
  const list = el("notesViewList");
  const filtersEl = el("notesTagFilters");

  // Build tag filter bar from all unique tags
  const allTags = [...new Set(allNotes.flatMap((n) => n.tags || []))].sort();
  if (filtersEl) {
    filtersEl.innerHTML = allTags
      .map(
        (t) =>
          `<button class="notes-tag-filter${S.notesViewTagFilter === t ? " active" : ""}" data-tag="${escH(t)}">${escH(t)}</button>`,
      )
      .join("");
    filtersEl.querySelectorAll(".notes-tag-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        S.notesViewTagFilter =
          S.notesViewTagFilter === btn.dataset.tag ? null : btn.dataset.tag;
        renderNotesView();
      });
    });
  }

  // Filter notes by search query and active tag
  let notes = allNotes;
  const q = S.notesViewSearch.toLowerCase();
  if (q)
    notes = notes.filter(
      (n) =>
        (n.title || "").toLowerCase().includes(q) ||
        (n.content || "").toLowerCase().includes(q),
    );
  if (S.notesViewTagFilter)
    notes = notes.filter((n) => (n.tags || []).includes(S.notesViewTagFilter));

  if (!notes.length) {
    list.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📝</div><div class="empty-state-text">${q || S.notesViewTagFilter ? "No notes match your search." : 'No notes yet. Click "+ New Note" to create one.'}</div></div>`;
    return;
  }

  // Pinned first
  const sorted = [
    ...notes.filter((n) => n.pinned),
    ...notes.filter((n) => !n.pinned),
  ];
  list.innerHTML = sorted
    .map((n) => {
      const tags = n.tags || [];
      const dateStr = new Date(n.updatedAt || n.createdAt || n.date).toLocaleDateString(
        undefined,
        { month: "short", day: "numeric" },
      );
      return `<div class="note-card${n.pinned ? " pinned" : ""}" data-nid="${n.id}">
      ${n.pinned ? '<span class="note-card-pin" data-tip="Pinned">📌</span>' : ""}
      <div class="note-card-title">${escH(n.title || "Untitled")}</div>
      <div class="note-card-content">${escH(n.content)}</div>
      <div class="note-card-footer">
        <span class="note-card-date">${dateStr}</span>
        ${
          tags.length
            ? `<div class="note-card-tags">${tags
                .slice(0, 3)
                .map((t) => `<span class="note-card-tag">${escH(t)}</span>`)
                .join("")}</div>`
            : ""
        }
      </div>
      <button class="note-card-del-btn" data-nid="${n.id}" data-tip="Delete" aria-label="Delete note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
    </div>`;
    })
    .join("");
  list.querySelectorAll(".note-card[data-nid]").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".note-card-del-btn"))
        openNoteEdit(Number(card.dataset.nid));
    });
    card.querySelector(".note-card-del-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteNoteById(Number(card.dataset.nid));
    });
  });
}

// ===== NOTE EDITOR HELPERS =====
let _noteTags = [];
let _notePinned = false;

function renderNoteEditorTags() {
  const list = el("noteTagsList");
  if (!list) return;
  list.innerHTML = _noteTags
    .map(
      (t, i) =>
        `<span class="note-tag-chip">${escH(t)}<span class="note-tag-chip-x" data-i="${i}">✕</span></span>`,
    )
    .join("");
  list.querySelectorAll(".note-tag-chip-x").forEach((x) => {
    x.addEventListener("click", () => {
      _noteTags.splice(Number(x.dataset.i), 1);
      renderNoteEditorTags();
    });
  });
}

function updateNotePinBtn() {
  const btn = el("notePinBtn");
  const lbl = el("notePinLabel");
  if (!btn) return;
  btn.classList.toggle("pinned", _notePinned);
  if (lbl) lbl.textContent = _notePinned ? "Pinned" : "Pin";
}

function updateNoteWordCount() {
  const wc = el("noteWordCount");
  if (!wc) return;
  const words = (el("noteContent")?.value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  wc.textContent = `${words} word${words === 1 ? "" : "s"}`;
}

function openNoteEdit(id) {
  const noteId = Number(id);
  const note = wsNotes().find((n) => n.id === noteId);
  if (!note) return;
  S.editingNoteId = noteId;
  el("noteModalTitle").textContent = "Edit Note";
  el("noteTitle").value = note.title || "";
  el("noteContent").value = note.content || "";
  el("deleteNoteBtn").style.display = "block";
  _noteTags = Array.isArray(note.tags) ? [...note.tags] : [];
  _notePinned = !!note.pinned;
  renderNoteEditorTags();
  updateNotePinBtn();
  updateNoteWordCount();
  openModal("noteModal");
}

function openNoteNew() {
  S.editingNoteId = null;
  el("noteModalTitle").textContent = "New Note";
  el("noteTitle").value = "";
  el("noteContent").value = "";
  el("deleteNoteBtn").style.display = "none";
  _noteTags = [];
  _notePinned = false;
  renderNoteEditorTags();
  updateNotePinBtn();
  updateNoteWordCount();
  openModal("noteModal");
  setTimeout(() => el("noteTitle").focus(), 60);
}

function saveNote() {
  const title = el("noteTitle").value.trim();
  const content = el("noteContent").value.trim();
  if (!content && !title) {
    showToast("Write something first!", "error");
    return;
  }
  const notes = wsNotes();
  const now = Date.now();
  if (S.editingNoteId) {
    const idx = notes.findIndex((n) => n.id === S.editingNoteId);
    if (idx > -1)
      notes[idx] = {
        ...notes[idx],
        title: title || "Untitled",
        content,
        updatedAt: now,
        tags: _noteTags,
        pinned: _notePinned,
      };
  } else {
    notes.unshift({
      id: now,
      title: title || "Untitled",
      content,
      date: now,
      updatedAt: now,
      tags: _noteTags,
      pinned: _notePinned,
    });
  }
  save();
  renderNotesWidget();
  renderNotesView();
  // Reset markdown preview state
  if (_noteMdPreviewOn) _toggleNoteMarkdown();
  closeModal("noteModal");
  showToast("Note saved!", "success");
}

function deleteNote() {
  if (!S.editingNoteId) return;
  deleteNoteById(S.editingNoteId);
  if (_noteMdPreviewOn) _toggleNoteMarkdown();
  closeModal("noteModal");
}

// Delete a note directly by ID (used by inline buttons in note cards)
function deleteNoteById(id) {
  const noteId = Number(id);
  const data = wsData();
  const note = data.notes.find((n) => n.id === noteId);
  if (note) {
    S.trash.push({
      ...note,
      _type: "note",
      _deletedAt: Date.now(),
    });
    data.notes = data.notes.filter((n) => n.id !== noteId);
    S.editingNoteId = null;
    save();
    renderNotesWidget();
    renderNotesView();
    renderTrash();
    showToast("Note deleted", "success");
  }
}

// ===== KANBAN DASHBOARD WIDGET (Todo-only with checkbox CRUD) =====
function renderKanbanDash() {
  const container = el("kanbanDashCols");
  if (container) {
    const kb = getKanban();
    const todos = _sortByReminder(kb.todo || []);

    if (!todos.length) {
      container.innerHTML = `<div class="kd-empty">No to-dos yet — click + to add one.</div>`;
    } else {
      container.innerHTML = todos.map(card => `
    <div class="kd-todo-item" data-kid="${card.id}">
      <div class="kd-todo-check" data-kid="${card.id}" title="Mark done"></div>
      <span class="kd-todo-text">${escH(card.title)}</span>
      ${_reminderBadgeHtml(card)}
      <button class="kd-todo-del" data-kid="${card.id}" title="Delete">✕</button>
    </div>`).join("");

      container.querySelectorAll(".kd-todo-text").forEach(span => {
        span.addEventListener("click", () => {
          const id = Number(span.closest(".kd-todo-item").dataset.kid);
          openKanbanCardModal("todo", id);
        });
      });

      container.querySelectorAll(".kd-todo-check").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.kid);
          const kb2 = getKanban();
          const idx = (kb2.todo || []).findIndex(c => c.id === id);
          if (idx < 0) return;
          const [card] = kb2.todo.splice(idx, 1);
          if (!kb2.done) kb2.done = [];
          kb2.done.unshift(card);
          save();
          renderKanbanDash();
          if (el("nestodoModal")?.classList.contains("open")) renderKanban();
        });
      });

      container.querySelectorAll(".kd-todo-del").forEach(btn => {
        btn.addEventListener("click", () => {
          deleteKanbanCard("todo", Number(btn.dataset.kid));
        });
      });
    }
  }
  renderRemindersWidget();
}

// ===== REMINDERS =====
// Reminders are their own first-class list (S.reminders), independent of
// the Nestodo board — but a Nestodo card can ALSO carry a remindAt (set via
// the Add/Edit Card modal), which shows up here too. The widget merges both
// sources into one upcoming view; each kind edits through its own modal.
function getReminders() {
  return S.reminders;
}

function renderRemindersWidget() {
  const container = el("remindersList");
  if (!container) return;
  const kb = getKanban();
  const cardReminders = [...(kb.todo || []), ...(kb.doing || [])]
    .filter((c) => c.remindAt)
    .map((c) => ({ kind: "card", id: c.id, col: (kb.todo || []).some((x) => x.id === c.id) ? "todo" : "doing", title: c.title, remindAt: c.remindAt }));
  const standalone = getReminders().map((r) => ({ kind: "standalone", id: r.id, title: r.title, remindAt: r.remindAt }));
  const upcoming = _sortByReminder([...cardReminders, ...standalone]).slice(0, 8);

  if (!upcoming.length) {
    container.innerHTML = `<div class="widget-empty-state">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span>No reminders set</span></div>`;
    return;
  }

  container.innerHTML = upcoming
    .map((item) => {
      const { text, overdue } = _formatReminderBadge(item.remindAt);
      return `
    <div class="reminder-item${overdue ? " overdue" : ""}" data-rid="${item.id}" data-kind="${item.kind}" data-col="${item.col || ""}">
      <div class="reminder-check" data-rid="${item.id}" data-kind="${item.kind}" data-col="${item.col || ""}" title="Mark done"></div>
      <div class="reminder-item-body">
        <span class="reminder-item-text">${escH(item.title)}</span>
        <span class="reminder-item-time">🔔 ${escH(text)}</span>
      </div>
      <button class="reminder-clear-btn" data-rid="${item.id}" data-kind="${item.kind}" data-col="${item.col || ""}" title="${item.kind === "card" ? "Clear reminder" : "Delete reminder"}">✕</button>
    </div>`;
    })
    .join("");

  container.querySelectorAll(".reminder-item-body").forEach((body) => {
    body.addEventListener("click", () => {
      const item = body.closest(".reminder-item");
      if (item.dataset.kind === "card") openKanbanCardModal(item.dataset.col, Number(item.dataset.rid));
      else openReminderModal(Number(item.dataset.rid));
    });
  });

  container.querySelectorAll(".reminder-check").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.rid);
      if (btn.dataset.kind === "card") {
        const col = btn.dataset.col;
        const kb2 = getKanban();
        const idx = (kb2[col] || []).findIndex((c) => c.id === id);
        if (idx < 0) return;
        const [card] = kb2[col].splice(idx, 1);
        if (!kb2.done) kb2.done = [];
        kb2.done.unshift(card);
        save();
        renderKanbanDash();
        if (el("nestodoModal")?.classList.contains("open")) renderKanban();
      } else {
        deleteReminder(id); // "done" for a standalone reminder = dismiss it
      }
    });
  });

  container.querySelectorAll(".reminder-clear-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.rid);
      if (btn.dataset.kind === "card") {
        const col = btn.dataset.col;
        const kb2 = getKanban();
        const card = (kb2[col] || []).find((c) => c.id === id);
        if (card) {
          card.remindAt = null;
          card.notified = false;
        }
        save();
        renderKanbanDash();
        if (el("nestodoModal")?.classList.contains("open")) renderKanban();
      } else {
        deleteReminder(id);
      }
    });
  });
}

let _reminderEditingId = null;

function openReminderModal(id = null) {
  _reminderEditingId = id;
  const reminder = id != null ? getReminders().find((r) => r.id === id) : null;
  el("reminderModalTitle").textContent = reminder ? "Edit Reminder" : "Add Reminder";
  el("reminderTitleInput").value = reminder?.title || "";
  el("reminderTimeInput").value = reminder ? _toDatetimeLocal(reminder.remindAt) : "";
  const deleteBtn = el("reminderDeleteBtn");
  if (deleteBtn) deleteBtn.style.display = reminder ? "" : "none";
  el("reminderSaveBtn").textContent = reminder ? "Save Reminder" : "Add Reminder";
  openModal("reminderModal");
  setTimeout(() => el("reminderTitleInput")?.focus(), 80);
}

function saveReminder() {
  const title = el("reminderTitleInput").value.trim();
  if (!title) {
    showToast("Enter a reminder title", "error");
    return;
  }
  const timeVal = el("reminderTimeInput").value;
  if (!timeVal) {
    showToast("Pick a date and time for the reminder", "error");
    return;
  }
  const remindAt = new Date(timeVal).getTime();
  _ensurePermission(["notifications"]); // fire-and-forget, harmless if denied

  const list = getReminders();
  if (_reminderEditingId != null) {
    const r = list.find((r) => r.id === _reminderEditingId);
    if (r) {
      r.title = title;
      if (r.remindAt !== remindAt) r.notified = false;
      r.remindAt = remindAt;
    }
  } else {
    list.push({ id: Date.now(), title, remindAt, notified: false, createdAt: Date.now() });
  }
  _reminderEditingId = null;
  save();
  closeModal("reminderModal");
  renderRemindersWidget();
}

function deleteReminder(id) {
  const list = getReminders();
  const r = list.find((r) => r.id === id);
  if (r) {
    S.trash.push({ id: r.id, text: r.title, remindAt: r.remindAt, _type: "reminder", _deletedAt: Date.now() });
  }
  S.reminders = list.filter((r) => r.id !== id);
  save();
  renderRemindersWidget();
  renderTrash();
}

// ===== MIGRATION: add Socials items to existing users' Quick Access =====
function migrateAddSocials() {
  const data = wsData();
  if (!data?.quickAccess) return;
  const existing = new Set(data.quickAccess.map(q => q.url));
  const toAdd = [
    { id: 138, name: "Twitter / X", url: "https://x.com" },
    { id: 139, name: "LinkedIn", url: "https://linkedin.com/feed" },
    { id: 140, name: "Instagram", url: "https://instagram.com" },
    { id: 141, name: "Reddit", url: "https://reddit.com" },
    { id: 142, name: "Discord", url: "https://discord.com/app" },
    { id: 143, name: "YouTube", url: "https://youtube.com" },
  ].filter(item => !existing.has(item.url) && !S._qaDeleted.has(_normUrl(item.url)));
  if (!toAdd.length) return;
  // Insert before first Google item if present, otherwise append
  const googleIdx = data.quickAccess.findIndex(q =>
    q.url && (q.url.includes("mail.google.com") || q.url.includes("drive.google.com"))
  );
  if (googleIdx >= 0) {
    data.quickAccess.splice(googleIdx, 0, ...toAdd);
  } else {
    data.quickAccess.push(...toAdd);
  }
  save();
}

// One-time: existing users upgrading from the old Kanban Board never had a
// sidebar entry for it (it was only reachable via the To-Do widget's edit
// icon). Fresh installs get it from DEFAULT_SIDEBAR instead. Safe to call
// every boot — no-ops once the item exists.
function migrateAddNestodoSidebarItem() {
  const groups = S.settings.sidebar;
  if (!Array.isArray(groups)) return;
  const alreadyThere = groups.some((g) =>
    (g.items || []).some((it) => it.view === "kanban" || it.id === "nestodo"),
  );
  if (alreadyThere) return;
  const personal = groups.find((g) => g.id === "personal") || groups[0];
  if (!personal) return;
  personal.items = personal.items || [];
  const notesIdx = personal.items.findIndex((it) => it.view === "notes");
  const item = { id: "nestodo", label: "Nestodo", icon: "nestodo", kind: "view", view: "kanban" };
  if (notesIdx >= 0) personal.items.splice(notesIdx + 1, 0, item);
  else personal.items.push(item);
  save();
}

// One-time: strip any "Workspaces" sidebar group left over from before
// workspaces were removed as a feature — installs that went through a boot
// with the old migrateAddWorkspacesSidebarGroup() have this saved in
// S.settings.sidebar and would otherwise show a permanently-empty group.
function migrateRemoveWorkspacesSidebarGroup() {
  const groups = S.settings.sidebar;
  if (!Array.isArray(groups)) return;
  if (!groups.some((g) => g.id === "workspaces")) return;
  S.settings.sidebar = groups.filter((g) => g.id !== "workspaces");
  save();
}

// One-time: build S.settings.sidebar from whatever the user already has, so
// existing customizations (Google/Socials links, AI tool links) survive the
// move to the new data-driven sidebar. Safe to call every boot — it's a
// no-op once S.settings.sidebar exists.
function migrateSidebarToDataModel() {
  if (S.settings.sidebar) return;

  const toLinkItems = (links) =>
    (links || []).map((l) => ({
      id: `link-${l.id}`,
      label: l.name,
      url: l.url,
      icon: "link",
      kind: "link",
    }));

  // Fresh install → ship DEFAULT_SIDEBAR as-is (Google/Socials/AI empty, per
  // its own doc comment). This deliberately keys off S._freshInstall, which
  // loadState() derives from what was actually in storage before defaults
  // were merged. The obvious-looking alternative — testing whether
  // settings.sbLinks.google/socials is empty — is always false: both are
  // seeded from hardcoded defaults in S, so that test never identified a
  // fresh install and this branch was dead code.
  if (S._freshInstall) {
    S.settings.sidebar = JSON.parse(JSON.stringify(DEFAULT_SIDEBAR));
    return;
  }

  S.settings.sidebar = JSON.parse(JSON.stringify(DEFAULT_SIDEBAR));
  const byId = Object.fromEntries(S.settings.sidebar.map((g) => [g.id, g]));
  if (byId.google) byId.google.items = toLinkItems(S.settings.sbLinks?.google);
  if (byId.socials) byId.socials.items = toLinkItems(S.settings.sbLinks?.socials);
}

// Normalize a URL for de-dupe comparisons (ignore protocol/trailing slash/case)
function _normUrl(u) {
  return (u || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

// Ensure a saved sidebar link group has at least `min` items, topping up with
// any newly-added default links the user doesn't already have (by URL).
// Preserves the user's saved order and any links they've added themselves.
function _topUpSbGroup(saved, defaults, min = 10) {
  const arr = saved && saved.length ? [...saved] : [...(defaults || [])];
  if (arr.length >= min) return arr;
  const existing = new Set(arr.map((l) => _normUrl(l.url)));
  for (const item of defaults || []) {
    if (arr.length >= min) break;
    const key = _normUrl(item.url);
    if (S._qaDeleted.has(key) || existing.has(key)) continue;
    arr.push(item);
    existing.add(key);
  }
  return arr;
}

// Add a sidebar link to Quick Access, skipping it if a link to the same URL
// already exists there.
function _mirrorLinkToQuickAccess(link) {
  const key = _normUrl(link.url);
  if (S._qaDeleted.has(key)) return false; // user deleted it — don't re-add
  if (S.quickAccess.some((q) => _normUrl(q.url) === key)) return false;
  S.quickAccess.push({
    id: Date.now() + Math.floor(Math.random() * 100000),
    name: link.name,
    url: link.url,
  });
  return true;
}

// ===== MIGRATION: mirror all global sidebar links into Quick Access =====
function migrateSyncSbLinksToQA() {
  let added = false;
  ["google", "projects", "others", "socials"].forEach((group) => {
    (S.settings.sbLinks?.[group] || []).forEach((link) => {
      if (_mirrorLinkToQuickAccess(link)) added = true;
    });
  });
  if (added) save();
}

// ===== TASKS =====
// The old flat per-workspace task list has been folded into the Nestodo
// board (S.kanban) — this is now just a thin adapter so existing callers
// (voice capture, AI "Add as Task") land their text on the Nestodo To Do
// column instead of a separate, no-longer-rendered list.
function addTask(text) {
  const title = text.trim();
  if (!title) return;
  const kb = getKanban();
  if (!kb.todo) kb.todo = [];
  kb.todo.unshift({
    id: Date.now(),
    title,
    desc: "",
    createdAt: Date.now(),
    remindAt: null,
    notified: false,
  });
  save();
  renderKanbanDash();
  if (el("nestodoModal")?.classList.contains("open")) renderKanban();
  showToast("Added to Nestodo!", "success");
}

function loadHeroQuote() {
  // If user saved a custom quote, always show it
  const custom = S.settings.heroQuote;
  if (custom) {
    _setHeroQuote(custom.quote, custom.author);
    return;
  }
  const fb = HERO_QUOTES[Math.floor(Math.random() * HERO_QUOTES.length)];
  _setHeroQuote(fb.quote, fb.author);
}

function _setHeroQuote(quote, author) {
  const txt = el("heroQuoteText"),
    auth = el("heroQuoteAuthor");
  if (txt) txt.textContent = quote;
  if (auth) auth.textContent = "— " + (author || "");
}

function shuffleHeroQuote() {
  // Clear custom so next load picks random
  S.settings.heroQuote = null;
  save();
  const fb = HERO_QUOTES[Math.floor(Math.random() * HERO_QUOTES.length)];
  _setHeroQuote(fb.quote, fb.author);
}

function enterHeroQuoteEdit() {
  const col = el("heroQuoteCol");
  const txt = el("heroQuoteText");
  const auth = el("heroQuoteAuthor");
  const saveBtn = el("saveQuoteBtn");
  const editBtn = el("editQuoteBtn");
  if (!col) return;
  col.classList.add("editing");
  txt.contentEditable = "true";
  auth.contentEditable = "true";
  // Strip leading "— " so user edits just the name
  if (auth.textContent.startsWith("— "))
    auth.textContent = auth.textContent.slice(2);
  saveBtn.style.display = "flex";
  editBtn.style.display = "none";
  txt.focus();
  // Place cursor at end
  const range = document.createRange();
  range.selectNodeContents(txt);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function saveHeroQuoteEdit() {
  const col = el("heroQuoteCol");
  const txt = el("heroQuoteText");
  const auth = el("heroQuoteAuthor");
  const saveBtn = el("saveQuoteBtn");
  const editBtn = el("editQuoteBtn");
  const quote = txt.textContent.trim().slice(0, 240);
  const author = auth.textContent.replace(/^—\s*/, "").trim().slice(0, 60);
  col.classList.remove("editing");
  txt.contentEditable = "false";
  auth.contentEditable = "false";
  saveBtn.style.display = "none";
  editBtn.style.display = "flex";
  if (quote) {
    S.settings.heroQuote = { quote, author };
    save();
    auth.textContent = "— " + author;
    showToast("Quote saved", "success");
  } else {
    // Empty → revert to random
    S.settings.heroQuote = null;
    save();
    loadHeroQuote();
  }
}

// ===== AI DAILY BRIEFING =====
function _syncAiUI() {
  const section = el("aiBriefingSection");
  if (!section) return;
  if (!aiEnabled()) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  const cache = S.settings.aiBriefingCache;
  const todayKey = new Date().toDateString();
  if (cache && cache.date === todayKey) {
    _renderAiBriefingText(cache.text);
  } else {
    loadAiBriefing();
  }
}

async function loadAiBriefing() {
  const body = el("aiBriefingBody");
  if (!body || !aiEnabled()) return;
  const apiKey = await _aiLoadApiKey();
  if (!apiKey) {
    _renderAiBriefingSetup();
    return;
  }
  body.innerHTML = `
    <div class="skeleton skeleton-text" style="width:95%"></div>
    <div class="skeleton skeleton-text" style="width:88%"></div>
    <div class="skeleton skeleton-text" style="width:60%"></div>
  `;
  const kb = getKanban();
  const tasks = [...(kb.todo || []), ...(kb.doing || [])];
  const taskList =
    tasks
      .slice(0, 5)
      .map((t) => `- ${t.title}`)
      .join("\n") || "(none)";
  const weatherCity = el("weatherCity")?.textContent || "";
  const weatherTemp = el("weatherTemp")?.textContent || "";
  const weatherDesc = el("weatherDesc")?.textContent || "";
  const weatherLine =
    weatherCity && !["Detecting…", "Unavailable"].includes(weatherCity)
      ? `${weatherTemp}, ${weatherDesc} in ${weatherCity}`
      : "unavailable";
  const prompt = `Write a short, warm daily briefing (2-3 sentences max) for ${S.user?.name || "the user"}.
Weather: ${weatherLine}
Open tasks for today:
${taskList}
Mention the weather naturally if available, nudge toward the most important pending task (if any), and end on a brief upbeat note. Plain text only, no markdown, no greeting like "Good morning".`;
  try {
    const text = await aiComplete(prompt, {
      system:
        "You are a concise, friendly assistant that writes short daily briefings for a personal dashboard. Keep it under 60 words, plain text, no markdown.",
      maxTokens: 200,
    });
    S.settings.aiBriefingCache = { date: new Date().toDateString(), text };
    save();
    _renderAiBriefingText(text);
  } catch (err) {
    _renderAiBriefingError(err);
  }
}

function _renderAiBriefingText(text) {
  const body = el("aiBriefingBody");
  if (!body) return;
  body.innerHTML = `<div class="ai-briefing-text"></div>`;
  body.querySelector(".ai-briefing-text").textContent = text;
}

function _renderAiBriefingSetup() {
  const body = el("aiBriefingBody");
  if (!body) return;
  body.innerHTML = `<div class="ai-briefing-setup">
    <span>Add your Anthropic API key to enable AI-generated briefings. Once enabled, your task titles and local weather are sent to Anthropic automatically once per day to write this.</span>
    <button class="edit-btn" id="aiBriefingSetupBtn">Open Settings</button>
  </div>`;
  el("aiBriefingSetupBtn")?.addEventListener("click", openSettings);
}

function _renderAiBriefingError(err) {
  const body = el("aiBriefingBody");
  if (!body) return;
  if (err?.code === "AI_NOT_CONFIGURED") {
    _renderAiBriefingSetup();
    return;
  }
  body.innerHTML = `<div class="ai-briefing-setup"><span>Couldn't generate a briefing right now (${escH(err?.message || "error")}).</span></div>`;
}

function refreshAiBriefing() {
  S.settings.aiBriefingCache = null;
  save();
  loadAiBriefing();
}

// ===== SMART AUTO-ORGANIZE =====
let _organizeResults = []; // [{title, url, folder}]

function _organizeSetupHtml(msg) {
  return `<div class="organize-setup">
    <span>${escH(msg)}</span>
    <button class="settings-action-btn" id="organizeOpenSettingsBtn">Open Settings</button>
  </div>`;
}

async function openSmartOrganizeModal() {
  openModal("smartOrganizeModal");
  el("applyOrganizeBtn").style.display = "none";
  const body = el("organizeModalBody");
  _organizeResults = [];

  if (!IS_CHROME || !chrome.tabs) {
    body.innerHTML = `<div class="organize-empty">Requires Chrome extension.</div>`;
    return;
  }
  if (!aiEnabled()) {
    body.innerHTML = _organizeSetupHtml(
      "Add your Anthropic API key in Settings to enable Smart Organize.",
    );
    el("organizeOpenSettingsBtn").addEventListener("click", () => {
      closeModal("smartOrganizeModal");
      openSettings();
    });
    return;
  }
  body.innerHTML = `<div class="cmd-ai-loading"><div class="cmd-ai-spinner"></div>Scanning open tabs…</div>`;
  const tabs = await new Promise((res) => chrome.tabs.query({}, res));
  const ownPrefix = chrome.runtime.getURL("");
  const existingUrls = new Set(wsBookmarks().map((b) => _normUrl(b.url)));
  const candidates = [];
  const seen = new Set();
  (tabs || []).forEach((t) => {
    if (!t.url) return;
    if (t.url.startsWith("chrome://") || t.url.startsWith(ownPrefix)) return;
    const key = _normUrl(t.url);
    if (existingUrls.has(key) || seen.has(key)) return;
    seen.add(key);
    candidates.push(t);
  });

  if (!candidates.length) {
    body.innerHTML = `<div class="organize-empty">No new tabs to organize — everything open is already saved.</div>`;
    return;
  }

  // Drop tabs on domains that commonly host sensitive content (banking,
  // health, adult) before anything is sent to a third-party AI API.
  const excludedCount = candidates.filter((t) => _isSensitiveDomain(getDomain(t.url))).length;
  const safeCandidates = candidates.filter((t) => !_isSensitiveDomain(getDomain(t.url)));

  if (!safeCandidates.length) {
    body.innerHTML = `<div class="organize-empty">All open tabs look like sensitive sites (banking/health/etc.) and were excluded — nothing left to send.</div>`;
    return;
  }

  const excludedNote = excludedCount
    ? `<p class="organize-consent-note">${excludedCount} tab${excludedCount === 1 ? "" : "s"} on likely-sensitive domains (banking/health/etc.) were excluded automatically.</p>`
    : "";
  body.innerHTML = `
    <div class="organize-consent">
      <p>This sends the <strong>titles and URLs</strong> of ${safeCandidates.length} open tab${safeCandidates.length === 1 ? "" : "s"} to Anthropic's API to decide which folder each belongs in.</p>
      ${excludedNote}
      <div class="organize-consent-actions">
        <button class="btn-secondary" id="organizeCancelBtn">Cancel</button>
        <button class="btn-primary" id="organizeConfirmBtn">Send to AI</button>
      </div>
    </div>`;
  el("organizeCancelBtn").addEventListener("click", () => closeModal("smartOrganizeModal"));
  el("organizeConfirmBtn").addEventListener("click", () => _organizeRunAI(safeCandidates, body));
}

// A conservative keyword check on the hostname — not exhaustive, but catches
// the obvious banking/health/adult cases the audit flagged as highest-risk
// to silently ship to a third party.
const SENSITIVE_DOMAIN_HINTS = [
  "bank", "chase", "wellsfargo", "citi", "paypal", "venmo", "creditkarma",
  "irs.gov", "coinbase", "fidelity", "vanguard", "schwab", "healthcare",
  "myhealth", "patient", "medicare", "medicaid", "pharmacy", "webmd",
  "mychart", "planned parenthood", "plannedparenthood",
  "porn", "xxx", "xvideos", "pornhub", "onlyfans",
];
function _isSensitiveDomain(domain) {
  const d = (domain || "").toLowerCase();
  return SENSITIVE_DOMAIN_HINTS.some((hint) => d.includes(hint));
}

async function _organizeRunAI(candidates, body) {
  body.innerHTML = `<div class="cmd-ai-loading"><div class="cmd-ai-spinner"></div>Asking AI to sort ${candidates.length} tab${candidates.length === 1 ? "" : "s"}…</div>`;
  const folderNames = allWsFolderNames();
  const list = candidates
    .map((t, i) => `${i}. [${getDomain(t.url)}] ${(t.title || t.url).slice(0, 80)}`)
    .join("\n");
  const prompt = `You are sorting browser tabs into bookmark folders.
${folderNames.length ? `Existing folders: ${folderNames.join(", ")}\n\n` : ""}Tabs:
${list}

For each numbered tab, pick the best-matching folder — reuse one of the existing folders above when it fits, or invent a short new folder name (1-3 words) when nothing fits. Respond with ONLY a JSON array (no markdown, no commentary), one object per tab in the same order: {"folder": "<folder name>"}`;

  try {
    const raw = await aiComplete(prompt, {
      system:
        "You are a precise JSON-only classification engine. Always respond with valid JSON and nothing else.",
      maxTokens: 1500,
    });
    const parsed = _organizeParseJson(raw);
    _organizeResults = candidates.map((t, i) => ({
      title: t.title || t.url,
      url: t.url,
      folder: (parsed?.[i]?.folder || "Smart Organize").toString().slice(0, 40),
    }));
    _renderOrganizeResults();
  } catch (err) {
    if (err?.code === "AI_NOT_CONFIGURED") {
      body.innerHTML = _organizeSetupHtml(
        "Add your Anthropic API key in Settings to enable Smart Organize.",
      );
      el("organizeOpenSettingsBtn").addEventListener("click", () => {
        closeModal("smartOrganizeModal");
        openSettings();
      });
    } else {
      body.innerHTML = `<div class="organize-empty">Couldn't sort tabs right now (${escH(err?.message || "error")}).</div>`;
    }
  }
}

function _organizeParseJson(raw) {
  const match = raw.match(/\[[\s\S]*\]/);
  return JSON.parse(match ? match[0] : raw);
}

function _renderOrganizeResults() {
  const body = el("organizeModalBody");
  const groups = {};
  _organizeResults.forEach((r, i) => {
    (groups[r.folder] = groups[r.folder] || []).push(i);
  });
  body.innerHTML = Object.entries(groups)
    .map(
      ([folderName, idxs]) => `
    <div class="organize-group">
      <div class="organize-group-title">${escH(folderName)} <span class="cmd-domain-tag">${idxs.length}</span></div>
      ${idxs
        .map((i) => {
          const r = _organizeResults[i];
          return `<label class="organize-item">
            <input type="checkbox" checked data-organize-idx="${i}">
            <img src="${favSrc(r.url)}" data-img-fallback="fade" alt="">
            <span class="organize-item-title">${escH(r.title)}</span>
            <span class="organize-item-domain">${escH(getDomain(r.url))}</span>
          </label>`;
        })
        .join("")}
    </div>`,
    )
    .join("");
  el("applyOrganizeBtn").style.display = "";
}

function applySmartOrganize() {
  const checked = el("organizeModalBody").querySelectorAll(
    "input[data-organize-idx]:checked",
  );
  let count = 0;
  const usedFolders = new Set();
  checked.forEach((cb) => {
    const r = _organizeResults[Number(cb.dataset.organizeIdx)];
    if (!r) return;
    wsBookmarks().push({
      id: "ai_" + Date.now() + "_" + count,
      title: r.title,
      url: r.url,
      folderName: r.folder,
    });
    usedFolders.add(r.folder);
    count++;
  });
  S.importedBookmarks = _dedupeByUrl(S.importedBookmarks);
  usedFolders.forEach((name) => {
    if (!S.folders.find((f) => f.name === name)) S.folders.push({ name });
  });
  save();
  renderWorkspaceBookmarks();
  renderSidebarFolders();
  closeModal("smartOrganizeModal");
  showToast(`Organized ${count} tab${count === 1 ? "" : "s"}`, "success");
}

// ===== VOICE QUICK-CAPTURE =====
let _voiceRecognition = null;
let _voiceListening = false;
let _voiceFinalText = "";

function _voiceSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function openVoiceCaptureModal() {
  _voiceFinalText = "";
  el("voiceTranscript").value = "";
  const micBtn = el("voiceMicBtn");
  if (!_voiceSupported()) {
    el("voiceStatus").textContent =
      "Voice capture isn't supported in this browser.";
    micBtn.disabled = true;
  } else {
    el("voiceStatus").textContent = "Tap the mic to start speaking";
    micBtn.disabled = false;
    micBtn.classList.remove("listening");
  }
  openModal("voiceCaptureModal");
}

function toggleVoiceRecording() {
  if (!_voiceSupported()) return;
  if (_voiceListening) {
    _voiceStopRecognition();
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  _voiceRecognition = new SR();
  _voiceRecognition.continuous = true;
  _voiceRecognition.interimResults = true;
  _voiceRecognition.lang = navigator.language || "en-US";

  _voiceRecognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        _voiceFinalText += (_voiceFinalText ? " " : "") + transcript.trim();
      } else {
        interim += transcript;
      }
    }
    el("voiceTranscript").value = [_voiceFinalText, interim]
      .filter(Boolean)
      .join(" ");
  };
  _voiceRecognition.onerror = (event) => {
    el("voiceStatus").textContent = `Mic error: ${event.error}`;
    _voiceStopRecognition();
  };
  _voiceRecognition.onend = () => {
    _voiceListening = false;
    el("voiceMicBtn").classList.remove("listening");
    el("voiceStatus").textContent = _voiceFinalText
      ? "Stopped. Edit the text below, then save it."
      : "Tap the mic to start speaking";
  };

  try {
    _voiceRecognition.start();
    _voiceListening = true;
    el("voiceMicBtn").classList.add("listening");
    el("voiceStatus").textContent = "Listening… tap the mic to stop.";
  } catch {
    el("voiceStatus").textContent = "Couldn't start the microphone.";
  }
}

function _voiceStopRecognition() {
  if (_voiceRecognition && _voiceListening) {
    _voiceRecognition.stop();
  }
  _voiceListening = false;
  el("voiceMicBtn")?.classList.remove("listening");
}

function _voiceGetText() {
  return el("voiceTranscript").value.trim();
}

function saveVoiceAsNote() {
  const text = _voiceGetText();
  if (!text) {
    showToast("Say or type something first", "error");
    return;
  }
  _voiceStopRecognition();
  const now = Date.now();
  wsData().notes.unshift({
    id: now,
    title: text.slice(0, 60),
    content: text,
    date: now,
    updatedAt: now,
    tags: ["voice"],
    pinned: false,
  });
  save();
  renderNotesWidget();
  renderNotesView();
  closeModal("voiceCaptureModal");
  showToast("Saved as note", "success");
}

function saveVoiceAsTask() {
  const text = _voiceGetText();
  if (!text) {
    showToast("Say or type something first", "error");
    return;
  }
  _voiceStopRecognition();
  addTask(text.slice(0, 200));
  closeModal("voiceCaptureModal");
}

function saveVoiceAsJournal() {
  const text = _voiceGetText();
  if (!text) {
    showToast("Say or type something first", "error");
    return;
  }
  _voiceStopRecognition();
  const key = _todayKey();
  const entry = S.journal[key] || {};
  entry.text = entry.text ? `${entry.text}\n\n${text}` : text;
  entry.updatedAt = Date.now();
  S.journal[key] = entry;
  save();
  closeModal("voiceCaptureModal");
  showToast("Added to today's journal", "success");
}

// ===== FOCUS TIMER =====
const T = { total: 1500, remaining: 1500, running: false, iv: null, _mode: "focus" };
const CIRC = 2 * Math.PI * 44;

function renderTimerDisplay() {
  const prog = el("timerProgress");
  const ratio = T.remaining / T.total;
  prog.style.strokeDashoffset = CIRC * (1 - ratio);
  prog.style.stroke =
    ratio > 0.5 ? "#7c3aed" : ratio > 0.2 ? "#f97316" : "#ef4444";
  const m = Math.floor(T.remaining / 60),
    s = T.remaining % 60;
  el("timerDisplay").textContent =
    `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function timerPlay() {
  if (T.running) {
    pauseTimer();
    return;
  }
  T.running = true;
  el("timerPlayBtn").innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  applyFocusBlockRules(true);
  // Fire-and-forget: ask for notifications now (valid gesture context) so
  // the session-complete alert can fire; harmless if denied.
  _ensurePermission(["notifications"]);
  T.iv = setInterval(() => {
    if (T.remaining <= 0) {
      clearInterval(T.iv);
      T.running = false;
      el("timerPlayBtn").innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
      applyFocusBlockRules(false);
      _timerAudioDing();
      showToast("⏰ Focus session complete! Great job!", "success");
      _notifyUser("Nestpane Focus Complete", { body: `${Math.round(T.total / 60)}m session done! Take a break.`, icon: "icons/favicon.png" });
      if (T._mode === "focus") {
        const today = _todayKey();
        S._focusSessions = S._focusSessions || {};
        S._focusSessions[today] = (S._focusSessions[today] || 0) + 1;
        S._focusMinutes = S._focusMinutes || {};
        S._focusMinutes[today] = (S._focusMinutes[today] || 0) + Math.round(T.total / 60);
        save();
        renderTimerStats();
      }
      return;
    }
    T.remaining--;
    renderTimerDisplay();
    // Persist timer state for popup dashboard (every 5s to avoid excessive writes)
    if (T.remaining % 5 === 0) {
      API.setLocal({ _timerState: { running: true, remaining: T.remaining, total: T.total } });
    }
  }, 1000);
}
function pauseTimer() {
  clearInterval(T.iv);
  T.running = false;
  API.setLocal({ _timerState: { running: false, remaining: T.remaining, total: T.total } });
  el("timerPlayBtn").innerHTML =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
  applyFocusBlockRules(false);
}
function resetTimer(mins, mode) {
  clearInterval(T.iv);
  T.running = false;
  T._mode = mode || "focus";
  T.total = (mins || 25) * 60;
  T.remaining = T.total;
  el("timerPlayBtn").innerHTML =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
  document.querySelectorAll(".preset-btn").forEach((b) => {
    b.classList.remove("active");
    if (b.dataset.type === T._mode && parseInt(b.dataset.min) === (mins || 25)) b.classList.add("active");
  });
  const badge = el("timerModeBadge");
  if (badge) {
    if (T._mode === "short") { badge.textContent = "☕ Short Break"; badge.style.display = ""; }
    else if (T._mode === "long") { badge.textContent = "🌿 Long Break"; badge.style.display = ""; }
    else { badge.style.display = "none"; }
  }
  renderTimerDisplay();
  applyFocusBlockRules(false);
}

// ── Chrome notification helper ───────────────────────────────────────────
function _notifyUser(title, opts = {}) {
  if (!IS_CHROME || !chrome.notifications) return;
  chrome.notifications.create("nestpane-" + Date.now(), {
    type: "basic",
    iconUrl: opts.icon || "icons/favicon.png",
    title,
    message: opts.body || "",
  });
}

// ── Habit reminder notification (fires once per day at 9am if habits exist)
function _scheduleHabitNotifications() {
  if (!IS_CHROME || !chrome.notifications) return;
  const habits = S.habits || [];
  if (!habits.length) return;
  const now = new Date();
  const nineAM = new Date(now);
  nineAM.setHours(9, 0, 0, 0);
  if (now >= nineAM) nineAM.setDate(nineAM.getDate() + 1);
  const delay = nineAM - now;
  setTimeout(() => {
    const today = _todayKey();
    const unchecked = habits.filter((h) => !h.days?.[today]);
    if (unchecked.length) {
      _notifyUser("Nestpane Habits", { body: `You have ${unchecked.length} habit${unchecked.length > 1 ? "s" : ""} to track today.`, icon: "icons/favicon.png" });
    }
  }, delay);
}

// ── Nestodo reminder check: fires once per due card while the page is open
// (no background alarm — matches the habit-notification pattern above, no
// extra "alarms" permission required). Runs on boot and every 60s.
function _checkDueReminders() {
  const now = Date.now();
  let changed = false;
  const kb = S.kanban || {};
  ["todo", "doing"].forEach((col) => {
    (kb[col] || []).forEach((card) => {
      if (card.remindAt && !card.notified && card.remindAt <= now) {
        card.notified = true;
        changed = true;
        _notifyUser(`⏰ ${card.title}`, {
          body: "Nestodo reminder",
          icon: "icons/favicon.png",
        });
      }
    });
  });
  (S.reminders || []).forEach((r) => {
    if (r.remindAt && !r.notified && r.remindAt <= now) {
      r.notified = true;
      changed = true;
      _notifyUser(`⏰ ${r.title}`, {
        body: "Reminder",
        icon: "icons/favicon.png",
      });
    }
  });
  if (changed) {
    save();
    renderKanbanDash(); // also refreshes the reminders widget internally
    if (el("nestodoModal")?.classList.contains("open")) renderKanban();
  }
}

// ── Web Audio ding on timer completion ──────────────────────────────────
function _timerAudioDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch { /* no audio context available */ }
}

// ── Timer stats: session count & focus minutes today ────────────────────
function renderTimerStats() {
  const today = _todayKey();
  const sessions = (S._focusSessions || {})[today] || 0;
  const minutes = (S._focusMinutes || {})[today] || 0;
  const sc = el("timerSessionCount");
  const ft = el("timerFocusTotal");
  if (sc) sc.textContent = sessions === 1 ? "1 session" : `${sessions} sessions`;
  if (ft) ft.textContent = minutes > 0 ? `${minutes}m today` : "0m today";
  const stats = el("timerStats");
  if (stats) stats.style.display = "";
}

// ===== FOCUS MODE — SITE BLOCKING =====
const FOCUS_RULE_BASE_ID = 9000;

// Chrome enforces a hard ceiling on dynamic rules; fall back to a
// conservative number on older Chrome versions where the constant isn't
// exposed yet.
const FOCUS_RULE_CEILING =
  chrome?.declarativeNetRequest?.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES || 5000;

// A plain hostname: labels of letters/digits/hyphens separated by dots,
// final label alphabetic (TLD). Rejects anything that could smuggle DNR
// wildcard/anchor characters (*, ^, |) or otherwise malformed input into a
// urlFilter — a single bad rule makes Chrome reject the WHOLE rule batch.
const FOCUS_DOMAIN_RE = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

// Toggle declarativeNetRequest rules that block S.settings.focus.blockedSites.
// `active` reflects whether a focus session is currently running; blocking
// only takes effect when the user has also enabled Focus Mode in settings.
// Returns true on success, false on failure — callers must not claim success
// without checking this, since a single bad rule fails the entire batch.
async function applyFocusBlockRules(active) {
  if (!IS_CHROME || !chrome.declarativeNetRequest) return true;
  let sites = (S.settings.focus?.blockedSites || []).filter((d) => FOCUS_DOMAIN_RE.test(d));
  if (sites.length > FOCUS_RULE_CEILING) sites = sites.slice(0, FOCUS_RULE_CEILING);
  // Remove every rule this feature previously added (not just as many as the
  // *current* list has) so shrinking the blocklist can't leave stale rules
  // behind from a longer previous list.
  const existingRaw = await chrome.declarativeNetRequest.getDynamicRules().catch(() => []);
  const existing = Array.isArray(existingRaw) ? existingRaw : [];
  const removeRuleIds = existing
    .map((r) => r.id)
    .filter((id) => id >= FOCUS_RULE_BASE_ID && id < FOCUS_RULE_BASE_ID + FOCUS_RULE_CEILING);
  const shouldBlock = active && S.settings.focus?.enabled && sites.length;
  const addRules = shouldBlock
    ? sites.map((domain, i) => ({
        id: FOCUS_RULE_BASE_ID + i,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: `||${domain}`,
          resourceTypes: ["main_frame"],
        },
      }))
    : [];
  try {
    // removeRuleIds may reference ids that don't currently exist — Chrome
    // ignores those safely, this just guarantees stale rules are cleared.
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
    return true;
  } catch (e) {
    console.warn("Focus mode: failed to update block rules", e);
    return false;
  }
}

function _syncFocusModeUI() {
  el("focusModeBtn")?.classList.toggle("active", !!S.settings.focus?.enabled);
}

function openFocusModeModal() {
  el("focusModeToggle").checked = !!S.settings.focus?.enabled;
  el("focusModeSites").value = (S.settings.focus?.blockedSites || []).join("\n");
  openModal("focusModeModal");
}

async function saveFocusModeSettings() {
  const lines = el("focusModeSites").value.split("\n");
  const sites = [];
  const seen = new Set();
  let invalidCount = 0;
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const domain = getDomain(safeUrl(trimmed) || trimmed) || trimmed;
    if (!FOCUS_DOMAIN_RE.test(domain)) {
      invalidCount++;
      return;
    }
    if (!seen.has(domain)) {
      seen.add(domain);
      sites.push(domain);
    }
  });
  S.settings.focus = {
    enabled: el("focusModeToggle").checked,
    blockedSites: sites,
  };
  save();
  _syncFocusModeUI();
  const applied = await applyFocusBlockRules(T.running);
  closeModal("focusModeModal");
  if (!applied) {
    showToast("Focus mode saved, but blocking rules failed to apply — try again", "error");
  } else if (invalidCount) {
    showToast(`Saved — ${invalidCount} entr${invalidCount === 1 ? "y" : "ies"} skipped (not a valid domain)`, "error");
  } else {
    showToast("Focus mode settings saved", "success");
  }
}

// ===== TRASH =====
function renderTrash() {
  const list = el("trashList");
  if (!S.trash.length) {
    list.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">🗑️</div><div class="empty-state-text">Trash is empty</div></div>';
    return;
  }
  const items = [...S.trash].reverse();
  list.innerHTML = items
    .map((item) => {
      // Sidebar groups carry their display name in `label`, not name/text/title.
      const name =
        item.name || item.text || item.title || item.label || "Item";
      const icon =
        item._type === "task"
          ? "✅"
          : item._type === "reminder"
            ? "🔔"
            : item._type === "quickAccess"
              ? "⚡"
              : item._type === "sidebarGroup"
                ? "🗂️"
                : "📝";
      const key = item.id || item._deletedAt;
      const typeClass =
        item._type === "task"
          ? "task-type"
          : item._type === "reminder"
            ? "reminder-type"
            : item._type === "quickAccess"
              ? "qa-type"
              : item._type === "sidebarGroup"
                ? "sbgroup-type"
                : "note-type";
      return `<div class="trash-item">
      <span>${icon}</span>
      <span class="trash-item-name">${escH(name)}</span>
      <span class="trash-item-type ${typeClass}">${item._type || "item"}</span>
      <button class="restore-btn" data-key="${key}">Restore</button>
    </div>`;
    })
    .join("");
  list.querySelectorAll(".restore-btn[data-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.key;
      const num = Number(raw);
      // Sidebar-group ids are non-numeric strings (e.g. "home", "g<timestamp>"),
      // so only coerce to a number when the key actually looks numeric.
      restoreItem(Number.isNaN(num) ? raw : num);
    });
  });
}

function restoreItem(key) {
  const idx = S.trash.findIndex((i) => (i.id || i._deletedAt) === key);
  if (idx === -1) return;
  const item = S.trash.splice(idx, 1)[0];
  if (item._type === "task") {
    S.kanban.todo.unshift({
      id: item.id || Date.now(),
      title: item.text,
      desc: "",
      createdAt: item.id || Date.now(),
      remindAt: null,
      notified: false,
    });
  } else if (item._type === "reminder") {
    S.reminders.unshift({
      id: item.id || Date.now(),
      title: item.text,
      remindAt: item.remindAt || Date.now(),
      notified: false,
      createdAt: item.id || Date.now(),
    });
  } else if (item._type === "note")
    S.notes.unshift({
      id: item.id || Date.now(),
      title: item.title,
      content: item.content,
      date: item.date || Date.now(),
    });
  else if (item._type === "quickAccess")
    S.quickAccess.unshift({
      id: item.id || Date.now(),
      name: item.name,
      url: item.url,
    });
  else if (item._type === "sidebarGroup")
    S.settings.sidebar.push({
      id: item.id || `g${Date.now()}`,
      label: item.label,
      icon: item.icon,
      items: item.items || [],
    });
  save();
  renderAll();
  showToast("Item restored!", "success");
}
function emptyTrash() {
  confirm2(
    "Empty Trash?",
    "All deleted items will be permanently removed.",
    () => {
      S.trash = [];
      save();
      renderTrash();
      showToast("Trash emptied", "success");
    },
  );
}

// ── Canvas bar chart helper ──────────────────────────────────────────────
function _drawBarChart(canvas, labels, values, unit, color) {
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 240;
  const H = canvas.height;
  canvas.width = W;
  const max = Math.max(...values, 1);
  const barW = Math.floor(W / (labels.length * 1.5));
  const gap = Math.floor((W - barW * labels.length) / (labels.length + 1));
  const textColor = getComputedStyle(document.documentElement).getPropertyValue("--text-3").trim() || "#888";
  ctx.clearRect(0, 0, W, H);
  labels.forEach((label, i) => {
    const val = values[i];
    const barH = Math.max(2, Math.floor((val / max) * (H - 28)));
    const x = gap + i * (barW + gap);
    const y = H - 18 - barH;
    ctx.fillStyle = color;
    ctx.globalAlpha = val > 0 ? 0.85 : 0.2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, barH, 3) : ctx.rect(x, y, barW, barH);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = textColor;
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x + barW / 2, H - 4);
    if (val > 0) ctx.fillText(val + (unit || ""), x + barW / 2, y - 3);
  });
}

// ===== ANALYTICS VIEW =====

async function renderAnalytics() {
  const container = el("analyticsContent");
  if (!container) return;

  if (!S.allBookmarks.length) await loadBookmarks();

  // ── Aggregate stats ──────────────────────────────────────────────────────
  let totalBookmarks = 0,
    totalFolders = 0;
  S.allBookmarks.forEach((f) => {
    totalFolders++;
    totalBookmarks += (f.items || []).length;
  });

  const totalNotes = S.notes.length;
  const kb = S.kanban || {};
  const totalTasksDone = (kb.done || []).length;
  const totalTasksPending = (kb.todo || []).length + (kb.doing || []).length;
  const totalQA = S.quickAccess.length;
  const totalTasks = totalTasksDone + totalTasksPending;
  const taskRate =
    totalTasks > 0 ? Math.round((totalTasksDone / totalTasks) * 100) : 0;
  const totalHabits = S.habits.length;
  const totalReadingItems = S.readingQueue.length;
  const totalCalEvents = S.calEvents.length;
  const doneReading = S.readingQueue.filter((r) => r.done).length;
  const today = _todayKey();
  const habitsCompletedToday = S.habits.filter((h) =>
    (h.completedDates || []).includes(today),
  ).length;

  const topFolders = [...S.allBookmarks]
    .sort((a, b) => (b.items || []).length - (a.items || []).length)
    .slice(0, 8);
  const maxFolderSize = (topFolders[0]?.items || []).length || 1;

  const tagCounts = {};
  S.notes.forEach((note) => {
    (note.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const pic = S.googleUser?.picture || S.user.googlePicture;
  const gName = S.user.googleName || S.googleUser?.email || "";
  const gEmail = S.googleUser?.email || "";
  const chromeVer = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || "";

  // Recent notes (last 5)
  const recentNotes = [...S.notes]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  // Pending tasks (Nestodo cards)
  const pendingDisplay = [...(kb.todo || []), ...(kb.doing || [])]
    .map((card) => ({ text: card.title }))
    .slice(0, 6);
  const now = Date.now();
  const dayMs = 86400000;
  container.className = "insights-board";
  container.innerHTML = `

    <!-- KPI Strip -->
    <div class="insights-kpi-strip">
      <div class="insights-kpi">
        <div class="insights-kpi-val">${totalBookmarks}<em></em></div>
        <div class="insights-kpi-lbl">Bookmarks</div>
        <div class="insights-kpi-trend neutral">${totalFolders} folders</div>
      </div>
      <div class="insights-kpi">
        <div class="insights-kpi-val">${totalNotes}</div>
        <div class="insights-kpi-lbl">Notes</div>
        <div class="insights-kpi-trend neutral">${topTags.length} tags used</div>
      </div>
      <div class="insights-kpi">
        <div class="insights-kpi-val">${totalTasksDone}<em>/${totalTasks}</em></div>
        <div class="insights-kpi-lbl">Tasks Done</div>
        <div class="insights-kpi-trend${taskRate >= 50 ? "" : " neutral"}">${taskRate}% complete</div>
      </div>
      <div class="insights-kpi">
        <div class="insights-kpi-val">${habitsCompletedToday}<em>/${totalHabits}</em></div>
        <div class="insights-kpi-lbl">Habits Today</div>
        <div class="insights-kpi-trend neutral">${totalHabits} tracked</div>
      </div>
      <div class="insights-kpi">
        <div class="insights-kpi-val">${totalQA}</div>
        <div class="insights-kpi-lbl">Quick Access</div>
        <div class="insights-kpi-trend neutral">Pinned shortcuts</div>
      </div>
      <div class="insights-kpi">
        <div class="insights-kpi-val">${doneReading}<em>/${totalReadingItems}</em></div>
        <div class="insights-kpi-lbl">Reading Done</div>
        <div class="insights-kpi-trend neutral">${totalReadingItems - doneReading} remaining</div>
      </div>
      <div class="insights-kpi">
        <div class="insights-kpi-val">${totalCalEvents}</div>
        <div class="insights-kpi-lbl">Calendar Events</div>
        <div class="insights-kpi-trend neutral">${S.trash.length} in trash</div>
      </div>
    </div>

    <!-- Row: Task Progress | Notes Summary -->
    <div class="insights-section-hd">Productivity</div>
    <div class="insights-cards-row">

      <div class="insights-card">
        <div class="insights-card-hd">
          <span class="insights-card-title">Task Progress</span>
          <span class="insights-card-badge${taskRate >= 70 ? " green" : ""}">${taskRate}%</span>
        </div>
        <div class="ins-prog-wrap">
          <div class="ins-prog-row"><span>${totalTasksDone} done</span><span>${totalTasksPending} pending</span></div>
          <div class="ins-prog-track"><div class="ins-prog-fill" style="width:${taskRate}%"></div></div>
        </div>
        ${
          pendingDisplay.length
            ? pendingDisplay
                .map(
                  (t) => `
            <div class="ins-row">
              <div class="ins-row-left">
                <div class="ins-dot"></div>
                <span class="ins-row-label">${escH(t.text)}</span>
              </div>
            </div>`,
                )
                .join("")
            : '<div class="ins-empty">All tasks complete — great work!</div>'
        }
      </div>

      <div class="insights-card">
        <div class="insights-card-hd">
          <span class="insights-card-title">Recent Notes</span>
          <span class="insights-card-badge">${totalNotes}</span>
        </div>
        ${
          recentNotes.length
            ? recentNotes
                .map(
                  (n) => `
            <div class="ins-row">
              <div class="ins-row-left">
                <div class="ins-row-icon" style="background:var(--accent-bg)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" stroke-width="2" width="12" height="12"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <div class="ins-row-label" style="font-size:12px">${escH(n.title || "Untitled")}</div>
                  ${n.tags?.length ? `<div class="ins-row-sub">#${n.tags.slice(0, 2).join(" #")}</div>` : ""}
                </div>
              </div>
              ${n.pinned ? '<span class="ins-pill accent">📌</span>' : ""}
            </div>`,
                )
                .join("")
            : '<div class="ins-empty">No notes yet. Create your first note.</div>'
        }
        ${topTags.length ? `<div style="margin-top:8px"><div class="ins-tags">${topTags.map(([t]) => `<span class="ins-tag">#${escH(t)}</span>`).join("")}</div></div>` : ""}
      </div>

      <div class="insights-card">
        <div class="insights-card-hd">
          <span class="insights-card-title">Habits</span>
          <span class="insights-card-badge${habitsCompletedToday === totalHabits && totalHabits > 0 ? " green" : ""}">${habitsCompletedToday}/${totalHabits} today</span>
        </div>
        ${
          S.habits.length
            ? S.habits
                .slice(0, 6)
                .map((h) => {
                  const done = (h.completedDates || []).includes(today);
                  const streak = (h.completedDates || []).reduce(
                    (s, d, i, arr) => {
                      if (i === 0) return 1;
                      const prev = new Date(arr[i - 1]);
                      const cur = new Date(d);
                      const diff = Math.round((cur - prev) / 86400000);
                      return diff === 1 ? s + 1 : 1;
                    },
                    h.completedDates?.length ? 1 : 0,
                  );
                  return `<div class="ins-row">
                <div class="ins-row-left">
                  <span style="font-size:16px">${h.icon || "✅"}</span>
                  <span class="ins-row-label">${escH(h.name)}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                  ${streak > 1 ? `<span class="ins-row-sub">🔥 ${streak}</span>` : ""}
                  <div class="ins-dot${done ? " green" : " muted"}"></div>
                </div>
              </div>`;
                })
                .join("")
            : '<div class="ins-empty">No habits tracked yet. Add your first habit.</div>'
        }
      </div>

    </div>

    <!-- Row: Bookmarks | Account -->
    <div class="insights-section-hd">Overview</div>
    <div class="insights-cards-row">

      <div class="insights-card">
        <div class="insights-card-hd">
          <span class="insights-card-title">Bookmark Folders</span>
          <span class="insights-card-badge muted">${totalFolders}</span>
        </div>
        ${
          !totalFolders
            ? '<div class="ins-empty">Visit Bookmarks view to load data.</div>'
            : topFolders
                .slice(0, 6)
                .map((f) => {
                  const count = (f.items || []).length;
                  const pct = Math.round((count / maxFolderSize) * 100);
                  return `<div class="ins-bar-row">
                <span class="ins-bar-label">📁 ${escH(f.title)}</span>
                <div class="ins-bar-track"><div class="ins-bar-fill" style="width:${pct}%"></div></div>
                <span class="ins-bar-val">${count}</span>
              </div>`;
                })
                .join("")
        }
      </div>

      <div class="insights-card">
        <div class="insights-card-hd">
          <span class="insights-card-title">Account</span>
          <span class="insights-card-badge${gEmail ? "" : " muted"}">${gEmail ? "Signed in" : "Guest"}</span>
        </div>
        ${
          gEmail
            ? `<div class="ins-account-row" style="margin-bottom:12px">
          ${
            pic
              ? `<img src="${escH(pic)}" class="ins-avatar-img">`
              : `<div class="ins-avatar-letter">${(gName[0] || "G").toUpperCase()}</div>`
          }
          <div style="min-width:0">
            <div class="ins-account-name">${escH(gName)}</div>
            <div style="font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escH(gEmail)}</div>
          </div>
        </div>`
            : '<div class="ins-empty" style="margin-bottom:8px">No Google account. Sign in via avatar → profile.</div>'
        }
        <div class="ins-row"><span class="ins-row-label">Display name</span><span class="ins-row-sub">${escH(S.user.name || "—")}</span></div>
        ${chromeVer ? `<div class="ins-row"><span class="ins-row-label">Chrome</span><span class="ins-row-sub">v${chromeVer}</span></div>` : ""}
        <div class="ins-row"><span class="ins-row-label">Data version</span><span class="ins-row-sub">Nestpane 1.x</span></div>
      </div>

    </div>

    <!-- Row: Top Sites | Downloads | History -->
    <div class="insights-section-hd">Browser</div>
    <div class="insights-cards-row">
      <div class="insights-card" id="an-topsites">
        <div class="insights-card-hd"><span class="insights-card-title">Top Visited Sites</span></div>
        <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width:70%"></div>
          <div class="skeleton skeleton-text" style="width:85%"></div>
          <div class="skeleton skeleton-text" style="width:60%"></div>
        </div>
      </div>
      <div class="insights-card" id="an-downloads">
        <div class="insights-card-hd"><span class="insights-card-title">Downloads — 30 Days</span></div>
        <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width:65%"></div>
          <div class="skeleton skeleton-text" style="width:75%"></div>
        </div>
      </div>
      <div class="insights-card full" id="an-history">
        <div class="insights-card-hd"><span class="insights-card-title">Browsing Activity — Last 7 Days</span></div>
        <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0">
          <div class="skeleton skeleton-block" style="height:40px"></div>
          <div class="skeleton skeleton-text" style="width:90%"></div>
          <div class="skeleton skeleton-text" style="width:75%"></div>
        </div>
      </div>
      <div class="insights-card full" id="an-activity">
        <div class="insights-card-hd"><span class="insights-card-title">Site Activity — Last 14 Days</span></div>
        <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0">
          <div class="skeleton skeleton-block" style="height:90px"></div>
          <div class="ins-empty" style="display:none"></div>
        </div>
      </div>
    </div>

    <!-- Focus & Productivity Metrics -->
    <div class="insights-section-hd">Focus & Productivity</div>
    <div class="insights-cards-row">
      <div class="insights-card">
        <div class="insights-card-hd"><span class="insights-card-title">Focus Sessions (last 7 days)</span></div>
        <canvas id="focusChart" class="prod-chart" height="80"></canvas>
        ${Object.keys(S._focusSessions || {}).length === 0 ? '<div class="ins-empty">No focus sessions yet. Start the timer!</div>' : ""}
      </div>
      <div class="insights-card">
        <div class="insights-card-hd"><span class="insights-card-title">Habit Completion (last 7 days)</span></div>
        <canvas id="habitChart" class="prod-chart" height="80"></canvas>
        ${(S.habits || []).length === 0 ? '<div class="ins-empty">No habits tracked. Add one in the Habits view!</div>' : ""}
      </div>
      <div class="insights-card">
        <div class="insights-card-hd"><span class="insights-card-title">Focus Time Summary</span></div>
        ${(() => {
          const sessions = S._focusSessions || {};
          const minutes = S._focusMinutes || {};
          const keys = Object.keys(sessions).sort().slice(-7);
          const totalSessions = keys.reduce((s, k) => s + (sessions[k] || 0), 0);
          const totalMins = keys.reduce((s, k) => s + (minutes[k] || 0), 0);
          const avgMins = keys.length ? Math.round(totalMins / keys.length) : 0;
          return `
            <div class="focus-stat-row"><span>Sessions (7d)</span><strong>${totalSessions}</strong></div>
            <div class="focus-stat-row"><span>Total focus time</span><strong>${totalMins}m</strong></div>
            <div class="focus-stat-row"><span>Daily average</span><strong>${avgMins}m</strong></div>
          `;
        })()}
      </div>
    </div>
  `;

  // Draw focus chart
  (function() {
    const canvas = el("focusChart");
    if (!canvas) return;
    const sessions = S._focusSessions || {};
    const today = new Date();
    const days = Array.from({length: 7}, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return _dateKey(d);
    });
    const vals = days.map((d) => sessions[d] || 0);
    const labels = days.map((d) => new Date(d + "T00:00:00").toLocaleDateString("en", {weekday: "short"}));
    _drawBarChart(canvas, labels, vals, "Sessions", "var(--accent)");
  })();

  // Draw habit chart
  (function() {
    const canvas = el("habitChart");
    if (!canvas) return;
    const habits = S.habits || [];
    if (!habits.length) return;
    const today = new Date();
    const days = Array.from({length: 7}, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return _dateKey(d);
    });
    const vals = days.map((day) => habits.filter((h) => (h.days || {})[day]).length);
    const labels = days.map((d) => new Date(d + "T00:00:00").toLocaleDateString("en", {weekday: "short"}));
    _drawBarChart(canvas, labels, vals, `/${habits.length}`, "var(--success)");
  })();

  // --- Top Sites (async) ---
  if (IS_CHROME && chrome.topSites) {
    chrome.topSites.get((sites) => {
      const card = el("an-topsites");
      if (!card) return;
      if (!sites || !sites.length) {
        card.querySelector(".ins-empty").textContent =
          "No top sites data available.";
        return;
      }
      card.innerHTML =
        `<div class="insights-card-hd"><span class="insights-card-title">Top Visited Sites</span><span class="insights-card-badge muted">${sites.length}</span></div>` +
        sites
          .slice(0, 8)
          .map(
            (s) => `
          <div class="ins-row">
            <div class="ins-row-left">
              <img src="${favSrc(s.url)}" style="width:16px;height:16px;border-radius:3px;flex-shrink:0">
              <span class="ins-row-label">${escH(s.title || getDomain(s.url))}</span>
            </div>
            <span class="ins-row-sub">${escH(getDomain(s.url))}</span>
          </div>`,
          )
          .join("");
    });
  } else {
    const c = el("an-topsites");
    if (c)
      c.querySelector(".ins-empty").textContent = "Requires Chrome extension.";
  }

  // --- History (async) ---
  if (IS_CHROME && chrome.history) {
    const since = Date.now() - 7 * 86400000;
    chrome.history.search(
      { text: "", startTime: since, maxResults: 1000 },
      (items) => {
        const card = el("an-history");
        if (!card) return;
        const ownPrefix = chrome.runtime.getURL("");
        const domainCounts = {};
        let totalVisits = 0;
        (items || [])
          .filter((item) => !item.url?.startsWith(ownPrefix))
          .forEach((item) => {
            const d = getDomain(item.url);
            domainCounts[d] = (domainCounts[d] || 0) + (item.visitCount || 1);
            totalVisits += item.visitCount || 1;
          });
        const topDomains = Object.entries(domainCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        const maxV = topDomains[0]?.[1] || 1;
        card.innerHTML =
          `
        <div class="insights-card-hd">
          <span class="insights-card-title">Browsing Activity — Last 7 Days</span>
          <div style="display:flex;gap:16px;font-size:11px;color:var(--text-3)">
            <span>${totalVisits.toLocaleString()} visits</span>
            <span>${Object.keys(domainCounts).length} sites</span>
          </div>
        </div>` +
          topDomains
            .map(
              ([d, c]) => `
          <div class="ins-bar-row">
            <div class="ins-bar-label" style="display:flex;align-items:center;gap:5px;width:120px">
              <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=16" style="width:13px;height:13px;border-radius:2px;flex-shrink:0">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escH(d)}</span>
            </div>
            <div class="ins-bar-track"><div class="ins-bar-fill" style="width:${Math.round((c / maxV) * 100)}%"></div></div>
            <span class="ins-bar-val">${c.toLocaleString()}</span>
          </div>`,
            )
            .join("");
      },
    );
  } else {
    const c = el("an-history");
    if (c)
      c.querySelector(".ins-empty").textContent = "Requires Chrome extension.";
  }

  // --- Site Activity trend (async) ---
  if (IS_CHROME && chrome.history) {
    const DAYS = 14;
    const since = Date.now() - DAYS * 86400000;
    chrome.history.search(
      { text: "", startTime: since, maxResults: 5000 },
      (items) => {
        const card = el("an-activity");
        if (!card) return;
        const ownPrefix = chrome.runtime.getURL("");
        const dayCounts = {};
        const todayKey = new Date().toDateString();
        (items || [])
          .filter((item) => !item.url?.startsWith(ownPrefix))
          .forEach((item) => {
            const key = new Date(item.lastVisitTime).toDateString();
            dayCounts[key] = (dayCounts[key] || 0) + (item.visitCount || 1);
          });
        const buckets = [];
        for (let i = DAYS - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          const key = d.toDateString();
          buckets.push({
            label: d.toLocaleDateString(undefined, { weekday: "short" })[0],
            count: dayCounts[key] || 0,
            isToday: key === todayKey,
          });
        }
        const max = Math.max(1, ...buckets.map((b) => b.count));
        card.innerHTML = `
          <div class="insights-card-hd">
            <span class="insights-card-title">Site Activity — Last ${DAYS} Days</span>
            <span class="insights-card-badge muted">${(dayCounts[todayKey] || 0).toLocaleString()} pages today</span>
          </div>
          <div class="ins-vbar-chart">
            ${buckets
              .map(
                (b) => `
              <div class="ins-vbar-col${b.isToday ? " today" : ""}" data-tip="${b.count.toLocaleString()} pages">
                <span class="ins-vbar-val">${b.count || ""}</span>
                <div class="ins-vbar" style="height:${Math.max(3, Math.round((b.count / max) * 90))}px"></div>
                <span class="ins-vbar-label">${escH(b.label)}</span>
              </div>`,
              )
              .join("")}
          </div>
        `;
      },
    );
  } else {
    const c = el("an-activity");
    const empty = c?.querySelector(".ins-empty");
    if (empty) {
      empty.style.display = "";
      empty.textContent = "Requires Chrome extension.";
    }
  }

  // --- Downloads (async) ---
  if (IS_CHROME && chrome.downloads) {
    const since = Date.now() - 30 * 86400000;
    const fmt = (b) =>
      b > 1e9
        ? (b / 1e9).toFixed(1) + " GB"
        : b > 1e6
          ? (b / 1e6).toFixed(1) + " MB"
          : b > 1e3
            ? (b / 1e3).toFixed(1) + " KB"
            : b + " B";
    chrome.downloads.search(
      { orderBy: ["-startTime"], limit: 200 },
      (items) => {
        const card = el("an-downloads");
        if (!card) return;
        const recent = (items || []).filter(
          (d) => d.startTime && new Date(d.startTime).getTime() > since,
        );
        const totalBytes = recent.reduce((s, d) => s + (d.fileSize || 0), 0);
        card.innerHTML =
          `
        <div class="insights-card-hd">
          <span class="insights-card-title">Downloads — 30 Days</span>
          <span class="insights-card-badge muted">${recent.length} files</span>
        </div>
        <div style="display:flex;gap:16px;font-size:12px;color:var(--text-3);margin-bottom:6px">
          <span>${fmt(totalBytes)} total</span>
        </div>` +
          recent
            .slice(0, 6)
            .map((d) => {
              const name =
                (d.filename || d.url || "").split(/[\\/]/).pop() || "Unknown";
              return `<div class="ins-row">
            <span class="ins-row-label">${escH(name)}</span>
            <span class="ins-row-sub">${fmt(d.fileSize || 0)}</span>
          </div>`;
            })
            .join("");
      },
    );
  } else {
    const c = el("an-downloads");
    if (c)
      c.querySelector(".ins-empty").textContent = "Requires Chrome extension.";
  }
}

// ===== TOOLTIPS (delegated — works for dynamically rendered elements) =====
function initTooltips() {
  const tip = document.createElement("div");
  tip.className = "tt";
  document.body.appendChild(tip);
  let cur = null;

  function show(target) {
    if (target === cur) return;
    cur = target;
    const rect = target.getBoundingClientRect();
    tip.textContent = target.dataset.tip;
    const inCollapsedSidebar =
      S.settings.sidebarCollapsed &&
      (target.closest(".sb-nav") || target.closest(".sb-foot"));
    if (inCollapsedSidebar) {
      tip.dataset.dir = "right";
      tip.style.left = rect.right + 10 + "px";
      tip.style.top = rect.top + rect.height / 2 + "px";
    } else {
      tip.dataset.dir = "down";
      tip.style.left = rect.left + rect.width / 2 + "px";
      tip.style.top = rect.bottom + 10 + "px";
    }
    tip.classList.add("tt-show");
  }
  function hide() {
    tip.classList.remove("tt-show");
    cur = null;
  }

  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("[data-tip]");
    if (t) show(t);
    else if (!cur) return;
    else if (!cur.contains(e.target)) hide();
  });
  document.addEventListener("mouseout", (e) => {
    if (!cur) return;
    const t = e.target.closest("[data-tip]");
    if (t && t === cur && !t.contains(e.relatedTarget)) hide();
  });
  document.addEventListener("click", hide);
  document.addEventListener("scroll", hide, true);
}

// ===== FIX #4 — SETTINGS PANEL =====
async function openSettings() {
  // Populate current values
  el("settingsName").value = S.user.name;
  _syncThemeGridUI();
  el("e2eToggle").checked = !!S.settings.e2e?.enabled;
  el("e2ePassphrase").value = await _e2eLoadPassphrase();
  el("aiToggle").checked = !!S.settings.ai?.enabled;
  el("aiApiKey").value = await _aiLoadApiKey();
  el("aiTestStatus").textContent = "";
  el("clock12Btn").classList.toggle("active", S.settings.clockFormat === "12");
  el("clock24Btn").classList.toggle("active", S.settings.clockFormat === "24");
  el("showSecondsToggle").checked = !!S.settings.showSeconds;
  el("widgetNotesToggle").checked = S.settings.widgets.notes !== false;
  el("widgetTimerToggle").checked = S.settings.widgets.timer !== false;
  el("widgetCalendarToggle").checked = S.settings.widgets.calendar !== false;
  el("widgetTodoToggle").checked = S.settings.widgets.todo !== false;
  el("widgetRemindersToggle").checked = S.settings.widgets.reminders !== false;
  // Highlight active card glow
  document.querySelectorAll("#cardGlowGroup .toggle-opt").forEach((b) => {
    b.classList.toggle(
      "active",
      b.dataset.glow === (S.settings.cardGlow || "glow"),
    );
  });
  // Highlight active accent
  _syncAccentSwatchUI(S.settings.accentColor || "#fe8019");
  document.querySelectorAll("#avatarColors .color-swatch").forEach((s) => {
    s.classList.toggle(
      "active",
      s.dataset.color === (S.user.avatarColor || "#7c3aed"),
    );
  });
  _loadShortcutsUI();
  el("settingsPanel").classList.add("open");
  el("settingsOverlay").classList.add("open");
}
function closeSettings() {
  el("settingsPanel").classList.remove("open");
  el("settingsOverlay").classList.remove("open");
}
async function saveSettings() {
  const name = el("settingsName").value.trim() || S.user.name;
  S.user.name = name;
  S.settings.widgets.notes = el("widgetNotesToggle").checked;
  S.settings.widgets.timer = el("widgetTimerToggle").checked;
  S.settings.widgets.calendar = el("widgetCalendarToggle").checked;
  S.settings.widgets.todo = el("widgetTodoToggle").checked;
  S.settings.widgets.reminders = el("widgetRemindersToggle").checked;
  S.settings.showSeconds = el("showSecondsToggle").checked;
  const glowBtn = document.querySelector("#cardGlowGroup .toggle-opt.active");
  S.settings.cardGlow = glowBtn?.dataset.glow || "glow";
  S.settings.e2e = S.settings.e2e || {};
  const e2eWantsEnabled = el("e2eToggle").checked;
  const e2ePassInput = el("e2ePassphrase").value;
  if (e2eWantsEnabled && _e2ePassphraseIsWeak(e2ePassInput)) {
    el("e2eToggle").checked = S.settings.e2e.enabled || false;
    showToast(
      `E2E encryption needs a passphrase of at least ${E2E_MIN_PASSPHRASE_LEN} characters — settings not saved.`,
      "error",
    );
    return;
  }
  S.settings.e2e.enabled = e2eWantsEnabled;
  await _e2eSavePassphrase(e2ePassInput);
  S.settings.ai = S.settings.ai || {};
  S.settings.ai.enabled = el("aiToggle").checked;
  await _aiSaveApiKey(el("aiApiKey").value.trim());
  applyCardGlow(S.settings.cardGlow);
  updateAvatarDisplay();
  updateGreeting();
  applyWidgetVisibility();
  _syncAiUI();
  save();
  closeSettings();
  showToast("Settings saved!", "success");
}
function applyTheme(theme) {
  S.settings.theme = theme;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("__nt_theme", theme);
  } catch (e) {}
  const icon = el("themeIcon"),
    label = el("themeLabel");
  if (theme === "light") {
    if (icon)
      icon.innerHTML =
        '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    if (label) label.textContent = "Light";
  } else {
    if (icon)
      icon.innerHTML =
        '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    if (label)
      label.textContent =
        THEME_PRESETS.find((t) => t.id === theme)?.label || "Dark";
  }
  _syncThemeGridUI();
}

// Theme marketplace — curated theme presets for the Settings theme grid
const THEME_PRESETS = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
];

function _syncThemeGridUI() {
  document.querySelectorAll("#themeGrid .theme-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.theme === S.settings.theme);
  });
}
function applyAccent(color) {
  if (!color) return;
  S.settings.accentColor = color;
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--accent-2", color + "cc");
  document.documentElement.style.setProperty("--accent-light", color + "cc");
  document.documentElement.style.setProperty("--accent-bg", color + "2e");
  document.documentElement.style.setProperty("--accent-subtle", color + "14");
  document.documentElement.style.setProperty("--accent-glow", color + "80");
  try {
    localStorage.setItem("__nt_accent", color);
  } catch (e) {}
  _syncAccentSwatchUI(color);
}

// Keep the settings-panel accent swatches (and custom picker) in sync with
// the active accent color, including on initial load and after a cloud pull.
function _syncAccentSwatchUI(color) {
  const norm = (c) => (c || "").toLowerCase();
  let matched = false;
  document.querySelectorAll("#accentColors .color-swatch[data-color]").forEach((s) => {
    const isMatch = norm(s.dataset.color) === norm(color);
    s.classList.toggle("active", isMatch);
    if (isMatch) matched = true;
  });
  const customInput = el("accentColorCustomInput");
  if (customInput) {
    customInput.classList.toggle("active", !matched);
    if (/^#[0-9a-fA-F]{6}$/.test(color)) customInput.value = color;
  }
}
function applyCardGlow(mode) {
  document.documentElement.dataset.cardGlow = mode || "glow";
}
function applyWidgetVisibility() {
  const w = S.settings.widgets;
  const show = (id, visible) => {
    const el2 = document.getElementById(id);
    if (el2) el2.style.display = visible === false ? "none" : "";
  };
  show("widget-notes", w.notes);
  show("widget-timer", w.timer);
  show("widget-calendar", w.calendar);
  show("widget-todo", w.todo);
  show("widget-reminders", w.reminders);
}

// Export / Import
function exportData() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          user: S.user,
          quickAccess: S.quickAccess,
          notes: S.notes,
          folders: S.folders,
          importedBookmarks: S.importedBookmarks,
          settings: S.settings,
          trash: S.trash,
          exportedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `nestpane-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  showToast("Data exported!", "success");
}
// Full-backup import touches quickAccess/importedBookmarks, plus sidebar
// link items in settings — sanitize every URL found rather than trusting a
// backup file's scheme.
function _sanitizeImportedFlatData(d) {
  return {
    quickAccess: _dedupeByUrl(_sanitizeImportedLinks(d?.quickAccess)),
    importedBookmarks: _dedupeByUrl(_sanitizeImportedLinks(d?.importedBookmarks)),
  };
}

function _sanitizeImportedSidebar(sidebar) {
  if (!Array.isArray(sidebar)) return sidebar;
  return sidebar.map((group) => ({
    ...group,
    items: Array.isArray(group?.items)
      ? group.items
          .map((item) => {
            if (!item || item.kind !== "link" || !item.url) return item;
            const clean = safeUrl(item.url);
            return clean ? { ...item, url: clean } : null;
          })
          .filter(Boolean)
      : group?.items,
  }));
}

const IMPORT_FILE_MAX_BYTES = 10 * 1024 * 1024; // 10MB — matches the chrome.storage.local quota

function importData(file) {
  if (file.size > IMPORT_FILE_MAX_BYTES) {
    showToast("File too large to import (max 10MB)", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const d = JSON.parse(e.target.result);
      if (Array.isArray(d.workspaces) || (d.wsData && typeof d.wsData === "object")) {
        // Backup predates workspace removal — flatten into the current model.
        const flat = _flattenLegacyWorkspaceData(d);
        const clean = _sanitizeImportedFlatData(flat);
        S.quickAccess = clean.quickAccess;
        S.notes = flat.notes;
        S.folders = flat.folders;
        S.importedBookmarks = clean.importedBookmarks;
        S.kanban = flat.kanban;
        S.reminders = flat.reminders;
      } else {
        const clean = _sanitizeImportedFlatData(d);
        if (Array.isArray(d.quickAccess)) S.quickAccess = clean.quickAccess;
        if (Array.isArray(d.notes)) S.notes = d.notes;
        if (Array.isArray(d.folders)) S.folders = d.folders;
        if (Array.isArray(d.importedBookmarks)) S.importedBookmarks = clean.importedBookmarks;
      }
      if (d.user) S.user = d.user;
      if (d.settings) {
        S.settings = { ...S.settings, ...d.settings };
        if (d.settings.sidebar) S.settings.sidebar = _sanitizeImportedSidebar(d.settings.sidebar);
      }
      if (d.trash) S.trash = d.trash;
      save();
      renderAll();
      applyTheme(S.settings.theme);
      applyAccent(S.settings.accentColor);
      showToast("Data imported successfully!", "success");
    } catch {
      showToast("Invalid file format", "error");
    }
  };
  reader.readAsText(file);
}

// ===== SEARCH =====
function setupSearch() {
  // Search trigger button opens command palette
  el("searchTriggerBtn").addEventListener("click", () => openCmdPalette());
}

// ===== COMMAND PALETTE =====
let _cmdActiveIdx = -1;
let _cmdRecentSearches = [];

// Falls through to the user's own default search engine via the Chrome
// Search API (requires the "search" permission) instead of a hardcoded
// provider — hardcoding one is a Chrome Web Store single-purpose violation
// ("must respect the user's selected [search] settings").
function searchTheWeb(q) {
  if (!q) return;
  if (IS_CHROME && chrome.search && chrome.search.query) {
    chrome.search.query({ text: q, disposition: "NEW_TAB" });
  } else {
    // Non-extension context (e.g. local dev preview) — chrome.search is
    // unavailable there, so fall back to a plain web search.
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(q)}`,
      "_blank",
    );
  }
}

// Lightweight fuzzy match: returns a score (higher = better) or -1 if no match.
// Consecutive-character bonus makes "yt" rank YouTube above unrelated hits.
function _fuzzyScore(haystack, needle) {
  if (!needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h.includes(n)) return 100 + (n.length / h.length) * 50; // exact substring wins
  let hi = 0, ni = 0, score = 0, consecutive = 0;
  while (hi < h.length && ni < n.length) {
    if (h[hi] === n[ni]) {
      consecutive++;
      score += consecutive * 2;
      ni++;
    } else {
      consecutive = 0;
    }
    hi++;
  }
  if (ni < n.length) return -1; // all chars not found
  return score;
}

function _fuzzyMatch(text, q) {
  return _fuzzyScore(text, q) > 0;
}

function openCmdPalette(prefill) {
  const overlay = el("cmdPaletteOverlay");
  const inp = el("cmdInput");
  overlay.classList.add("open");
  inp.value = prefill || "";
  _cmdActiveIdx = -1;
  setTimeout(() => inp.focus(), 50);
  if (prefill) _renderCmdResults(prefill);
  else {
    el("cmdResults").innerHTML = _cmdEmptyStateWithRecents();
    el("cmdResults").querySelectorAll(".cmd-recent-item").forEach((item) => {
      item.addEventListener("click", () => {
        inp.value = item.dataset.recent;
        _renderCmdResults(item.dataset.recent);
      });
    });
  }
}

function closeCmdPalette() {
  const inp = el("cmdInput");
  const q = inp ? inp.value.trim() : "";
  if (q && q.length > 1 && !q.startsWith(">") && !q.startsWith("?")) {
    _cmdRecentSearches = [q, ..._cmdRecentSearches.filter((s) => s !== q)].slice(0, 8);
  }
  el("cmdPaletteOverlay").classList.remove("open");
  if (inp) inp.value = "";
  el("cmdResults").innerHTML = "";
  _cmdActiveIdx = -1;
}

function _cmdEmptyStateWithRecents() {
  if (!_cmdRecentSearches.length) return _cmdEmptyState();
  const recentHtml = _cmdRecentSearches.map((s) =>
    `<div class="cmd-recent-item" data-recent="${escH(s)}">${escH(s)}</div>`
  ).join("");
  return `<div class="cmd-recents-section"><div class="cmd-section-label">Recent searches</div>${recentHtml}</div><div class="cmd-empty-hint">Search bookmarks, notes, tasks, history, tabs &amp; more</div>`;
}

function _cmdEmptyState() {
  return `<div class="cmd-empty"><div class="cmd-empty-icon">⌕</div>Search bookmarks, notes, tasks, history, tabs &amp; more</div>`;
}

function _buildCmdResults(q) {
  const scoreItem = (title, url) => Math.max(_fuzzyScore(title || "", q), _fuzzyScore(url || "", q) * 0.7);

  // Bookmarks — combine Chrome bookmarks + saved bookmarks, deduplicate, sort by score
  const allBmCandidates = [];
  for (const f of S.allBookmarks) {
    for (const it of f.items) allBmCandidates.push(it);
  }
  for (const bm of S.importedBookmarks || []) {
    if (!allBmCandidates.find((b) => b.url === bm.url)) allBmCandidates.push({ title: bm.title, url: bm.url });
  }
  for (const qa of S.quickAccess || []) {
    if (!allBmCandidates.find((b) => b.url === qa.url)) allBmCandidates.push({ title: qa.name, url: qa.url });
  }
  const bmMatches = allBmCandidates
    .map((it) => ({ it, score: scoreItem(it.title, it.url) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.it);

  // Notes
  const noteMatches = (S.notes || []).filter(
    (n) => _fuzzyMatch(n.title || "", q) || _fuzzyMatch(n.content || "", q),
  );

  // Tasks (Nestodo cards)
  const taskMatches = [];
  const cmdKb = S.kanban || {};
  for (const col of ["todo", "doing", "done"]) {
    for (const card of cmdKb[col] || []) {
      if (_fuzzyMatch(card.title || "", q) || _fuzzyMatch(card.desc || "", q)) {
        taskMatches.push({ id: card.id, text: card.title, done: col === "done" });
      }
    }
  }

  const readingMatches = (S.readingQueue || []).filter(
    (r) => _fuzzyMatch(r.title || "", q) || _fuzzyMatch(r.url || "", q),
  );
  const sessionMatches = (S.tabSessions || []).filter(
    (s) => _fuzzyMatch(s.name || "", q) || (s.tabs || []).some((t) => _fuzzyMatch(t.title || "", q) || _fuzzyMatch(t.url || "", q)),
  );
  const journalMatches = Object.entries(S.journal || {})
    .filter(([, entry]) => _fuzzyMatch(entry?.text || "", q))
    .map(([date, entry]) => ({ date, ...entry }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    bmMatches,
    noteMatches: noteMatches.slice(0, 3),
    taskMatches: taskMatches.slice(0, 4),
    readingMatches: readingMatches.slice(0, 3),
    sessionMatches: sessionMatches.slice(0, 3),
    journalMatches: journalMatches.slice(0, 3),
  };
}

let _cmdAsyncToken = 0;

function _renderCmdResults(q) {
  const {
    bmMatches,
    noteMatches,
    taskMatches,
    readingMatches,
    sessionMatches,
    journalMatches,
  } = _buildCmdResults(q);
  let html = "";

  if (aiEnabled()) {
    html += `<div class="cmd-result-item cmd-ai-item" data-cmd-item data-cmd-ai>
      <div class="cmd-favicon-wrap cmd-ai-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M18.4 5.6l-2.1 2.1m-8.6 8.6-2.1 2.1"/></svg>
      </div>
      <div class="cmd-ai-label">Ask AI: <em>"${escH(q)}"</em></div>
      <span class="cmd-ai-hint">⏎</span>
    </div>`;
  }

  if (bmMatches.length) {
    html += `<div class="cmd-section-label">Bookmarks</div>`;
    html += bmMatches
      .map(
        (bm) => `
      <a href="${escH(safeUrl(bm.url) || "#")}" class="cmd-result-item" target="_self" data-cmd-item>
        <div class="cmd-favicon-wrap"><img src="${favSrc(bm.url)}" data-img-fallback="fade" alt=""></div>
        <div class="cmd-item-body">
          <div class="cmd-item-title">${escH(bm.title || bm.url)}</div>
        </div>
        <div class="cmd-domain-tag">${escH(getDomain(bm.url))}</div>
      </a>`,
      )
      .join("");
  }

  if (noteMatches.length) {
    html += `<div class="cmd-section-label">Notes</div>`;
    html += noteMatches
      .map(
        (n) => `
      <div class="cmd-result-item" data-cmd-item data-note-id="${n.id}">
        <div class="cmd-note-icon">📝</div>
        <div class="cmd-item-body">
          <div class="cmd-item-title">${escH(n.title || "Untitled Note")}</div>
          <div class="cmd-item-sub">${escH((n.content || "").replace(/<[^>]+>/g, "").slice(0, 55))}${(n.content || "").length > 55 ? "…" : ""}</div>
        </div>
      </div>`,
      )
      .join("");
  }

  if (taskMatches.length) {
    html += `<div class="cmd-section-label">Tasks</div>`;
    html += taskMatches
      .map(
        (t) => `
      <div class="cmd-result-item" data-cmd-item data-task-id="${t.id}">
        <div class="cmd-type-icon">${t.done ? "✅" : "☐"}</div>
        <div class="cmd-item-body">
          <div class="cmd-item-title">${escH(t.text)}</div>
        </div>
      </div>`,
      )
      .join("");
  }

  if (readingMatches.length) {
    html += `<div class="cmd-section-label">Reading Queue</div>`;
    html += readingMatches
      .map(
        (r) => `
      <div class="cmd-result-item" data-cmd-item data-reading-id="${r.id}">
        <div class="cmd-type-icon">📖</div>
        <div class="cmd-item-body">
          <div class="cmd-item-title">${escH(r.title || r.url)}</div>
        </div>
        <div class="cmd-domain-tag">${escH(getDomain(r.url))}</div>
      </div>`,
      )
      .join("");
  }

  if (sessionMatches.length) {
    html += `<div class="cmd-section-label">Sessions</div>`;
    html += sessionMatches
      .map(
        (s) => `
      <div class="cmd-result-item" data-cmd-item data-session-id="${s.id}">
        <div class="cmd-type-icon">🖥️</div>
        <div class="cmd-item-body">
          <div class="cmd-item-title">${escH(s.name)}</div>
        </div>
        <div class="cmd-domain-tag">${s.tabs.length} tabs</div>
      </div>`,
      )
      .join("");
  }

  if (journalMatches.length) {
    html += `<div class="cmd-section-label">Journal</div>`;
    html += journalMatches
      .map((j) => {
        const snippet = (j.text || "").slice(0, 60);
        return `
      <div class="cmd-result-item" data-cmd-item data-journal-date="${j.date}">
        <div class="cmd-type-icon">${j.mood || "📓"}</div>
        <div class="cmd-item-body">
          <div class="cmd-item-title">${escH(j.date)}</div>
          <div class="cmd-item-sub">${escH(snippet)}${(j.text || "").length > 60 ? "…" : ""}</div>
        </div>
      </div>`;
      })
      .join("");
  }

  const syncEmpty =
    !bmMatches.length &&
    !noteMatches.length &&
    !taskMatches.length &&
    !readingMatches.length &&
    !sessionMatches.length &&
    !journalMatches.length;

  if (syncEmpty) {
    html += `<div class="cmd-empty"><div class="cmd-empty-icon" style="font-size:20px">∅</div>No results for "<em style="color:var(--accent-2)">${escH(q)}</em>"</div>`;
  }

  html += `<div class="cmd-result-item cmd-google-item" data-cmd-item data-action="search-web" data-q="${escH(q)}">
    <div class="cmd-google-icon">🔎</div>
    <div class="cmd-google-label">Search the web for <em>"${escH(q)}"</em></div>
  </div>`;

  el("cmdResults").innerHTML = html;
  _cmdActiveIdx = -1;

  // Wire note clicks
  el("cmdResults")
    .querySelectorAll("[data-note-id]")
    .forEach((el2) => {
      el2.addEventListener("click", () => {
        openNoteEdit(Number(el2.dataset.noteId));
        navigateTo("notes");
        closeCmdPalette();
      });
    });

  // Wire task clicks
  el("cmdResults")
    .querySelectorAll("[data-task-id]")
    .forEach((el2) => {
      el2.addEventListener("click", () => {
        openNestodoModal();
        closeCmdPalette();
      });
    });

  // Wire reading queue clicks
  el("cmdResults")
    .querySelectorAll("[data-reading-id]")
    .forEach((el2) => {
      el2.addEventListener("click", () => {
        navigateTo("reading");
        closeCmdPalette();
      });
    });

  // Wire session clicks
  el("cmdResults")
    .querySelectorAll("[data-session-id]")
    .forEach((el2) => {
      el2.addEventListener("click", () => {
        navigateTo("sessions");
        closeCmdPalette();
      });
    });

  // Wire journal clicks
  el("cmdResults")
    .querySelectorAll("[data-journal-date]")
    .forEach((el2) => {
      el2.addEventListener("click", () => {
        const date = el2.dataset.journalDate;
        navigateTo("journal");
        setTimeout(() => selectJournalDay(date), 150);
        closeCmdPalette();
      });
    });

  // Wire "Ask AI" click
  el("cmdResults")
    .querySelector("[data-cmd-ai]")
    ?.addEventListener("click", () => _cmdAskAI(q));

  _cmdSearchAsync(q);
}

// Appends "Open Tabs" and "History" sections once async lookups resolve.
async function _cmdSearchAsync(q) {
  if (!IS_CHROME || !chrome.tabs) return;
  const token = ++_cmdAsyncToken;
  const ql = q.toLowerCase();
  const ownPrefix = chrome.runtime.getURL("");

  const [tabs, historyItems] = await Promise.all([
    new Promise((res) => chrome.tabs.query({}, (t) => res(t || []))),
    API.history(q),
  ]);
  if (token !== _cmdAsyncToken) return; // query changed / palette closed
  if (el("cmdInput").value.trim().toLowerCase() !== ql) return;

  const tabMatches = tabs
    .filter(
      (t) =>
        t.url &&
        !t.url.startsWith("chrome://") &&
        !t.url.startsWith(ownPrefix) &&
        ((t.title || "").toLowerCase().includes(ql) ||
          t.url.toLowerCase().includes(ql)),
    )
    .slice(0, 5);

  const historyMatches = (historyItems || [])
    .filter((h) => !h.url?.startsWith(ownPrefix))
    .slice(0, 5);

  if (!tabMatches.length && !historyMatches.length) return;

  let html = "";
  if (tabMatches.length) {
    html += `<div class="cmd-section-label">Open Tabs</div>`;
    html += tabMatches
      .map(
        (t) => `
      <div class="cmd-result-item" data-cmd-item data-tab-id="${t.id}" data-tab-winid="${t.windowId}">
        <div class="cmd-favicon-wrap"><img src="${favSrc(t.url)}" data-img-fallback="fade" alt=""></div>
        <div class="cmd-item-body">
          <div class="cmd-item-title">${escH(t.title || t.url)}</div>
        </div>
        <div class="cmd-domain-tag">${escH(getDomain(t.url))}</div>
      </div>`,
      )
      .join("");
  }
  if (historyMatches.length) {
    html += `<div class="cmd-section-label">History</div>`;
    html += historyMatches
      .map(
        (h) => `
      <a href="${escH(safeUrl(h.url) || "#")}" class="cmd-result-item" target="_blank" rel="noopener" data-cmd-item>
        <div class="cmd-favicon-wrap"><img src="${favSrc(h.url)}" data-img-fallback="fade" alt=""></div>
        <div class="cmd-item-body">
          <div class="cmd-item-title">${escH(h.title || h.url)}</div>
        </div>
        <div class="cmd-domain-tag">${escH(getDomain(h.url))}</div>
      </a>`,
      )
      .join("");
  }

  const results = el("cmdResults");
  // Insert after the synced "no results" block (if present) but before the
  // trailing Google search item, so the order stays predictable.
  const googleItem = results.querySelector(".cmd-google-item");
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  if (googleItem) {
    while (wrap.firstChild) results.insertBefore(wrap.firstChild, googleItem);
  } else {
    while (wrap.firstChild) results.appendChild(wrap.firstChild);
  }

  // Remove the generic "no results" message now that we have async results
  const emptyEl = results.querySelector(".cmd-empty");
  if (emptyEl && (tabMatches.length || historyMatches.length))
    emptyEl.remove();

  // Wire open-tab clicks
  results.querySelectorAll("[data-tab-id]").forEach((el2) => {
    el2.addEventListener("click", () => {
      const tabId = Number(el2.dataset.tabId);
      const winId = Number(el2.dataset.tabWinid);
      chrome.tabs.update(tabId, { active: true });
      chrome.windows.update(winId, { focused: true });
      closeCmdPalette();
    });
  });
}

async function _cmdAskAI(q) {
  if (!q) return;
  const results = el("cmdResults");
  const isFollowUp = _aiConvHistory.length > 0;
  const historyLen = _aiConvHistory.length;
  results.innerHTML = `<div class="cmd-ai-panel">
    ${isFollowUp ? `<div class="cmd-ai-history-badge">Conversation (${historyLen / 2 | 0} turns) · <button class="cmd-ai-clear-btn" data-action="ai-clear-conv">Clear</button></div>` : ""}
    <div class="cmd-ai-loading"><div class="cmd-ai-spinner"></div>${isFollowUp ? "Continuing…" : "Asking AI…"}</div>
  </div>`;
  _cmdActiveIdx = -1;
  try {
    let accumulated = "";
    const panel = results.querySelector(".cmd-ai-panel");
    await aiStream(q, {
      system: "You are a helpful assistant embedded in a browser new-tab dashboard. Answer the user's question concisely.",
      maxTokens: 1200,
      onChunk: (chunk, full) => {
        accumulated = full;
        const loading = panel.querySelector(".cmd-ai-loading");
        if (loading) {
          loading.outerHTML = `<div class="cmd-ai-response cmd-ai-streaming"></div>`;
        }
        const resp = panel.querySelector(".cmd-ai-response");
        if (resp) resp.textContent = accumulated;
      },
    });
    const resp = panel.querySelector(".cmd-ai-response");
    if (resp) resp.classList.remove("cmd-ai-streaming");
    _cmdRenderAiResponse(q, accumulated);
  } catch (err) {
    _aiConvHistory.pop(); // remove failed user turn
    _cmdRenderAiError(q, err);
  }
}

function _cmdRenderAiResponse(q, text) {
  const results = el("cmdResults");
  const turns = _aiConvHistory.filter((m) => m.role === "user").length;
  results.innerHTML = `<div class="cmd-ai-panel">
    ${turns > 1 ? `<div class="cmd-ai-history-badge">Conversation (${turns} turns) · <button class="cmd-ai-clear-btn" data-action="ai-clear-conv">Clear</button></div>` : ""}
    <div class="cmd-ai-response"></div>
    <div class="cmd-ai-followup-row">
      <input type="text" class="cmd-ai-followup-input" id="cmdAiFollowup" placeholder="Follow-up question…">
      <button class="cmd-ai-action-btn" id="cmdAiFollowupBtn">Ask</button>
    </div>
    <div class="cmd-ai-actions">
      <button class="cmd-ai-action-btn" data-ai-action="copy">Copy</button>
      <button class="cmd-ai-action-btn" data-ai-action="note">Save as Note</button>
      <button class="cmd-ai-action-btn" data-ai-action="task">Add as Task</button>
      <button class="cmd-ai-action-btn" data-ai-action="new">New conversation</button>
    </div>
  </div>`;
  results.querySelector(".cmd-ai-response").textContent =
    text || "(empty response)";
  const followupInput = el("cmdAiFollowup");
  const followupBtn = el("cmdAiFollowupBtn");
  if (followupInput && followupBtn) {
    followupBtn.addEventListener("click", () => {
      const fq = followupInput.value.trim();
      if (fq) _cmdAskAI(fq);
    });
    followupInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); followupBtn.click(); }
    });
    setTimeout(() => followupInput.focus(), 50);
  }

  results
    .querySelector('[data-ai-action="copy"]')
    .addEventListener("click", () => {
      navigator.clipboard?.writeText(text);
      showToast("Copied to clipboard", "success");
    });
  results
    .querySelector('[data-ai-action="note"]')
    .addEventListener("click", () => {
      const now = Date.now();
      wsData().notes.unshift({
        id: now,
        title: q.slice(0, 60),
        content: text,
        date: now,
        updatedAt: now,
        tags: ["ai"],
        pinned: false,
      });
      save();
      renderNotesWidget();
      showToast("Saved as note", "success");
      closeCmdPalette();
    });
  results
    .querySelector('[data-ai-action="task"]')
    .addEventListener("click", () => {
      addTask(text.slice(0, 200));
      showToast("Added as task", "success");
      closeCmdPalette();
    });
  const newConvBtn = results.querySelector('[data-ai-action="new"]');
  if (newConvBtn) newConvBtn.addEventListener("click", () => {
    _aiResetConversation();
    const inp = el("cmdInput");
    inp.value = "";
    inp.focus();
    el("cmdResults").innerHTML = _cmdEmptyState();
  });
}

function _cmdRenderAiError(q, err) {
  const results = el("cmdResults");
  if (err?.code === "AI_NOT_CONFIGURED") {
    results.innerHTML = `<div class="cmd-ai-panel">
      <div class="cmd-ai-error">AI features aren't set up yet. Add your Anthropic API key in Settings to enable "Ask AI".</div>
      <div class="cmd-ai-actions">
        <button class="cmd-ai-action-btn" id="cmdAiOpenSettings">Open Settings</button>
      </div>
    </div>`;
    el("cmdAiOpenSettings").addEventListener("click", () => {
      closeCmdPalette();
      openSettings();
    });
    return;
  }
  results.innerHTML = `<div class="cmd-ai-panel">
    <div class="cmd-ai-error">Something went wrong asking AI: ${escH(err?.message || "request failed")}</div>
    <div class="cmd-ai-actions">
      <button class="cmd-ai-action-btn" id="cmdAiRetry">Retry</button>
    </div>
  </div>`;
  el("cmdAiRetry").addEventListener("click", () => _cmdAskAI(q));
}

function _cmdItems() {
  return Array.from(el("cmdResults").querySelectorAll("[data-cmd-item]"));
}

function _cmdSetActive(idx) {
  const items = _cmdItems();
  items.forEach((i) => i.classList.remove("active"));
  if (idx >= 0 && idx < items.length) {
    items[idx].classList.add("active");
    items[idx].scrollIntoView({ block: "nearest" });
  }
  _cmdActiveIdx = idx;
}

// ── Keyboard shortcut helpers ─────────────────────────────────────────────
// key string format: "Alt+K", "Ctrl+Shift+T", "Cmd+K", or single char "/"
function _kbMatch(e, keyStr) {
  if (!keyStr) return false;
  const parts = keyStr.split("+").map((s) => s.toLowerCase().trim());
  const mainKey = parts.at(-1);
  const needsCtrl = parts.includes("ctrl");
  const needsShift = parts.includes("shift");
  // Mac keyboards produce special characters for Option(Alt)+letter, so
  // "Alt+" shortcuts (the app's defaults) also fire on Cmd there — the same
  // convention browsers use for their own built-in Alt shortcuts. A shortcut
  // typed as "Cmd+…"/"Meta+…" works the same way in reverse.
  const needsAltOrCmd = parts.includes("alt") || parts.includes("cmd") || parts.includes("meta");
  return (
    e.key.toLowerCase() === mainKey &&
    (e.altKey || e.metaKey) === needsAltOrCmd &&
    !!e.ctrlKey === needsCtrl &&
    !!e.shiftKey === needsShift
  );
}

function saveShortcuts() {
  const search = el("kbSearch")?.value.trim() || "/";
  const timer = el("kbTimer")?.value.trim() || "";
  const note = el("kbNote")?.value.trim() || "";
  const task = el("kbTask")?.value.trim() || "";
  if (!S.settings.shortcuts) S.settings.shortcuts = {};
  S.settings.shortcuts = { search, timer, note, task };
  save();
  showToast("Keyboard shortcuts saved", "success");
}

function _loadShortcutsUI() {
  const kb = S.settings.shortcuts || {};
  if (el("kbSearch")) el("kbSearch").value = kb.search || "/";
  if (el("kbTimer")) el("kbTimer").value = kb.timer || "";
  if (el("kbNote")) el("kbNote").value = kb.note || "";
  if (el("kbTask")) el("kbTask").value = kb.task || "";
}

function _cmdInitKeyboard() {
  const inp = el("cmdInput");
  inp.addEventListener(
    "input",
    debounce((e) => {
      const q = e.target.value.trim();
      if (!q) {
        el("cmdResults").innerHTML = _cmdEmptyState();
        _cmdActiveIdx = -1;
        return;
      }
      _renderCmdResults(q);
    }, 150),
  );

  inp.addEventListener("keydown", (e) => {
    const items = _cmdItems();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      _cmdSetActive(Math.min(_cmdActiveIdx + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      _cmdSetActive(Math.max(_cmdActiveIdx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const q = inp.value.trim();
      if (_cmdActiveIdx >= 0 && items[_cmdActiveIdx]) {
        const active = items[_cmdActiveIdx];
        if (active.href) {
          window.location.href = active.href;
          closeCmdPalette();
        } else active.click();
      } else if (q) {
        searchTheWeb(q);
        closeCmdPalette();
      }
    } else if (e.key === "Escape") {
      closeCmdPalette();
    }
  });

  el("cmdPaletteOverlay").addEventListener("click", (e) => {
    if (e.target === el("cmdPaletteOverlay")) closeCmdPalette();
  });
  el("cmdEscBadge") &&
    el("cmdEscBadge").addEventListener("click", closeCmdPalette);
}

function hideSearch() {} // kept for any legacy references

// ===== NAVIGATION =====
function navigateTo(view) {
  const current = document.querySelector(".view.active");
  const next = el(`view-${view}`);
  if (current && current !== next) {
    current.style.animation = "wsContentOut .1s ease forwards";
    setTimeout(() => {
      current.style.animation = "";
      document
        .querySelectorAll(".view")
        .forEach((v) => v.classList.remove("active"));
      next?.classList.add("active");
      document
        .querySelectorAll("[data-view]")
        .forEach((n) => n.classList.toggle("active", n.dataset.view === view));
      updateSidebarTabActive();
      _navigateLoad(view);
    }, 100);
    return;
  }
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  next?.classList.add("active");
  document
    .querySelectorAll("[data-view]")
    .forEach((n) => n.classList.toggle("active", n.dataset.view === view));
  updateSidebarTabActive();
  _navigateLoad(view);
}

function _navigateLoad(view) {
  if (view === "bookmarks") {
    if (!S.allBookmarks.length) loadBookmarks();
    S.bmFolderFilter = null;
    renderBmForActiveWorkspace();
  }
  if (view === "history") loadHistory(el("historySearch").value || "");
  if (view === "downloads") loadDownloads();
  if (view === "trash") renderTrash();
  if (view === "analytics") renderAnalytics();
  if (view === "habits") renderHabits();
  if (view === "reading") renderReadingQueue();
  if (view === "sessions") renderSessions();
  if (view === "journal") initJournalView();
}

function renderBmForActiveWorkspace() {
  const items = wsBookmarks();
  const q = (el("bookmarkSearch")?.value || "").toLowerCase().trim();

  if (!items.length) {
    renderBmToolbar([]);
    el("allBookmarksList").innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔖</div>
        <div class="empty-state-text">No bookmarks yet.<br>Click + to add one.</div>
      </div>`;
    return;
  }

  // Group by folderName
  const groups = {};
  items.forEach((bm) => {
    const key = bm.folderName || "Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(bm);
  });

  // Build toolbar with all folder names
  renderBmToolbar(Object.keys(groups).sort());

  // Apply folder filter
  let entries = Object.entries(groups);
  if (S.bmFolderFilter)
    entries = entries.filter(([name]) => name === S.bmFolderFilter);

  // Apply search
  if (q) {
    entries = entries
      .map(([name, bms]) => [
        name,
        bms.filter(
          (b) =>
            (b.title || "").toLowerCase().includes(q) ||
            (b.url || "").toLowerCase().includes(q),
        ),
      ])
      .filter(([, bms]) => bms.length);
  }

  // Sort items within each folder
  entries = entries.map(([name, bms]) => {
    let sorted = [...bms];
    if (S.bmSort === "az")
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (S.bmSort === "za")
      sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    else if (S.bmSort === "newest")
      sorted.sort((a, b) => (b.date || b.id || 0) - (a.date || a.id || 0));
    else if (S.bmSort === "oldest")
      sorted.sort((a, b) => (a.date || a.id || 0) - (b.date || b.id || 0));
    else if (S.bmSort === "most")
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || "")); // fallback to A-Z
    return [name, sorted];
  });

  if (!entries.length) {
    el("allBookmarksList").innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No bookmarks match</div></div>';
    return;
  }

  const list = el("allBookmarksList");
  const delIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;
  list.innerHTML = entries
    .map(
      ([folderName, bms]) => `
    <div class="bm-folder${S.bmFolderFilter ? " open" : ""}">
      <div class="bm-folder-header bm-ws-folder-header" data-folder="${escH(folderName)}">
        <span class="bm-folder-chevron">▶</span>
        <div class="bm-folder-icon-wrap">📁</div>
        <span class="bm-folder-name">${escH(folderName)}</span>
        <span class="bm-folder-count">${bms.length}</span>
      </div>
      <div class="bm-items">
        <div class="bm-items-inner">
          ${bms
            .map(
              (bm) => `
            <a href="${escH(safeUrl(bm.url) || "#")}" class="bm-item" target="_self">
              <img src="${favSrc(bm.url)}" alt="" width="16" height="16" style="border-radius:3px;flex-shrink:0">
              <span class="bm-item-title">${escH(bm.title || bm.url)}</span>
              <span class="bm-item-url">${escH(getDomain(bm.url))}</span>
              <span class="bm-item-actions">
                <button class="bm-action-btn bm-del-btn ws-bm-remove" data-bmid="${escH(bm.id)}" data-tip="Remove">${delIcon}</button>
              </span>
            </a>`,
            )
            .join("")}
        </div>
      </div>
    </div>`,
    )
    .join("");
  list.querySelectorAll(".bm-ws-folder-header").forEach((h) => {
    h.addEventListener("click", () => toggleBmFolder(h.dataset.folder));
  });
  list.querySelectorAll(".ws-bm-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeWsBm(btn.dataset.bmid);
      renderBmForActiveWorkspace();
    });
  });
}

// ===== FAB =====
function toggleFab() {
  el("fabBtn").classList.toggle("open");
  el("fabMenu").classList.toggle("open");
}
function closeFab() {
  el("fabBtn").classList.remove("open");
  el("fabMenu").classList.remove("open");
}

// ===== MODALS =====
function openModal(id) {
  el(id)?.classList.add("open");
}
function closeModal(id) {
  el(id)?.classList.remove("open");
}
function closeAllModals() {
  document
    .querySelectorAll(".modal-overlay")
    .forEach((m) => m.classList.remove("open"));
  _closeCsel();
  closeCtxMenu();
}

// Confirm helper
function confirm2(title, msg, onOk, onCancel) {
  el("confirmTitle").textContent = title;
  el("confirmMessage").textContent = msg;
  el("confirmOkBtn").onclick = () => {
    closeModal("confirmModal");
    onOk();
  };
  // Wire cancel button to also call onCancel if provided
  const cancelBtns = document.querySelectorAll(
    '#confirmModal [data-modal="confirmModal"]',
  );
  cancelBtns.forEach((btn) => {
    btn.onclick = onCancel
      ? () => {
          closeModal("confirmModal");
          onCancel();
        }
      : null;
  });
  openModal("confirmModal");
}

// Generic single-field text prompt modal — replaces window.prompt() so
// renames/adds match the rest of the app's custom modal styling. Reused by
// addSidebarGroup, renameSidebarGroup and renameSidebarItem. When onDelete is
// passed (editing an existing group/item), the modal also shows a Delete
// button so rename/delete/cancel all live in one popup.
function sbPrompt(title, initialValue, onSave, onDelete) {
  el("sbPromptTitle").textContent = title;
  const input = el("sbPromptInput");
  input.value = initialValue || "";
  input.onkeydown = (e) => {
    if (e.key === "Enter") el("sbPromptSaveBtn").click();
  };
  el("sbPromptSaveBtn").textContent = onDelete ? "Update" : "Create";
  el("sbPromptSaveBtn").onclick = () => {
    const value = input.value.trim();
    if (!value) {
      showToast("Enter a name", "error");
      return;
    }
    closeModal("sbPromptModal");
    onSave(value);
  };
  const deleteBtn = el("sbPromptDeleteBtn");
  if (deleteBtn) {
    deleteBtn.style.display = onDelete ? "" : "none";
    deleteBtn.onclick = onDelete
      ? () => {
          closeModal("sbPromptModal");
          onDelete();
        }
      : null;
  }
  openModal("sbPromptModal");
  setTimeout(() => {
    input.focus();
    input.select();
  }, 80);
}

// ===== TOAST =====
let toastTO;
function showToast(msg, type = "") {
  let t = document.getElementById("_toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "_toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  // Reset to hidden state so transition re-fires on rapid calls
  t.classList.remove("show");
  t.className = `toast ${type}`;
  t.textContent = msg;
  clearTimeout(toastTO);
  // Two rAFs ensure the browser paints the hidden state before showing
  requestAnimationFrame(() =>
    requestAnimationFrame(() => t.classList.add("show")),
  );
  toastTO = setTimeout(() => t.classList.remove("show"), 3000);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  initSidebarFlyout();
  initSidebarTabs();

  // Static HTML buttons
  // refreshFoldersBtn removed — folders feature deleted
  el("analyticsBtn").addEventListener("click", () => navigateTo("analytics"));
  document
    .querySelectorAll(".view-back-btn")
    .forEach((btn) => btn.addEventListener("click", () => navigateTo("home")));
  el("sidebarToggleBtn").addEventListener("click", () => {
    S.settings.sidebarCollapsed = !S.settings.sidebarCollapsed;
    document.body.classList.toggle(
      "sidebar-collapsed",
      S.settings.sidebarCollapsed,
    );
    // Collapsing hides every edit-mode control, so staying in edit mode would
    // strand the user in a state they can't see or leave (and would render
    // per-item action buttons into the flyout). Drop out of it on collapse.
    if (S.settings.sidebarCollapsed && S.sidebarEditMode) {
      S.sidebarEditMode = false;
      el("sbEditModeBtn")?.classList.remove("active");
      renderSidebar();
    }
    save();
  });

  el("sbEditModeBtn")?.addEventListener("click", toggleSidebarEditMode);

  // Delegated — sidebar is re-rendered on every CRUD action, so these
  // listeners must be on a stable ancestor (document), not the regenerated
  // buttons themselves.
  document.addEventListener("click", (e) => {
    const addGroupBtn = e.target.closest("#sbAddGroupBtn");
    if (addGroupBtn) return addSidebarGroup();
    const renameBtn = e.target.closest("[data-sb-rename-group]");
    if (renameBtn) return renameSidebarGroup(renameBtn.dataset.sbRenameGroup);
    const addViewBtn = e.target.closest("[data-add-view]");
    if (addViewBtn) return addSidebarViewItem(S._sbAddLinkGroup, addViewBtn.dataset.addView);
    const renameItemBtn = e.target.closest("[data-sb-rename-item]");
    if (renameItemBtn) return renameSidebarItem(renameItemBtn.dataset.sbItemGroup, renameItemBtn.dataset.sbRenameItem);
  });

  el("weatherWidget").addEventListener("click", openWeatherLocationModal);

  // Nav — sidebar items with data-view (delegated: the sidebar and the
  // collapsed-mode flyout both regenerate these elements dynamically, so a
  // per-element listener attached once at boot would miss every one of
  // them created afterward)
  document.addEventListener("click", (e) => {
    const n = e.target.closest(".sb-item[data-view]");
    if (!n) return;
    e.preventDefault();
    // Nestodo is a modal now, not a routed view — every other sidebar item
    // still goes through the normal view navigation.
    if (n.dataset.view === "kanban") openNestodoModal();
    else navigateTo(n.dataset.view);
  });

  // Global [data-action] dispatch — CSP-safe replacement for inline onclick=
  // in dynamically-rendered HTML (MV3's extension_pages CSP forbids inline
  // script/event-handler attributes; only 'self' script sources are allowed).
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-action]");
    if (!t) return;
    const d = t.dataset;
    switch (d.action) {
      case "ai-clear-conv":
        _aiResetConversation();
        el("cmdResults").innerHTML = "";
        el("cmdInput").value = "";
        el("cmdInput").focus();
        break;
      case "toggle-habit-day":
        toggleHabitDay(Number(d.habitId), d.day);
        break;
      case "delete-habit":
        deleteHabit(Number(d.habitId));
        break;
      case "open-reading-url": {
        const readingUrl = safeUrl(d.url);
        if (readingUrl) window.open(readingUrl, "_blank", "noopener,noreferrer");
        else showToast("This link has an unsupported URL scheme", "error");
        break;
      }
      case "toggle-reading-done":
        toggleReadingDone(Number(d.id));
        break;
      case "delete-reading":
        deleteReading(Number(d.id));
        break;
      case "restore-session":
        restoreSession(Number(d.id));
        break;
      case "delete-session":
        deleteSession(Number(d.id));
        break;
      case "select-journal-day":
        selectJournalDay(d.day);
        break;
      case "delete-kanban-card":
        deleteKanbanCard(d.col, Number(d.id));
        break;
      case "apply-hero-color":
        applyHeroColor(d.hex);
        break;
      case "delete-cal-event":
        deleteCalEvent(Number(d.id));
        break;
      case "gcal-retry":
        fetchGoogleCalendarEvents(S._gcalStatus === "unauthorized");
        break;
      case "search-web":
        searchTheWeb(d.q);
        closeCmdPalette();
        break;
    }
  });

  // Global broken-favicon/avatar fallback — CSP-safe replacement for inline
  // onerror= on dynamically-rendered <img> tags. 'error' doesn't bubble, so
  // this must be registered on the capture phase.
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement)) return;
      const mode = img.dataset.imgFallback;
      if (mode === "fade") {
        img.style.opacity = "0";
      } else if (mode === "bm-icon") {
        img.style.display = "none";
        img.parentNode?.classList.add("bm-icon-fallback");
      } else {
        img.style.display = "none";
      }
    },
    true,
  );

  // Theme
  el("themeBtn").addEventListener("click", () => {
    applyTheme(S.settings.theme === "dark" ? "light" : "dark");
    save();
  });

  // Settings open
  el("settingsBtn").addEventListener("click", openSettings);
  el("topSettingsBtn").addEventListener("click", openSettings);
  el("closeSettingsBtn").addEventListener("click", closeSettings);
  el("settingsOverlay").addEventListener("click", closeSettings);
  el("saveSettingsBtn").addEventListener("click", saveSettings);
  el("saveShortcutsBtn")?.addEventListener("click", saveShortcuts);
  el("pushCloudBtn")?.addEventListener("click", manualPushToDrive);
  el("pullCloudBtn")?.addEventListener("click", manualPullFromDrive);

  // Settings theme grid (theme marketplace)
  el("themeGrid")?.addEventListener("click", (e) => {
    const card = e.target.closest(".theme-card");
    if (!card) return;
    applyTheme(card.dataset.theme);
    save();
  });

  // Clock format
  el("clock12Btn").addEventListener("click", () => {
    S.settings.clockFormat = "12";
    el("clock12Btn").classList.add("active");
    el("clock24Btn").classList.remove("active");
    updateClock();
    save();
  });
  el("clock24Btn").addEventListener("click", () => {
    S.settings.clockFormat = "24";
    el("clock24Btn").classList.add("active");
    el("clock12Btn").classList.remove("active");
    updateClock();
    save();
  });
  el("showSecondsToggle").addEventListener("change", () => {
    S.settings.showSeconds = el("showSecondsToggle").checked;
    updateClock();
    save();
  });

  // Card glow toggle
  document.querySelectorAll("#cardGlowGroup .toggle-opt").forEach((b) => {
    b.addEventListener("click", () => {
      document
        .querySelectorAll("#cardGlowGroup .toggle-opt")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      S.settings.cardGlow = b.dataset.glow;
      applyCardGlow(b.dataset.glow);
      save();
    });
  });

  // Accent colors
  document.querySelectorAll("#accentColors .color-swatch[data-color]").forEach((s) => {
    s.addEventListener("click", () => {
      applyAccent(s.dataset.color);
      save();
    });
  });
  // Custom accent color picker
  const accentCustomInput = el("accentColorCustomInput");
  if (accentCustomInput) {
    accentCustomInput.addEventListener("input", (e) => {
      applyAccent(e.target.value);
      save();
    });
  }
  // Avatar colors
  document.querySelectorAll("#avatarColors .color-swatch").forEach((s) => {
    s.addEventListener("click", () => {
      document
        .querySelectorAll("#avatarColors .color-swatch")
        .forEach((x) => x.classList.remove("active"));
      s.classList.add("active");
      S.user.avatarColor = s.dataset.color;
      el("userAvatar").style.background = s.dataset.color;
      save();
    });
  });

  // Widget toggles (live preview)
  ["Notes", "Timer"].forEach((w) => {
    el(`widget${w}Toggle`).addEventListener("change", () => {
      S.settings.widgets[w.toLowerCase()] = el(`widget${w}Toggle`).checked;
      applyWidgetVisibility();
      save();
    });
  });

  // Export/Import/Clear
  el("exportDataBtn").addEventListener("click", exportData);
  el("importDataBtn").addEventListener("click", () =>
    el("importFileInput").click(),
  );
  el("importFileInput").addEventListener("change", (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });

  // Granular data clear
  el("clearNotesBtn").addEventListener("click", () => {
    confirm2(
      "Clear All Notes?",
      "All notes will be moved to Trash.",
      () => {
        const data = wsData();
        (data.notes || []).forEach((n) =>
          S.trash.push({
            ...n,
            _type: "note",
            _deletedAt: Date.now(),
          }),
        );
        data.notes = [];
        save();
        renderNotesWidget();
        renderNotesView();
        renderTrash();
        showToast("Notes cleared", "success");
      },
    );
  });
  el("clearTasksBtn").addEventListener("click", () => {
    confirm2(
      "Clear All Nestodo?",
      "All to-dos, in-progress and done cards will be moved to Trash.",
      () => {
        const kb = getKanban();
        ["todo", "doing", "done"].forEach((col) => {
          (kb[col] || []).forEach((card) =>
            S.trash.push({
              id: card.id,
              text: card.title,
              done: col === "done",
              _type: "task",
              _deletedAt: Date.now(),
            }),
          );
          kb[col] = [];
        });
        save();
        renderKanbanDash();
        if (el("nestodoModal")?.classList.contains("open")) renderKanban();
        renderTrash();
        showToast("Nestodo cleared", "success");
      },
    );
  });
  el("clearQuickAccessBtn").addEventListener("click", () => {
    confirm2(
      "Clear Quick Access?",
      "All quick access links will be removed.",
      () => {
        wsData().quickAccess = [];
        save();
        renderQuickAccess();
        showToast("Quick access cleared", "success");
      },
    );
  });
  el("clearTrashBtn").addEventListener("click", () => {
    confirm2(
      "Empty Trash?",
      "All deleted items will be permanently removed.",
      () => {
        S.trash = [];
        save();
        renderTrash();
        showToast("Trash emptied", "success");
      },
    );
  });
  el("clearAllDataBtn").addEventListener("click", () => {
    confirm2(
      "Clear All Data",
      "This will permanently delete all your notes, tasks and settings, and sign you out of Google (revoking Drive sync access). This cannot be undone.",
      async () => {
        await _revokeGoogleAccess();
        S.googleUser = null;
        S.user.googlePicture = null;
        S.user.googleName = null;
        Drive._fileId = null;
        Drive._lastSyncAt = 0;
        clearTimeout(Drive._syncTimer);
        S.quickAccess = DEFAULT_QUICK_ACCESS.map((q) => ({ ...q }));
        S.notes = [];
        S.folders = DEFAULT_FOLDERS.map((f) => ({ ...f }));
        S.importedBookmarks = DEFAULT_IMPORTED_BOOKMARKS.map((b) => ({ ...b }));
        S.weatherLocation = null;
        S.trash = [];
        S.settings = {
          theme: "dark",
          accentColor: "#fe8019",
          clockFormat: "12",
          showSeconds: true,
          cardGlow: "glow",
          widgets: {
            notes: false,
            timer: false,
            calendar: true,
            todo: false,
            reminders: true,
          },
          heroBg: null,
          qaMode: "icon",
        };
        S.habits = [];
        S.readingQueue = [];
        S.tabSessions = [];
        S.journal = {};
        S.kanban = {
          todo: DEFAULT_KANBAN.todo.map((c) => ({ ...c })),
          doing: [],
          done: DEFAULT_KANBAN.done.map((c) => ({ ...c })),
        };
        S.reminders = [];
        save();
        renderAll();
        applyTheme("dark");
        applyAccent("#fe8019");
        applyCardGlow("glow");
        updateAvatarDisplay();
        setSyncStatus("signed-out");
        showToast("All data cleared", "success");
      },
    );
  });

  // Weather location modal
  el("saveWeatherLocationBtn").addEventListener("click", saveWeatherLocation);
  el("detectLocationBtn").addEventListener("click", detectWeatherLocation);
  el("weatherLocationInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveWeatherLocation();
  });
  el("reDetectWeatherBtn").addEventListener("click", () => {
    closeModal("weatherLocationModal");
    reDetectWeather();
  });

  // Notes
  el("addNoteBtn").addEventListener("click", openNoteNew);
  el("addNoteViewBtn").addEventListener("click", openNoteNew);
  el("saveNoteBtn").addEventListener("click", saveNote);
  el("noteMdToggle")?.addEventListener("click", _toggleNoteMarkdown);
  el("deleteNoteBtn").addEventListener("click", deleteNote);
  el("notePinBtn").addEventListener("click", () => {
    _notePinned = !_notePinned;
    updateNotePinBtn();
  });
  el("noteContent").addEventListener("input", updateNoteWordCount);
  el("noteTagInput").addEventListener("keydown", (e) => {
    if (
      (e.key === "Enter" || e.key === "," || e.key === " ") &&
      e.target.value.trim()
    ) {
      e.preventDefault();
      const tag = e.target.value.trim().replace(/,$/, "").toLowerCase();
      if (tag && !_noteTags.includes(tag) && _noteTags.length < 8) {
        _noteTags.push(tag);
        renderNoteEditorTags();
      }
      e.target.value = "";
    }
    if (e.key === "Backspace" && !e.target.value && _noteTags.length) {
      _noteTags.pop();
      renderNoteEditorTags();
    }
  });
  el("notesViewSearch").addEventListener("input", (e) => {
    S.notesViewSearch = e.target.value;
    renderNotesView();
  });


  // Quick Access
  // QA display mode buttons
  el("qaModeBtns")
    ?.querySelectorAll(".qa-mode-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        S.settings.qaMode = btn.dataset.mode;
        save();
        el("qaModeBtns")
          .querySelectorAll(".qa-mode-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderQuickAccess();
      });
    });
  el("saveQuickAccessBtn").addEventListener("click", () => {
    const name = el("qaName").value.trim(),
      url = el("qaUrl").value.trim();
    if (!name || !url) {
      showToast("Fill in all fields", "error");
      return;
    }
    const fullUrl = safeUrl(url);
    if (_qaEditId !== null) {
      const d = wsData();
      const item = d.quickAccess.find((q) => q.id === _qaEditId);
      if (item) {
        item.name = name;
        item.url = fullUrl;
      }
      save();
      renderQuickAccess();
      showToast("Updated!", "success");
    } else {
      addQA(name, fullUrl);
    }
    _qaEditId = null;
    el("qaName").value = "";
    el("qaUrl").value = "";
    closeModal("quickAccessModal");
  });

  // Quote removed

  // Timer
  el("timerPlayBtn").addEventListener("click", timerPlay);
  el("timerResetBtn").addEventListener("click", () => resetTimer(25, "focus"));
  document.querySelectorAll(".preset-btn").forEach((b) => {
    b.addEventListener("click", () => resetTimer(parseInt(b.dataset.min), b.dataset.type || "focus"));
  });

  // Focus mode
  el("focusModeBtn").addEventListener("click", openFocusModeModal);
  el("saveFocusModeBtn").addEventListener("click", saveFocusModeSettings);

  // AI assistant
  el("testAiKeyBtn")?.addEventListener("click", testAiApiKey);
  el("refreshBriefingBtn")?.addEventListener("click", refreshAiBriefing);

  // Smart Organize
  el("smartOrganizeBtn")?.addEventListener("click", openSmartOrganizeModal);
  el("applyOrganizeBtn")?.addEventListener("click", applySmartOrganize);

  // View all folders → bookmarks
  el("viewAllFolders")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("bookmarks");
  });

  // Profile
  el("userAvatarBtn").addEventListener("click", () => {
    el("profileName").value = S.user.name;
    const gUser = S.googleUser;
    if (gUser) {
      const pic = S.user.googlePicture || gUser.picture;
      const name = S.user.googleName || gUser.email || "";
      const avatarHtml = pic
        ? `<img src="${escH(pic)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0">`
        : `<div style="width:40px;height:40px;border-radius:50%;background:${S.user.avatarColor || "#7c3aed"};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0">${(name[0] || "U").toUpperCase()}</div>`;
      const syncInfo = Drive._lastSyncAt
        ? `<div style="font-size:10.5px;color:var(--success);margin-top:2px">☁ Synced ${_timeAgo(Drive._lastSyncAt)}</div>`
        : `<div style="font-size:10.5px;color:var(--text-3);margin-top:2px">☁ Connected to Drive</div>`;
      el("profileGoogleInfo").style.display = "flex";
      el("profileGoogleInfo").innerHTML =
        `${avatarHtml}<div style="min-width:0">
        <div style="font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escH(name)}</div>
        <div style="color:var(--text-3);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escH(gUser.email)}</div>
        ${syncInfo}
      </div>`;
      if (el("logoutBtn")) el("logoutBtn").style.display = "";
    } else {
      el("profileGoogleInfo").style.display = "none";
      if (el("logoutBtn")) el("logoutBtn").style.display = "none";
    }
    openModal("profileModal");
  });
  el("saveProfileBtn").addEventListener("click", () => {
    const n = el("profileName").value.trim();
    if (!n) {
      showToast("Enter a name", "error");
      return;
    }
    S.user.name = n;
    updateAvatarDisplay();
    updateGreeting();
    save();
    closeModal("profileModal");
    showToast("Profile updated!", "success");
  });

  // FAB
  el("fabBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFab();
  });
  el("fabAddNote").addEventListener("click", () => {
    closeFab();
    openNoteNew();
  });
  el("fabAddTask").addEventListener("click", () => {
    closeFab();
    openKanbanCardModal("todo");
  });
  el("fabAddQuickAccess").addEventListener("click", () => {
    closeFab();
    openModal("quickAccessModal");
  });
  el("fabAddBookmark").addEventListener("click", () => {
    closeFab();
    openAddBookmarkModal();
  });
  el("fabVoiceCapture").addEventListener("click", () => {
    closeFab();
    openVoiceCaptureModal();
  });
  document.addEventListener("click", (e) => {
    if (!el("fabBtn").contains(e.target) && !el("fabMenu").contains(e.target))
      closeFab();
  });

  // Voice quick-capture
  el("voiceMicBtn").addEventListener("click", toggleVoiceRecording);
  el("voiceSaveNoteBtn").addEventListener("click", saveVoiceAsNote);
  el("voiceSaveTaskBtn").addEventListener("click", saveVoiceAsTask);
  el("voiceSaveJournalBtn").addEventListener("click", saveVoiceAsJournal);
  el("voiceCaptureModal").addEventListener("click", (e) => {
    if (e.target === el("voiceCaptureModal") || e.target.closest("[data-modal='voiceCaptureModal']"))
      _voiceStopRecognition();
  });

  // Trash
  el("emptyTrashBtn").addEventListener("click", emptyTrash);

  // Modal close buttons
  document
    .querySelectorAll("[data-modal]")
    .forEach((b) =>
      b.addEventListener("click", () => closeModal(b.dataset.modal)),
    );
  document.querySelectorAll(".modal-overlay").forEach((o) =>
    o.addEventListener("click", (e) => {
      if (e.target === o) o.classList.remove("open");
    }),
  );

  // Bookmark / folder add buttons in bookmarks view header
  el("addBookmarkBtn").addEventListener("click", () => openAddBookmarkModal());
  el("addFolderBtn").addEventListener("click", () => openAddFolderModal());

  // Workspace bookmark chooser
  el("addWsBmBtn").addEventListener("click", openWsBmChooser);
  el("chooserFolderBtn").addEventListener("click", () => {
    closeModal("wsBmChooserModal");
    openWsFolderEditModal(null);
  });
  el("chooserBookmarkBtn").addEventListener("click", () => {
    closeModal("wsBmChooserModal");
    openWsBookmarkEditModal(_wsBmDefaultFolder, null);
  });

  // Workspace folder create/edit modal
  el("wsFolderEditSaveBtn").addEventListener("click", saveWsFolderEdit);
  el("wsFolderEditNameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") el("wsFolderEditSaveBtn").click();
  });

  // Custom folder dropdown toggle
  el("wsBmFolderBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = el("wsBmFolderBtn").classList.toggle("open");
    el("wsBmFolderDropdown").classList.toggle("open", isOpen);
  });
  document.addEventListener("click", (e) => {
    if (!el("wsBmFolderWrap")?.contains(e.target)) _closeCsel();
  });

  // Workspace bookmark add/edit modal
  el("wsBmEditSaveBtn").addEventListener("click", saveWsBookmarkEdit);
  el("wsBmEditDeleteBtn").addEventListener("click", () => {
    if (!_wsBmEditId) return;
    confirm2(
      "Delete bookmark?",
      "This bookmark will be permanently removed.",
      async () => {
        const d = wsData();
        d.importedBookmarks = (d.importedBookmarks || []).filter(
          (b) => b.id !== _wsBmEditId,
        );
        await save();
        closeModal("wsBookmarkEditModal");
        renderWorkspaceBookmarks();
        renderSidebarFolders();
        showToast("Bookmark deleted", "success");
      },
    );
  });
  el("wsBmEditUrl").addEventListener("keydown", (e) => {
    if (e.key === "Enter") el("wsBmEditSaveBtn").click();
  });

  // Bookmark edit modal
  el("bmEditSaveBtn").addEventListener("click", saveBookmarkEdit);
  el("bmEditDeleteBtn").addEventListener(
    "click",
    () => _bmEditId && deleteChromeBm(_bmEditId),
  );
  el("bmEditName").addEventListener("keydown", (e) => {
    if (e.key === "Enter") el("bmEditSaveBtn").click();
  });

  // Folder edit modal
  el("folderEditSaveBtn").addEventListener("click", saveFolderEdit);
  el("folderEditName").addEventListener("keydown", (e) => {
    if (e.key === "Enter") el("folderEditSaveBtn").click();
  });

  // History search
  el("historySearch").addEventListener(
    "input",
    debounce((e) => loadHistory(e.target.value), 350),
  );

  // Bookmark search
  el("bookmarkSearch").addEventListener("input", () =>
    renderBmForActiveWorkspace(),
  );

  // Bookmark sort
  el("bmSortSelect").addEventListener("change", (e) => {
    S.bmSort = e.target.value;
    if (S.allBookmarks && S.allBookmarks.length)
      renderAllBookmarks(S.allBookmarks);
    else renderBmForActiveWorkspace();
  });

  // Init timer
  renderTimerDisplay();

  // ── Hero quote controls ────────────────────────────────────────────────
  el("shuffleQuoteBtn")?.addEventListener("click", shuffleHeroQuote);
  el("editQuoteBtn")?.addEventListener("click", enterHeroQuoteEdit);
  el("saveQuoteBtn")?.addEventListener("click", saveHeroQuoteEdit);

  // ── Wallpaper controls ─────────────────────────────────────────────────
  el("refreshWallpaperBtn")?.addEventListener("click", refreshWallpaper);
  el("uploadWallpaperBtn")?.addEventListener("click", uploadWallpaper);
  el("resetWallpaperBtn")?.addEventListener("click", resetWallpaper);
  el("heroBgColorBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    openModal("heroColorModal");
  });
  el("heroBgUploadInput")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleWallpaperUpload(file);
    e.target.value = "";
  });

  // ── Sidebar + (add link) buttons — event delegation (the buttons are
  // recreated on every renderSidebar() call, so a per-element listener
  // attached once at boot would miss every group rendered afterward) ─────
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-addlink]");
    if (!btn) return;
    e.stopPropagation();
    openSbAddLink(btn.dataset.addlink);
  });
  el("sbAddLinkSaveBtn")?.addEventListener("click", saveSbLink);
  el("sbAddLinkName")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") el("sbAddLinkUrl").focus();
  });
  el("sbAddLinkUrl")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveSbLink();
  });

  // ── Habits ─────────────────────────────────────────────────────────────
  el("addHabitBtn")?.addEventListener("click", () => {
    el("habitNameInput").value = "";
    el("habitEmojiInput").value = "";
    openModal("habitModal");
    setTimeout(() => el("habitNameInput").focus(), 80);
  });
  el("habitSaveBtn")?.addEventListener("click", saveHabit);
  el("habitNameInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") el("habitEmojiInput").focus();
  });
  el("habitEmojiInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveHabit();
  });

  // ── Reading Queue ───────────────────────────────────────────────────────
  el("addReadingBtn")?.addEventListener("click", () => {
    el("readingTitleInput").value = "";
    el("readingUrlInput").value = "";
    openModal("readingModal");
    setTimeout(() => el("readingUrlInput").focus(), 80);
  });
  el("readingSaveBtn")?.addEventListener("click", saveReading);
  el("readingUrlInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveReading();
  });

  // ── Tab Sessions ────────────────────────────────────────────────────────
  el("saveSessionBtn")?.addEventListener("click", saveCurrentSession);

  // ── Journal ─────────────────────────────────────────────────────────────
  el("journalPrevMonth")?.addEventListener("click", () => {
    _journalViewMonth--;
    if (_journalViewMonth < 0) {
      _journalViewMonth = 11;
      _journalViewYear--;
    }
    renderJournalCal();
  });
  el("journalNextMonth")?.addEventListener("click", () => {
    _journalViewMonth++;
    if (_journalViewMonth > 11) {
      _journalViewMonth = 0;
      _journalViewYear++;
    }
    renderJournalCal();
  });
  el("journalTextarea")?.addEventListener("input", updateJournalWordCount);
  el("saveJournalBtn")?.addEventListener("click", saveJournalEntry);
  el("saveJournalBtn2")?.addEventListener("click", saveJournalEntry);
  document.querySelectorAll(".journal-mood-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".journal-mood-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // ── Kanban ──────────────────────────────────────────────────────────────
  el("kanbanDashOpenBtn")?.addEventListener("click", () => openNestodoModal());
  el("kanbanDashAddBtn")?.addEventListener("click", () => openKanbanCardModal("todo"));
  document.querySelectorAll(".kanban-add-card").forEach((btn) => {
    btn.addEventListener("click", () => openKanbanCardModal(btn.dataset.col));
  });
  el("kanbanCardSaveBtn")?.addEventListener("click", saveKanbanCard);
  el("kanbanCardDeleteBtn")?.addEventListener("click", deleteKanbanCardFromModal);
  el("kanbanCardTitleInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveKanbanCard();
  });
  el("kanbanAiParseBtn")?.addEventListener("click", _kanbanParseAI);
  el("kanbanCardRemindToggle")?.addEventListener("change", (e) => {
    const input = el("kanbanCardRemindInput");
    if (input) input.style.display = e.target.checked ? "" : "none";
    if (e.target.checked) _ensurePermission(["notifications"]); // fire-and-forget
  });

  // ── Reminders widget ────────────────────────────────────────────────────
  el("remindersAddBtn")?.addEventListener("click", () => openReminderModal());
  el("reminderSaveBtn")?.addEventListener("click", saveReminder);
  el("reminderDeleteBtn")?.addEventListener("click", () => {
    if (_reminderEditingId == null) return;
    deleteReminder(_reminderEditingId);
    _reminderEditingId = null;
    closeModal("reminderModal");
  });
  el("reminderTitleInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveReminder();
  });

  // ── Calendar Widget ─────────────────────────────────────────────────────
  el("calPrevBtn")?.addEventListener("click", () => {
    if (!S._calMonth) {
      const t = new Date();
      S._calMonth = { year: t.getFullYear(), month: t.getMonth() };
    }
    S._calMonth.month--;
    if (S._calMonth.month < 0) {
      S._calMonth.month = 11;
      S._calMonth.year--;
    }
    renderCalendarWidget();
  });
  el("calNextBtn")?.addEventListener("click", () => {
    if (!S._calMonth) {
      const t = new Date();
      S._calMonth = { year: t.getFullYear(), month: t.getMonth() };
    }
    S._calMonth.month++;
    if (S._calMonth.month > 11) {
      S._calMonth.month = 0;
      S._calMonth.year++;
    }
    renderCalendarWidget();
  });
  el("addCalEventBtn")?.addEventListener("click", () =>
    openCalEventModal(null),
  );
  el("calGsyncBtn")?.addEventListener("click", handleCalGsyncClick);
  el("saveCalEventBtn")?.addEventListener("click", saveCalEvent);
  el("calEventTitle")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveCalEvent();
  });

  // Schedule type toggles
  document.querySelectorAll(".schedule-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".schedule-type-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const stype = btn.dataset.stype;
      document
        .querySelectorAll(".schedule-field")
        .forEach((f) => f.classList.remove("visible"));
      const sfMap = {
        once: "sfOnce",
        daily: "sfDaily",
        weekly: "sfWeekly",
        custom: "sfCustom",
      };
      el(sfMap[stype])?.classList.add("visible");
    });
  });

  // Custom days: enforce >= 6
  el("calEventCustomDays")?.addEventListener("change", (e) => {
    const v = parseInt(e.target.value);
    if (v < 6) {
      e.target.value = "6";
      el("calEventStatus").textContent = "Minimum 6 days required.";
    } else el("calEventStatus").textContent = "";
  });

  // ── Auth / sync ──────────────────────────────────────────────────────────
  el("signInBtn")?.addEventListener("click", signIn);
  el("syncNowBtn")?.addEventListener("click", () => pushToDrive());
  el("logoutBtn")?.addEventListener("click", signOut);

  // ── Sync popup toggle ────────────────────────────────────────────────────
  el("syncFooterBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const card = el("syncCard");
    if (!card) return;
    if (!card.classList.contains("popup-open")) {
      const wrap = el("sbFooterUserWrap") || e.currentTarget;
      const rect = wrap.getBoundingClientRect();
      card.style.left = rect.left + "px";
      card.style.bottom = window.innerHeight - rect.top + 6 + "px";
    }
    card.classList.toggle("popup-open");
  });
  document.addEventListener("click", (e) => {
    if (!el("sbFooterUserWrap")?.contains(e.target)) {
      el("syncCard")?.classList.remove("popup-open");
    }
  });

  // ── Custom hero color input ──────────────────────────────────────────────
  // Live-preview while dragging (no save/close); commit on final change.
  el("heroColorCustomInput")?.addEventListener("input", (e) => {
    _applyHeroColor(e.target.value, true);
  });
  el("heroColorCustomInput")?.addEventListener("change", (e) => {
    applyHeroColor(e.target.value);
  });
}

// ===== FEATURE 1: HABIT TRACKER =========================================
function renderHabits() {
  const list = el("habitsList");
  if (!list) return;
  if (!S.habits.length) {
    list.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">No habits yet. Create your first habit!</div></div>';
    return;
  }
  const today = _todayKey();
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekDays.push(_dateKey(d));
  }
  list.innerHTML = S.habits
    .map((h) => {
      const streak = _habitStreak(h);
      const dayBtns = weekDays
        .map((day) => {
          const done = (h.completedDates || []).includes(day);
          const label = new Date(day + "T00:00:00").toLocaleDateString("en", {
            weekday: "narrow",
          });
          return `<div class="habit-day ${done ? "done" : ""}" title="${day}" data-action="toggle-habit-day" data-habit-id="${h.id}" data-day="${day}">${label}</div>`;
        })
        .join("");
      return `<div class="habit-row">
      <span class="habit-emoji">${escH(h.emoji || "⭐")}</span>
      <span class="habit-name">${escH(h.name)}</span>
      <span class="habit-streak" title="Current streak">${streak}🔥</span>
      <div class="habit-days">${dayBtns}</div>
      <button class="habit-del" data-action="delete-habit" data-habit-id="${h.id}" title="Delete habit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>`;
    })
    .join("");
}

function _todayKey() {
  return _dateKey(new Date());
}
// Local-calendar-day key (YYYY-MM-DD), matching the Calendar widget's own
// getFullYear()/getMonth()/getDate() date math. Previously used
// toISOString(), which keys by UTC — for any non-UTC-0 user that rolls the
// app's "day" over at a non-midnight local hour every single day, not just
// at rare DST edges, silently misfiling habit check-ins to the wrong date.
function _dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function _habitStreak(h) {
  const done = new Set(h.completedDates || []);
  let streak = 0,
    d = new Date();
  while (done.has(_dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function toggleHabitDay(id, day) {
  const h = S.habits.find((x) => x.id === id);
  if (!h) return;
  if (!h.completedDates) h.completedDates = [];
  const idx = h.completedDates.indexOf(day);
  if (idx >= 0) h.completedDates.splice(idx, 1);
  else h.completedDates.push(day);
  save();
  renderHabits();
}

function deleteHabit(id) {
  S.habits = S.habits.filter((h) => h.id !== id);
  save();
  renderHabits();
}

function saveHabit() {
  const name = el("habitNameInput").value.trim();
  const emoji = el("habitEmojiInput").value.trim() || "⭐";
  if (!name) {
    showToast("Enter a habit name", "error");
    return;
  }
  S.habits.push({ id: Date.now(), name, emoji, completedDates: [] });
  save();
  closeModal("habitModal");
  renderHabits();
  showToast("Habit created!", "success");
  // Fire-and-forget: ask for notifications now (valid gesture context) so
  // daily habit reminders can work; harmless if denied, reminders just
  // won't fire — this action doesn't depend on the outcome.
  _ensurePermission(["notifications"]);
}

// ===== FEATURE 2: READING QUEUE =========================================
function renderReadingQueue() {
  const list = el("readingList");
  if (!list) return;
  if (!S.readingQueue.length) {
    list.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">Your reading queue is empty.</div></div>';
    return;
  }
  list.innerHTML = S.readingQueue
    .map(
      (item) => `
    <div class="reading-item ${item.done ? "done-item" : ""}">
      <div class="reading-favicon">
        <img src="${favSrc(item.url)}" alt="">
      </div>
      <div class="reading-info">
        <div class="reading-title" data-action="open-reading-url" data-url="${escH(item.url)}">${escH(item.title)}</div>
        <div class="reading-url">${escH(getDomain(item.url))}</div>
      </div>
      <button class="reading-done-btn ${item.done ? "done" : ""}" data-action="toggle-reading-done" data-id="${item.id}" title="Mark as read">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
      </button>
      <button class="reading-del" data-action="delete-reading" data-id="${item.id}" title="Remove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`,
    )
    .join("");
}

function toggleReadingDone(id) {
  const item = S.readingQueue.find((x) => x.id === id);
  if (item) {
    item.done = !item.done;
    save();
    renderReadingQueue();
  }
}

function deleteReading(id) {
  S.readingQueue = S.readingQueue.filter((x) => x.id !== id);
  save();
  renderReadingQueue();
}

function saveReading() {
  const title = el("readingTitleInput").value.trim();
  const rawUrl = el("readingUrlInput").value.trim();
  const url = safeUrl(rawUrl);
  if (!url) {
    showToast("Enter a valid http(s) URL", "error");
    return;
  }
  S.readingQueue.unshift({
    id: Date.now(),
    title: title || getDomain(url),
    url,
    done: false,
    addedAt: Date.now(),
  });
  save();
  closeModal("readingModal");
  renderReadingQueue();
  showToast("Added to queue!", "success");
}

// ===== FEATURE 3: TAB SESSION SAVER =====================================
function renderSessions() {
  const list = el("sessionsList");
  if (!list) return;
  if (!S.tabSessions.length) {
    list.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">🖥️</div><div class="empty-state-text">No saved sessions yet.<br>Click "Save Current Tabs" to save your open tabs.</div></div>';
    return;
  }
  list.innerHTML = S.tabSessions
    .map(
      (s) => `
    <div class="session-card">
      <div class="session-header">
        <span class="session-name">${escH(s.name)}</span>
        <span class="session-meta">${s.tabs.length} tabs · ${fmtTimeAgo(s.savedAt)}</span>
        <button class="session-restore-btn" data-action="restore-session" data-id="${s.id}">Open All</button>
        <button class="session-del" data-action="delete-session" data-id="${s.id}" title="Delete session">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="session-tabs-list">
        ${s.tabs
          .slice(0, 8)
          .map(
            (t) => `
          <a href="${escH(safeUrl(t.url) || "#")}" class="session-tab" target="_blank" rel="noopener">
            <img src="${t.favicon || ""}" alt="" width="14" height="14">
            <span class="session-tab-title">${escH(t.title)}</span>
            <span class="session-tab-url">${escH(t.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</span>
          </a>`,
          )
          .join("")}
        ${s.tabs.length > 8 ? `<div class="session-tab" style="color:var(--text-3);cursor:default">+${s.tabs.length - 8} more tabs</div>` : ""}
      </div>
    </div>`,
    )
    .join("");
}

async function saveCurrentSession() {
  try {
    const tabs = await new Promise((res) =>
      chrome.tabs.query({ currentWindow: true }, res),
    );
    const filtered = tabs.filter(
      (t) =>
        !t.url.startsWith("chrome://") &&
        !t.url.startsWith("chrome-extension://"),
    );
    if (!filtered.length) {
      showToast("No saveable tabs found", "error");
      return;
    }
    const name = `Session — ${new Date().toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
    S.tabSessions.unshift({
      id: Date.now(),
      name,
      savedAt: Date.now(),
      tabs: filtered.map((t) => ({
        title: t.title || t.url,
        url: t.url,
        favicon: t.favIconUrl || "",
      })),
    });
    save();
    renderSessions();
    showToast(`Saved ${filtered.length} tabs!`, "success");
  } catch {
    showToast("Could not read tabs", "error");
  }
}

function restoreSession(id) {
  const s = S.tabSessions.find((x) => x.id === id);
  if (!s) return;
  s.tabs.forEach((t) => chrome.tabs.create({ url: t.url, active: false }));
  showToast(`Opening ${s.tabs.length} tabs…`, "success");
}

function deleteSession(id) {
  S.tabSessions = S.tabSessions.filter((x) => x.id !== id);
  save();
  renderSessions();
}

// ===== FEATURE 4: DAILY JOURNAL =========================================
let _journalViewDate = _todayKey();
let _journalViewYear = new Date().getFullYear();
let _journalViewMonth = new Date().getMonth();

function initJournalView() {
  _journalViewDate = _todayKey();
  _journalViewYear = new Date().getFullYear();
  _journalViewMonth = new Date().getMonth();
  renderJournalCal();
  loadJournalEntry(_journalViewDate);
}

function renderJournalCal() {
  const calGrid = el("journalCalGrid");
  const monthLabel = el("journalCalMonth");
  if (!calGrid) return;
  const y = _journalViewYear,
    m = _journalViewMonth;
  monthLabel.textContent = new Date(y, m, 1).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = _todayKey();
  let html = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    .map((d) => `<div class="journal-cal-label">${d}</div>`)
    .join("");
  for (let i = 0; i < first; i++)
    html += `<div class="journal-cal-day other-month"></div>`;
  for (let d = 1; d <= days; d++) {
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cls = [
      "journal-cal-day",
      key === today ? "today" : "",
      key === _journalViewDate ? "selected" : "",
      S.journal[key] ? "has-entry" : "",
    ]
      .filter(Boolean)
      .join(" ");
    html += `<div class="${cls}" data-action="select-journal-day" data-day="${key}">${d}</div>`;
  }
  calGrid.innerHTML = html;
}

function selectJournalDay(key) {
  _journalViewDate = key;
  renderJournalCal();
  loadJournalEntry(key);
}

function loadJournalEntry(key) {
  const entry = S.journal[key] || { text: "", mood: "" };
  const dateLabel = el("journalEditorDate");
  if (dateLabel) {
    const d = new Date(key + "T00:00:00");
    dateLabel.textContent =
      key === _todayKey()
        ? "Today"
        : d.toLocaleDateString("en", {
            weekday: "long",
            month: "long",
            day: "numeric",
          });
  }
  const ta = el("journalTextarea");
  if (ta) {
    ta.value = entry.text || "";
    updateJournalWordCount();
  }
  document.querySelectorAll(".journal-mood-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mood === entry.mood);
  });
}

function updateJournalWordCount() {
  const ta = el("journalTextarea");
  const wc = el("journalWordCount");
  if (!ta || !wc) return;
  const words = ta.value.trim().split(/\s+/).filter(Boolean).length;
  wc.textContent = words + " word" + (words !== 1 ? "s" : "");
}

function saveJournalEntry() {
  const ta = el("journalTextarea");
  if (!ta) return;
  const text = ta.value;
  const mood =
    document.querySelector(".journal-mood-btn.active")?.dataset?.mood || "";
  if (!S.journal[_journalViewDate]) S.journal[_journalViewDate] = {};
  S.journal[_journalViewDate].text = text;
  S.journal[_journalViewDate].mood = mood;
  S.journal[_journalViewDate].updatedAt = Date.now();
  save();
  renderJournalCal();
  showToast("Journal saved", "success");
}

// ===== FEATURE 5: NESTODO BOARD (formerly "Kanban Board") ===============
let _kanbanTargetCol = null;
let _kanbanEditingId = null; // id of the card being edited, or null when adding

function getKanban() {
  return S.kanban;
}

// Nestodo lives in a large modal now (not a routed view) — open it and
// render fresh so it always reflects the current board.
function openNestodoModal() {
  renderKanban();
  openModal("nestodoModal");
}

// Cards with a remindAt sort soonest-first; everything else keeps insertion order.
function _sortByReminder(cards) {
  return [...cards].sort((a, b) => {
    if (a.remindAt && b.remindAt) return a.remindAt - b.remindAt;
    if (a.remindAt) return -1;
    if (b.remindAt) return 1;
    return 0;
  });
}

function _formatReminderBadge(ts) {
  const d = new Date(ts);
  const now = Date.now();
  const overdue = ts < now;
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  const dateStr = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return { text: `${dateStr}, ${timeStr}`, overdue };
}

function _reminderBadgeHtml(card) {
  if (!card.remindAt) return "";
  const { text, overdue } = _formatReminderBadge(card.remindAt);
  return `<span class="reminder-badge${overdue ? " overdue" : ""}">🔔 ${escH(text)}</span>`;
}

function renderKanban() {
  const kb = getKanban();
  ["todo", "doing", "done"].forEach((col) => {
    const cards = _sortByReminder(kb[col] || []);
    const container = el(`kanban-${col}-cards`);
    const count = el(`kanban-${col}-count`);
    if (count) count.textContent = cards.length;
    if (!container) return;
    container.innerHTML = cards
      .map(
        (card) => `
      <div class="kanban-card" draggable="true" data-col="${col}" data-id="${card.id}">
        <div class="kanban-card-title">${escH(card.title)}</div>
        <div class="kanban-card-meta">
          <span>${card.desc ? escH(card.desc) : ""}</span>
          <button class="kanban-card-del" data-action="delete-kanban-card" data-col="${col}" data-id="${card.id}" title="Delete">✕</button>
        </div>
        ${_reminderBadgeHtml(card)}
      </div>`,
      )
      .join("");
    container.querySelectorAll(".kanban-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".kanban-card-del")) return;
        openKanbanCardModal(card.dataset.col, Number(card.dataset.id));
      });
      card.addEventListener("dragstart", (e) => {
        S._kanbanDragCard = {
          col: card.dataset.col,
          id: Number(card.dataset.id),
        };
        setTimeout(() => card.classList.add("dragging"), 0);
      });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));
    });
  });
  ["todo", "doing", "done"].forEach((col) => {
    const container = el(`kanban-${col}-cards`);
    if (!container) return;
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      container.classList.add("kanban-drop-zone", "over");
    });
    container.addEventListener("dragleave", () =>
      container.classList.remove("kanban-drop-zone", "over"),
    );
    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.classList.remove("kanban-drop-zone", "over");
      if (!S._kanbanDragCard) return;
      const { col: fromCol, id } = S._kanbanDragCard;
      const kb = getKanban();
      const idx = (kb[fromCol] || []).findIndex((c) => c.id === id);
      if (idx < 0) return;
      const [card] = kb[fromCol].splice(idx, 1);
      if (!kb[col]) kb[col] = [];
      kb[col].push(card);
      S._kanbanDragCard = null;
      save();
      renderKanban();
      renderKanbanDash();
    });
  });
}

function openKanbanCardModal(col, cardId = null) {
  _kanbanTargetCol = col;
  _kanbanEditingId = cardId;
  const card = cardId != null ? (getKanban()[col] || []).find((c) => c.id === cardId) : null;
  el("kanbanCardModalTitle").textContent = card
    ? "Edit Card"
    : col === "todo"
      ? "Add To-Do"
      : col === "doing"
        ? "Add In-Progress Card"
        : "Add Done Card";
  el("kanbanCardTitleInput").value = card?.title || "";
  el("kanbanCardDescInput").value = card?.desc || "";
  const remindToggle = el("kanbanCardRemindToggle");
  const remindInput = el("kanbanCardRemindInput");
  if (remindToggle) remindToggle.checked = !!card?.remindAt;
  if (remindInput) {
    remindInput.style.display = card?.remindAt ? "" : "none";
    remindInput.value = card?.remindAt ? _toDatetimeLocal(card.remindAt) : "";
  }
  const deleteBtn = el("kanbanCardDeleteBtn");
  if (deleteBtn) deleteBtn.style.display = card ? "" : "none";
  if (el("kanbanAiInput")) el("kanbanAiInput").value = "";
  if (el("kanbanAiResult")) { el("kanbanAiResult").style.display = "none"; el("kanbanAiResult").innerHTML = ""; }
  openModal("kanbanCardModal");
  // Show AI section only for a fresh card, and only if AI is enabled
  const aiSection = el("kanbanAiSection");
  if (aiSection) aiSection.style.display = !card && S.settings.ai?.enabled ? "" : "none";
  el("kanbanCardSaveBtn").textContent = card ? "Save Card" : "Add Card";
  setTimeout(() => (!card && S.settings.ai?.enabled ? el("kanbanAiInput")?.focus() : el("kanbanCardTitleInput")?.focus()), 80);
}

function _toDatetimeLocal(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function _kanbanParseAI() {
  const input = el("kanbanAiInput")?.value.trim();
  if (!input) { showToast("Enter a task description first", "error"); return; }
  if (!S.settings.ai?.enabled) { showToast("Enable AI in Settings first", "error"); return; }

  const btn = el("kanbanAiParseBtn");
  const result = el("kanbanAiResult");
  btn.disabled = true;
  btn.textContent = "Parsing…";
  result.style.display = "";
  result.innerHTML = '<div class="kanban-ai-loading">Analyzing tasks…</div>';

  const systemPrompt = `You are a task extraction assistant. Extract discrete actionable tasks from the user's input.
Return ONLY a JSON array. Each item must have: "title" (short, max 60 chars), "desc" (1-2 sentences of detail, or empty string).
Return between 1 and 8 tasks. No markdown fences, no explanation. Just the JSON array.
Example: [{"title":"Set up database schema","desc":"Create PostgreSQL tables for users and sessions."},{"title":"Build login page","desc":"Email/password form with validation and error states."}]`;

  try {
    const response = await aiComplete(input, {
      system: systemPrompt,
      maxTokens: 800,
    });

    let tasks;
    try {
      const jsonStr = response.replace(/```json?|```/g, "").trim();
      tasks = JSON.parse(jsonStr);
      if (!Array.isArray(tasks)) throw new Error("not an array");
    } catch {
      throw new Error("AI returned unexpected format. Try rephrasing.");
    }

    if (!tasks.length) {
      result.innerHTML = '<div class="kanban-ai-empty">No tasks found. Try adding more detail.</div>';
      return;
    }

    result.innerHTML = `
      <div class="kanban-ai-tasks-header">
        Found ${tasks.length} task${tasks.length > 1 ? "s" : ""} — click to add individual cards, or add all at once:
      </div>
      <div class="kanban-ai-tasks-list" id="kanbanAiTasksList">
        ${tasks.map((t, i) => `
          <div class="kanban-ai-task-item" data-idx="${i}">
            <div class="kanban-ai-task-check">
              <input type="checkbox" id="kait_${i}" checked>
            </div>
            <div class="kanban-ai-task-body">
              <div class="kanban-ai-task-title">${escH(t.title)}</div>
              ${t.desc ? `<div class="kanban-ai-task-desc">${escH(t.desc)}</div>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
      <div class="kanban-ai-actions">
        <button class="kanban-ai-add-btn" id="kanbanAiAddSelectedBtn">Add Selected Cards</button>
        <button class="kanban-ai-add-one-btn" id="kanbanAiAddFirstBtn">Fill Manual Form</button>
      </div>
    `;

    // Store parsed tasks for use by buttons
    result._parsedTasks = tasks;

    el("kanbanAiAddSelectedBtn").addEventListener("click", () => {
      const checks = result.querySelectorAll('input[type="checkbox"]:checked');
      if (!checks.length) { showToast("Select at least one task", "error"); return; }
      const kb = getKanban();
      if (!kb[_kanbanTargetCol]) kb[_kanbanTargetCol] = [];
      checks.forEach((cb) => {
        const idx = parseInt(cb.id.replace("kait_", ""));
        const t = tasks[idx];
        if (t) kb[_kanbanTargetCol].push({ id: Date.now() + idx, title: t.title, desc: t.desc || "", createdAt: Date.now(), remindAt: null, notified: false });
      });
      save();
      closeModal("kanbanCardModal");
      renderKanban();
      renderKanbanDash();
      showToast(`Added ${checks.length} card${checks.length > 1 ? "s" : ""} to ${_kanbanTargetCol}`, "success");
    });

    el("kanbanAiAddFirstBtn").addEventListener("click", () => {
      const first = tasks[0];
      if (first) {
        el("kanbanCardTitleInput").value = first.title;
        el("kanbanCardDescInput").value = first.desc || "";
        el("kanbanCardTitleInput").focus();
      }
    });

  } catch (err) {
    result.innerHTML = `<div class="kanban-ai-error">${escH(err.message || "AI parse failed. Check your API key in Settings.")}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Parse with AI';
  }
}

function saveKanbanCard() {
  const title = el("kanbanCardTitleInput").value.trim();
  if (!title) {
    showToast("Enter a card title", "error");
    return;
  }
  const desc = el("kanbanCardDescInput").value.trim();
  const remindOn = !!el("kanbanCardRemindToggle")?.checked;
  const remindVal = el("kanbanCardRemindInput")?.value;
  if (remindOn && !remindVal) {
    showToast("Pick a date and time for the reminder, or turn it off", "error");
    return;
  }
  const remindAt = remindOn ? new Date(remindVal).getTime() : null;
  if (remindOn) _ensurePermission(["notifications"]); // fire-and-forget, harmless if denied

  const kb = getKanban();
  if (!kb[_kanbanTargetCol]) kb[_kanbanTargetCol] = [];

  if (_kanbanEditingId != null) {
    const card = kb[_kanbanTargetCol].find((c) => c.id === _kanbanEditingId);
    if (card) {
      card.title = title;
      card.desc = desc;
      if (card.remindAt !== remindAt) card.notified = false;
      card.remindAt = remindAt;
    }
  } else {
    kb[_kanbanTargetCol].push({
      id: Date.now(),
      title,
      desc,
      createdAt: Date.now(),
      remindAt,
      notified: false,
    });
  }
  _kanbanEditingId = null;
  save();
  closeModal("kanbanCardModal");
  renderKanban();
  renderKanbanDash();
}

function deleteKanbanCardFromModal() {
  if (_kanbanEditingId == null) return;
  deleteKanbanCard(_kanbanTargetCol, _kanbanEditingId);
  _kanbanEditingId = null;
  closeModal("kanbanCardModal");
}

function deleteKanbanCard(col, id) {
  const kb = getKanban();
  const card = (kb[col] || []).find((c) => c.id === id);
  if (card) {
    S.trash.push({
      id: card.id,
      text: card.title,
      done: col === "done",
      _type: "task",
      _deletedAt: Date.now(),
    });
  }
  kb[col] = (kb[col] || []).filter((c) => c.id !== id);
  save();
  renderKanban();
  renderKanbanDash();
  renderTrash();
}

// ===== HERO WALLPAPER ===================================================
const HERO_COLORS = [
  // Reds
  { hex: "#7f1d1d", name: "Deep red" },
  { hex: "#b91c1c", name: "Red" },
  { hex: "#ef4444", name: "Bright red" },
  // Greens
  { hex: "#14532d", name: "Deep green" },
  { hex: "#15803d", name: "Green" },
  { hex: "#22c55e", name: "Bright green" },
  // Oranges
  { hex: "#7c2d12", name: "Deep orange" },
  { hex: "#c2410c", name: "Orange" },
  { hex: "#f97316", name: "Bright orange" },
  // Blacks / dark
  { hex: "#000000", name: "Pure black" },
  { hex: "#111111", name: "Near black" },
  { hex: "#1d2021", name: "Gruvbox dark" },
];

async function loadHeroBg() {
  const stored = S.settings.heroBg;
  if (stored && stored.startsWith("data:")) {
    _applyHeroBgImage(stored, true);
    el("resetWallpaperBtn")?.style.setProperty("display", "flex");
    _buildColorPalette();
    return;
  }
  if (stored && stored.startsWith("color:")) {
    _applyHeroColor(stored.slice(6), false);
    el("resetWallpaperBtn")?.style.setProperty("display", "flex");
    _buildColorPalette();
    return;
  }
  _buildColorPalette();
  if (window._heroBgSessionCache) {
    _applyHeroBgImage(window._heroBgSessionCache);
    return;
  }
  await fetchRandomWallpaper();
}

function _buildColorPalette() {
  const palette = el("heroColorPalette");
  if (!palette) return;
  const current = S.settings.heroBg?.startsWith("color:")
    ? S.settings.heroBg.slice(6)
    : null;
  // Build swatches then re-append the custom color row that's already in HTML
  const customRow = palette.querySelector(".hero-color-custom-row");
  palette.innerHTML = HERO_COLORS.map(
    (c) => `
    <div class="hero-color-swatch ${c.hex === current ? "active" : ""}"
         style="background:${c.hex}"
         title="${c.name}"
         data-action="apply-hero-color" data-hex="${c.hex}"></div>`,
  ).join("");
  if (customRow) palette.appendChild(customRow);
  // Update custom input value to current color if applicable
  if (current) {
    const customInput = palette.querySelector(".hero-color-custom-input");
    if (customInput && /^#[0-9a-fA-F]{6}$/.test(current))
      customInput.value = current;
  }
}

function applyHeroColor(hex) {
  S.settings.heroBg = "color:" + hex;
  save();
  _applyHeroColor(hex, true);
  closeModal("heroColorModal");
  _buildColorPalette();
  syncWallpaperNow();
}

function _applyHeroColor(hex, showReset = true) {
  const bgEl = el("heroBgImg");
  if (bgEl) {
    bgEl.style.backgroundImage = "none";
    bgEl.style.backgroundColor = hex;
    bgEl.style.opacity = "1";
  }
  if (showReset) el("resetWallpaperBtn")?.style.setProperty("display", "flex");
}

async function fetchRandomWallpaper() {
  const bgEl = el("heroBgImg");
  if (!bgEl) return;
  // Show low-res gradient while loading
  bgEl.style.backgroundImage =
    "linear-gradient(160deg, #1d2021 0%, #282828 60%, #32302f 100%)";
  bgEl.style.opacity = "1";

  // Preload image before applying
  const url = `https://picsum.photos/seed/${Date.now()}-${Math.floor(Math.random() * 1e6)}/1920/1080`;
  const img = new Image();
  img.onload = () => {
    window._heroBgSessionCache = url;
    _applyHeroBgImage(url);
  };
  img.onerror = () => {
    bgEl.style.backgroundImage =
      "linear-gradient(160deg, #1d2021 0%, #282828 60%, #32302f 100%)";
    showToast("Couldn't load a new wallpaper — try again", "error");
  };
  img.src = url;
}

function _applyHeroBgImage(url, isCustom = false) {
  const bgEl = el("heroBgImg");
  if (!bgEl) return;
  bgEl.style.backgroundImage = `url("${url}")`;
  bgEl.style.opacity = "1";
  // Show reset button only for custom uploads
  const resetBtn = el("resetWallpaperBtn");
  if (resetBtn) resetBtn.style.display = isCustom ? "flex" : "none";
}

function refreshWallpaper() {
  // Only refresh if not using custom upload
  if (S.settings.heroBg?.startsWith("data:")) return;
  window._heroBgSessionCache = null;
  fetchRandomWallpaper();
  showToast("Loading new wallpaper…", "info");
}

function uploadWallpaper() {
  el("heroBgUploadInput")?.click();
}

async function handleWallpaperUpload(file) {
  if (!file || !file.type.startsWith("image/")) return;
  // Resize to max 1920px wide before storing
  const dataUrl = await _resizeImageFile(file, 1920, 1080);
  S.settings.heroBg = dataUrl;
  save();
  _applyHeroBgImage(dataUrl, true);
  showToast("Wallpaper updated!", "success");
  syncWallpaperNow();
}

function resetWallpaper() {
  S.settings.heroBg = null;
  save();
  el("resetWallpaperBtn")?.style.setProperty("display", "none");
  window._heroBgSessionCache = null;
  fetchRandomWallpaper();
  showToast("Wallpaper reset to random", "success");
  syncWallpaperNow();
}

// Push the new wallpaper to Drive immediately, bypassing the normal debounce,
// so it's available on other devices right away.
function syncWallpaperNow() {
  if (!S.googleUser) return;
  clearTimeout(Drive._syncTimer);
  pushToDrive();
}

function _resizeImageFile(file, maxW, maxH) {
  return new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        res(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ===== GOOGLE CALENDAR (read-only) ====================================
// Reuses the existing Google sign-in session — chrome.identity.getAuthToken()
// returns one token covering every scope in manifest.json's oauth2.scopes,
// so once "calendar.events.readonly" is added there alongside the Drive scopes,
// signing in for Drive sync also grants calendar read access. No separate
// "connect Calendar" OAuth flow needed; connection state IS S.googleUser.
let _gcalFetching = false;
let _gcalRefreshTimer = null;

async function fetchGoogleCalendarEvents(interactive = false) {
  if (!IS_CHROME || !S.googleUser || _gcalFetching) return;
  _gcalFetching = true;
  S._gcalStatus = "loading";
  renderCalSyncStatus();
  try {
    if (!navigator.onLine) {
      S._gcalStatus = S.googleCalEvents.length ? "offline" : "error";
      S._gcalError = "You're offline";
      return;
    }
    const token = await getAuthToken(interactive);
    if (!token) {
      S._gcalStatus = "unauthorized";
      S._gcalError = null;
      return;
    }
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 7);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 60);
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${encodeURIComponent(timeMin.toISOString())}` +
      `&timeMax=${encodeURIComponent(timeMax.toISOString())}` +
      `&singleEvents=true&orderBy=startTime&maxResults=100`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const data = await r.json();
      S.googleCalEvents = (data.items || [])
        .filter((ev) => ev.status !== "cancelled" && (ev.start?.date || ev.start?.dateTime))
        .map((ev) => ({
          id: ev.id,
          title: ev.summary || "(untitled)",
          date: ev.start.date || ev.start.dateTime.slice(0, 10),
          allDay: !!ev.start.date,
          link: ev.htmlLink || null,
        }));
      S._gcalStatus = "connected";
      S._gcalError = null;
      S._gcalLastSync = Date.now();
      save();
    } else if (r.status === 401) {
      await _forgetToken(token);
      S._gcalStatus = "unauthorized";
      S._gcalError = null;
    } else if (r.status === 403) {
      S._gcalStatus = "unauthorized";
      S._gcalError = "Calendar permission missing — sign out then back in.";
    } else {
      const err = await r.json().catch(() => ({}));
      S._gcalStatus = S.googleCalEvents.length ? "offline" : "error";
      S._gcalError = err?.error?.message || `Calendar error ${r.status}`;
    }
  } catch {
    S._gcalStatus = S.googleCalEvents.length ? "offline" : "error";
    S._gcalError = "Network error";
  } finally {
    _gcalFetching = false;
    renderCalendarWidget(); // also refreshes the sync status button
  }
}

function _gcalStartAutoRefresh() {
  clearInterval(_gcalRefreshTimer);
  _gcalRefreshTimer = setInterval(() => {
    if (S.googleUser) fetchGoogleCalendarEvents(false);
  }, 15 * 60 * 1000); // 15 min — Calendar isn't push-updated here, poll lightly
}

function renderCalSyncStatus() {
  const btn = el("calGsyncBtn");
  if (!btn) return;
  const spinner = el("calGsyncSpinner");
  const icon = el("calGsyncIcon");
  btn.classList.remove("gcal-connected", "gcal-unauthorized", "gcal-error", "gcal-offline", "gcal-disconnected");
  if (!S.googleUser) {
    btn.classList.add("gcal-disconnected");
    btn.dataset.tip = "Connect Google Calendar";
  } else if (S._gcalStatus === "connected") {
    btn.classList.add("gcal-connected");
    const t = S._gcalLastSync ? new Date(S._gcalLastSync).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
    btn.dataset.tip = t ? `Google Calendar synced ${t}` : "Google Calendar synced";
  } else if (S._gcalStatus === "unauthorized") {
    btn.classList.add("gcal-unauthorized");
    btn.dataset.tip = "Reconnect Google Calendar";
  } else if (S._gcalStatus === "offline") {
    btn.classList.add("gcal-offline");
    btn.dataset.tip = `Showing cached events — ${S._gcalError || "offline"}`;
  } else if (S._gcalStatus === "error") {
    btn.classList.add("gcal-error");
    btn.dataset.tip = S._gcalError || "Couldn't load Google Calendar";
  } else {
    btn.classList.add("gcal-disconnected");
    btn.dataset.tip = "Connect Google Calendar";
  }
  const loading = S._gcalStatus === "loading";
  if (spinner) spinner.style.display = loading ? "" : "none";
  if (icon) icon.style.display = loading ? "none" : "";
}

function handleCalGsyncClick() {
  // signIn() already triggers fetchGoogleCalendarEvents() itself on success.
  if (!S.googleUser) { signIn(); return; }
  fetchGoogleCalendarEvents(S._gcalStatus === "unauthorized");
}

// ===== CALENDAR WIDGET ================================================
function renderCalendarWidget() {
  renderCalSyncStatus();
  const today = new Date();
  if (!S._calMonth)
    S._calMonth = { year: today.getFullYear(), month: today.getMonth() };
  const { year, month } = S._calMonth;

  // Month label
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthEl = el("calMonthLabel");
  if (monthEl) monthEl.textContent = `${monthNames[month]} ${year}`;

  // Build grid
  const grid = el("calGrid");
  if (!grid) return;
  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  let html = DAY_LABELS.map(
    (d) => `<div class="cal-day-label">${d}</div>`,
  ).join("");
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++)
    html += `<div class="cal-day empty"></div>`;
  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const hasEvent = calHasEvent(dateStr);
    html += `<div class="cal-day${isToday ? " today" : ""}${hasEvent ? " has-event" : ""}" data-date="${dateStr}">${d}</div>`;
  }
  grid.innerHTML = html;

  // Click on day to add event
  grid.querySelectorAll(".cal-day[data-date]").forEach((d) => {
    d.addEventListener("click", () => openCalEventModal(d.dataset.date));
  });

  // Render events for current month
  renderCalEventsList(year, month);
}

function calHasEvent(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  if (S.calEvents.some((ev) => calEventOccursOn(ev, d))) return true;
  return (S.googleCalEvents || []).some((ev) => ev.date === dateStr);
}

function calEventOccursOn(ev, date) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (ev.type === "once") return ev.date === dateStr;
  if (ev.type === "daily") return new Date(ev.date + "T00:00:00") <= date;
  if (ev.type === "weekly")
    return (
      date.getDay() === Number(ev.weekday) &&
      new Date(ev.date + "T00:00:00") <= date
    );
  if (ev.type === "custom") {
    const start = new Date(ev.date + "T00:00:00");
    if (date < start) return false;
    const diff = Math.round((date - start) / 86400000);
    return diff % Number(ev.customDays) === 0;
  }
  return false;
}

function renderCalEventsList(year, month) {
  const listEl = el("calEventsList");
  if (!listEl) return;
  // Show events for the selected month's current/future days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const upcoming = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date < today) continue;
    S.calEvents.forEach((ev) => {
      if (calEventOccursOn(ev, date)) upcoming.push({ ev, date, source: "local" });
    });
  }
  (S.googleCalEvents || []).forEach((ev) => {
    const [y, m, day] = ev.date.split("-").map(Number);
    const date = new Date(y, m - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month && date >= today) {
      upcoming.push({ ev, date, source: "google" });
    }
  });
  upcoming.sort((a, b) => a.date - b.date);
  const shown = upcoming.slice(0, 5);
  if (!shown.length) {
    // Loading/error/offline get their own explanation; a genuinely empty
    // month (nothing local, nothing from Google) gets the plain empty state.
    if (S._gcalStatus === "loading") {
      listEl.innerHTML = `<div class="cal-events-status"><div class="spinner spinner-sm"></div><span>Loading Google Calendar…</span></div>`;
    } else if (S._gcalStatus === "error" && S.googleUser) {
      listEl.innerHTML = `<div class="cal-events-status cal-events-status-error">
        <span>${escH(S._gcalError || "Couldn't load Google Calendar")}</span>
        <button class="cal-events-retry-btn" data-action="gcal-retry">Retry</button>
      </div>`;
    } else if (S._gcalStatus === "unauthorized" && S.googleUser) {
      listEl.innerHTML = `<div class="cal-events-status cal-events-status-error">
        <span>Google Calendar needs reconnecting</span>
        <button class="cal-events-retry-btn" data-action="gcal-retry">Reconnect</button>
      </div>`;
    } else {
      listEl.innerHTML = `<div class="cal-events-status">No upcoming events this month</div>`;
    }
    return;
  }
  listEl.innerHTML = shown
    .map(
      ({ ev, date, source }) =>
        `<div class="cal-event-item">
      <div class="cal-event-dot${source === "google" ? " google" : ""}"></div>
      <span class="cal-event-text">${escH(ev.title)}</span>
      <span style="font-size:10px;color:var(--text-3);flex-shrink:0">${date.getDate()}/${date.getMonth() + 1}</span>
      ${
        source === "local"
          ? `<button class="cal-event-del" data-action="delete-cal-event" data-id="${ev.id}">✕</button>`
          : `<span class="cal-event-src" title="From Google Calendar">G</span>`
      }
    </div>`,
    )
    .join("");
}

function openCalEventModal(dateStr) {
  el("calEventModalTitle").textContent = dateStr
    ? `Add Event — ${dateStr}`
    : "Add Event";
  el("calEventTitle").value = "";
  el("calEventDate").value = dateStr || _dateKey(new Date());
  el("calEventStatus").textContent = "";
  // Reset schedule type to 'once'
  document
    .querySelectorAll(".schedule-type-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.stype === "once"));
  document
    .querySelectorAll(".schedule-field")
    .forEach((f) => f.classList.toggle("visible", f.id === "sfOnce"));
  openModal("calEventModal");
  setTimeout(() => el("calEventTitle").focus(), 80);
}

function saveCalEvent() {
  const title = el("calEventTitle").value.trim();
  if (!title) {
    el("calEventStatus").textContent = "Enter an event title.";
    return;
  }

  const activeType =
    document.querySelector(".schedule-type-btn.active")?.dataset.stype ||
    "once";
  const dateVal = el("calEventDate").value;

  if (activeType === "once" || activeType === "daily") {
    if (!dateVal) {
      el("calEventStatus").textContent = "Pick a date.";
      return;
    }
  }

  let customDays = 0;
  if (activeType === "custom") {
    customDays = parseInt(el("calEventCustomDays").value) || 0;
    if (customDays < 6) {
      el("calEventStatus").textContent = "Custom days must be 6 or more.";
      return;
    }
  }

  const weekday =
    activeType === "weekly" ? Number(el("calEventWeekday").value) : null;
  const startDate = dateVal || _dateKey(new Date());

  S.calEvents.push({
    id: Date.now(),
    title,
    date: startDate,
    type: activeType,
    weekday,
    customDays,
  });
  save();
  closeModal("calEventModal");
  renderCalendarWidget();
  showToast("Event added", "success");
}

function deleteCalEvent(id) {
  S.calEvents = S.calEvents.filter((e) => e.id !== id);
  save();
  renderCalendarWidget();
}

// ===== AUTHENTICATION — LOGOUT =========================================
// signOut is defined above in the Drive sync block

// ===== SIDEBAR ADD LINK LISTENERS ======================================
// (wired in setupEventListeners)

// Make functions global (needed for inline onclick)
window.openFolderModal = openFolderModal;
window.toggleBmFolder = toggleBmFolder;
window.closeModal = closeModal;
window.openNoteEdit = openNoteEdit;
window.deleteNoteById = deleteNoteById;
window.removeQA = removeQA;
window.restoreItem = restoreItem;
window.hideSearch = hideSearch;
window.openCmdPalette = openCmdPalette;
window.closeCmdPalette = closeCmdPalette;
window.navigateTo = navigateTo;
window.showToast = showToast;
window.openWeatherLocationModal = openWeatherLocationModal;
window.openAddBookmarkModal = openAddBookmarkModal;
window.openEditBookmarkModal = openEditBookmarkModal;
window.deleteChromeBm = deleteChromeBm;
window.openAddFolderModal = openAddFolderModal;
window.openEditFolderModal = openEditFolderModal;
window.deleteChromeFolder = deleteChromeFolder;
window.removeWsBm = removeWsBm;
window.openWsBmChooser = openWsBmChooser;
window.openWsFolderEditModal = openWsFolderEditModal;
window.openWsBookmarkEditModal = openWsBookmarkEditModal;
window.removeWsFolder = removeWsFolder;
// New feature globals
window.openSbAddLink = openSbAddLink;
window.toggleHabitDay = toggleHabitDay;
window.deleteHabit = deleteHabit;
window.toggleReadingDone = toggleReadingDone;
window.deleteReading = deleteReading;
window.restoreSession = restoreSession;
window.deleteSession = deleteSession;
window.selectJournalDay = selectJournalDay;
window.deleteKanbanCard = deleteKanbanCard;
window.refreshWallpaper = refreshWallpaper;
window.uploadWallpaper = uploadWallpaper;
window.resetWallpaper = resetWallpaper;
window.applyHeroColor = applyHeroColor;
window.deleteCalEvent = deleteCalEvent;
window.signOut = signOut;
window.signIn = signIn;
window.pushToDrive = pushToDrive;
window.pullFromDrive = pullFromDrive;
