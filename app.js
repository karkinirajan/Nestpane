"use strict";
// =============================================
//  novatab — app.js
//  Author: kneeraazon.com
// =============================================

// OAuth 2.0 credentials — Web application type (client_secret required for token exchange)
const GOOGLE_CLIENT_ID =
  "1068722184119-5oo9t1q96u9r6ccb3gd02nm6jbp9ekq1.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

// ===== CHROME API WRAPPER =====
const IS_CHROME = typeof chrome !== "undefined" && !!chrome.runtime?.id;

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
    new Promise((res) => {
      if (IS_CHROME && chrome.storage) {
        chrome.storage.local.set(data, res);
      } else {
        Object.entries(data).forEach(([k, v]) =>
          localStorage.setItem("ftL_" + k, JSON.stringify(v)),
        );
        res();
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

// ===== DEFAULT DATA =====
const DEFAULT_WORKSPACES = [
  { id: 1, name: "Home", icon: "🏠" },
  { id: 2, name: "AI", icon: "🤖" },
  { id: 3, name: "Dev", icon: "💻" },
];

const DEFAULT_WS_DATA = (id) => {
  if (id === 1)
    return {
      quickAccess: [
        // AI
        { id: 101, name: "Claude",         url: "https://claude.ai" },
        { id: 102, name: "ChatGPT",        url: "https://chat.openai.com" },
        { id: 103, name: "Gemini",         url: "https://gemini.google.com" },
        { id: 104, name: "Perplexity",     url: "https://perplexity.ai" },
        { id: 105, name: "Cursor",         url: "https://cursor.com" },
        { id: 106, name: "Bolt",           url: "https://bolt.new" },
        // Dev
        { id: 107, name: "GitHub",         url: "https://github.com" },
        { id: 108, name: "Vercel",         url: "https://vercel.com" },
        { id: 109, name: "Supabase",       url: "https://supabase.com" },
        { id: 110, name: "Cloudflare",     url: "https://cloudflare.com" },
        { id: 111, name: "Docker Hub",     url: "https://hub.docker.com" },
        { id: 112, name: "Linear",         url: "https://linear.app" },
        { id: 113, name: "Stripe",         url: "https://stripe.com" },
        { id: 114, name: "DEV.to",         url: "https://dev.to" },
        { id: 115, name: "Stack Overflow", url: "https://stackoverflow.com" },
        { id: 116, name: "Postman",        url: "https://postman.com" },
        // Frameworks & docs
        { id: 117, name: "Python",         url: "https://python.org" },
        { id: 118, name: "Django",         url: "https://djangoproject.com" },
        { id: 120, name: "FastAPI",        url: "https://fastapi.tiangolo.com" },
        { id: 121, name: "Rust",           url: "https://rust-lang.org" },
        { id: 122, name: "React",          url: "https://react.dev" },
        { id: 123, name: "Next.js",        url: "https://nextjs.org" },
        { id: 124, name: "Tailwind",       url: "https://tailwindcss.com" },
        // Productivity & tools
        { id: 125, name: "Notion",         url: "https://notion.so" },
        { id: 127, name: "Readwise",       url: "https://readwise.io" },
        { id: 128, name: "Raindrop",       url: "https://raindrop.io" },
        { id: 130, name: "Upwork",         url: "https://upwork.com" },
        { id: 131, name: "ProductHunt",    url: "https://producthunt.com" },
        { id: 132, name: "Mobbin",         url: "https://mobbin.com" },
        { id: 133, name: "n8n",            url: "https://n8n.io" },
        { id: 134, name: "Hamro Patro",    url: "https://hamropatro.com" },
        // Socials
        { id: 138, name: "Twitter / X",    url: "https://x.com" },
        { id: 139, name: "LinkedIn",       url: "https://linkedin.com/feed" },
        { id: 140, name: "Instagram",      url: "https://instagram.com" },
        { id: 141, name: "Reddit",         url: "https://reddit.com" },
        { id: 142, name: "Discord",        url: "https://discord.com/app" },
        { id: 143, name: "YouTube",        url: "https://youtube.com" },
        // Google
        { id: 135, name: "Gmail",          url: "https://mail.google.com" },
        { id: 136, name: "Drive",          url: "https://drive.google.com" },
        { id: 137, name: "Calendar",       url: "https://calendar.google.com" },
        { id: 144, name: "Docs",           url: "https://docs.google.com" },
      ],
      notes: [
        {
          id: 1001,
          title: "Project Ideas",
          content:
            "Build a personal dashboard with weather, notes, and quick-access shortcuts.\nConsider adding a Kanban board and habit tracker integration for daily use.",
          tags: ["ideas", "dev"],
          pinned: true,
          createdAt: Date.now() - 86400000 * 4,
        },
        {
          id: 1002,
          title: "Meeting Notes — Product Sync",
          content:
            "Discussed roadmap for Q3. Key actions:\n• Wireframes ready by Friday\n• API spec review by end of week\n• Confirm stakeholder sign-off on scope",
          tags: ["work", "meetings"],
          pinned: false,
          createdAt: Date.now() - 86400000 * 3,
        },
        {
          id: 1003,
          title: "Books to Read in 2025",
          content:
            "1. Atomic Habits — James Clear\n2. Deep Work — Cal Newport\n3. The Pragmatic Programmer\n4. Clean Code — Robert Martin\n5. Designing Data-Intensive Applications",
          tags: ["reading", "personal"],
          pinned: false,
          createdAt: Date.now() - 86400000 * 2,
        },
        {
          id: 1004,
          title: "Dev Environment Setup",
          content:
            "Node 20 LTS, pnpm 9, VS Code\nExtensions: Prettier, ESLint, GitLens, Error Lens\nTerminal: zsh + starship prompt + fzf",
          tags: ["dev", "setup"],
          pinned: false,
          createdAt: Date.now() - 86400000,
        },
        {
          id: 1005,
          title: "Travel Packing Checklist",
          content:
            "Passport, charger, USB-C adapter, earbuds, power bank, toiletries bag. Print boarding pass night before. Notify bank before departure.",
          tags: ["personal", "travel"],
          pinned: false,
          createdAt: Date.now() - 3600000 * 6,
        },
        {
          id: 1006,
          title: "Weekly Review Template",
          content:
            "✅ What went well this week?\n🔍 What needs improvement?\n🎯 Top 3 priorities for next week\n⚡ Energy level: ___/10\n📚 What did I learn?",
          tags: ["productivity"],
          pinned: false,
          createdAt: Date.now() - 1800000,
        },
      ],
      tasks: [
        { id: 2001, text: "Review and merge open pull requests", done: false },
        {
          id: 2002,
          text: "Update project dependencies to latest stable versions",
          done: false,
        },
        {
          id: 2003,
          text: "Write unit tests for the authentication module",
          done: false,
        },
        { id: 2004, text: "Send weekly status report to the team", done: true },
        {
          id: 2005,
          text: "Fix navigation layout bug on mobile viewport",
          done: false,
        },
        {
          id: 2006,
          text: "Document design system color tokens in Notion",
          done: true,
        },
      ],
      folders: [{ name: "Google" }, { name: "Social Media" }],
      importedBookmarks: [
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
      ],
    };
  if (id === 2)
    return {
      quickAccess: [
        // Chatbots
        { id: 201, name: "Claude", url: "https://claude.ai" },
        { id: 202, name: "ChatGPT", url: "https://chat.openai.com" },
        { id: 203, name: "Gemini", url: "https://gemini.google.com" },
        { id: 204, name: "Perplexity", url: "https://perplexity.ai" },
        { id: 205, name: "Grok", url: "https://grok.com" },
        { id: 206, name: "DeepSeek", url: "https://chat.deepseek.com" },
        // AI dev
        { id: 207, name: "Cursor", url: "https://cursor.com" },
        { id: 208, name: "Bolt", url: "https://bolt.new" },
        { id: 209, name: "Copilot", url: "https://copilot.microsoft.com" },
        { id: 210, name: "v0", url: "https://v0.dev" },
        { id: 211, name: "Hugging Face", url: "https://huggingface.co" },
        { id: 212, name: "Pieces", url: "https://pieces.app" },
        { id: 213, name: "Exa", url: "https://exa.ai" },
        // Creative AI
        { id: 214, name: "ElevenLabs", url: "https://elevenlabs.io" },
        { id: 215, name: "Leonardo", url: "https://leonardo.ai" },
        { id: 216, name: "Pika", url: "https://pika.art" },
        { id: 217, name: "Midjourney", url: "https://midjourney.com" },
        { id: 218, name: "Runway", url: "https://runwayml.com" },
        // Automation
        { id: 219, name: "n8n", url: "https://n8n.io" },
      ],
      notes: [
        {
          id: 2101,
          title: "Prompt Engineering Tips",
          content:
            "Be specific about format, audience, and constraints.\nGive examples (few-shot) for tricky output formats.\nAsk the model to think step-by-step before answering for reasoning tasks.\nIterate: refine the prompt based on what the first response gets wrong.",
          tags: ["ai", "prompts"],
          pinned: true,
          createdAt: Date.now() - 86400000 * 4,
        },
        {
          id: 2102,
          title: "Useful AI Tools by Category",
          content:
            "Chat: Claude, ChatGPT, Gemini, Perplexity\nCoding: Cursor, Copilot, v0, Bolt\nImage: Midjourney, Leonardo, Stable Diffusion\nVideo & audio: Runway, Pika, ElevenLabs\nResearch: Hugging Face, Exa",
          tags: ["ai", "tools"],
          pinned: false,
          createdAt: Date.now() - 86400000 * 3,
        },
        {
          id: 2103,
          title: "Model Comparison Notes",
          content:
            "Claude — strong at long-context reasoning and writing tone.\nGPT-4 — broad general knowledge, large plugin ecosystem.\nGemini — tight Google Workspace integration.\nDeepSeek — strong reasoning at a low cost, good for batch jobs.",
          tags: ["ai", "research"],
          pinned: false,
          createdAt: Date.now() - 86400000 * 2,
        },
        {
          id: 2104,
          title: "Automation Ideas with n8n",
          content:
            "1. Summarize new emails and post a digest to Slack.\n2. Watch RSS feeds and draft social posts with an LLM.\n3. Auto-tag and file incoming invoices.\n4. Sync new Notion tasks to the Kanban board.",
          tags: ["ai", "automation"],
          pinned: false,
          createdAt: Date.now() - 86400000,
        },
        {
          id: 2105,
          title: "AI Image Generation Prompts",
          content:
            "Cinematic portrait, golden hour, 85mm lens, shallow depth of field, soft rim light.\nIsometric app icon, flat colors, subtle gradient, rounded corners, minimal shadow.\nCozy workspace illustration, warm palette, Gruvbox-inspired colors.",
          tags: ["ai", "creative"],
          pinned: false,
          createdAt: Date.now() - 3600000 * 6,
        },
        {
          id: 2106,
          title: "RAG Project Notes",
          content:
            "Chunk size ~500 tokens with 50-token overlap worked best for docs.\nUse hybrid search (keyword + embeddings) for better recall.\nCache embeddings — re-embedding on every request is wasteful.\nNext: try re-ranking results before passing to the model.",
          tags: ["ai", "dev"],
          pinned: false,
          createdAt: Date.now() - 1800000,
        },
      ],
      tasks: [
        {
          id: 2201,
          text: "Test new prompt templates for the writing assistant",
          done: false,
        },
        {
          id: 2202,
          text: "Compare Claude, GPT-4, and Gemini on the same benchmark task",
          done: false,
        },
        {
          id: 2203,
          text: "Set up an n8n workflow for a daily AI news digest",
          done: false,
        },
        {
          id: 2204,
          text: "Fine-tune a small classifier on Hugging Face",
          done: true,
        },
        {
          id: 2205,
          text: "Organize saved AI image generation prompts into folders",
          done: false,
        },
        {
          id: 2206,
          text: "Write a blog post about effective prompt engineering",
          done: true,
        },
      ],
      folders: [
        { name: "AI Chatbots" },
        { name: "AI Image & Video" },
        { name: "AI Audio" },
        { name: "AI Dev Tools" },
      ],
      importedBookmarks: [
        // AI Chatbots
        {
          id: "ws2_001",
          title: "ChatGPT",
          url: "https://chat.openai.com",
          folderName: "AI Chatbots",
        },
        {
          id: "ws2_002",
          title: "Claude",
          url: "https://claude.ai",
          folderName: "AI Chatbots",
        },
        {
          id: "ws2_003",
          title: "Gemini",
          url: "https://gemini.google.com",
          folderName: "AI Chatbots",
        },
        {
          id: "ws2_004",
          title: "Perplexity",
          url: "https://perplexity.ai",
          folderName: "AI Chatbots",
        },
        {
          id: "ws2_005",
          title: "Microsoft Copilot",
          url: "https://copilot.microsoft.com",
          folderName: "AI Chatbots",
        },
        {
          id: "ws2_006",
          title: "Grok",
          url: "https://grok.com",
          folderName: "AI Chatbots",
        },
        {
          id: "ws2_007",
          title: "DeepSeek",
          url: "https://chat.deepseek.com",
          folderName: "AI Chatbots",
        },
        {
          id: "ws2_008",
          title: "Mistral Le Chat",
          url: "https://chat.mistral.ai",
          folderName: "AI Chatbots",
        },
        {
          id: "ws2_009",
          title: "Meta AI",
          url: "https://meta.ai",
          folderName: "AI Chatbots",
        },
        // AI Image & Video
        {
          id: "ws2_101",
          title: "Midjourney",
          url: "https://midjourney.com",
          folderName: "AI Image & Video",
        },
        {
          id: "ws2_102",
          title: "DALL-E (ChatGPT)",
          url: "https://chat.openai.com",
          folderName: "AI Image & Video",
        },
        {
          id: "ws2_103",
          title: "Stable Diffusion",
          url: "https://stability.ai",
          folderName: "AI Image & Video",
        },
        {
          id: "ws2_104",
          title: "Runway",
          url: "https://runwayml.com",
          folderName: "AI Image & Video",
        },
        {
          id: "ws2_105",
          title: "Leonardo AI",
          url: "https://leonardo.ai",
          folderName: "AI Image & Video",
        },
        {
          id: "ws2_106",
          title: "Adobe Firefly",
          url: "https://firefly.adobe.com",
          folderName: "AI Image & Video",
        },
        {
          id: "ws2_107",
          title: "Ideogram",
          url: "https://ideogram.ai",
          folderName: "AI Image & Video",
        },
        {
          id: "ws2_108",
          title: "Kling AI",
          url: "https://klingai.com",
          folderName: "AI Image & Video",
        },
        // AI Audio
        {
          id: "ws2_201",
          title: "ElevenLabs",
          url: "https://elevenlabs.io",
          folderName: "AI Audio",
        },
        {
          id: "ws2_202",
          title: "Suno",
          url: "https://suno.com",
          folderName: "AI Audio",
        },
        {
          id: "ws2_203",
          title: "Udio",
          url: "https://udio.com",
          folderName: "AI Audio",
        },
        {
          id: "ws2_204",
          title: "Murf AI",
          url: "https://murf.ai",
          folderName: "AI Audio",
        },
        {
          id: "ws2_205",
          title: "Descript",
          url: "https://descript.com",
          folderName: "AI Audio",
        },
        // AI Dev Tools
        {
          id: "ws2_301",
          title: "Cursor",
          url: "https://cursor.com",
          folderName: "AI Dev Tools",
        },
        {
          id: "ws2_302",
          title: "GitHub Copilot",
          url: "https://github.com/features/copilot",
          folderName: "AI Dev Tools",
        },
        {
          id: "ws2_303",
          title: "Codeium",
          url: "https://codeium.com",
          folderName: "AI Dev Tools",
        },
        {
          id: "ws2_304",
          title: "Windsurf",
          url: "https://codeium.com/windsurf",
          folderName: "AI Dev Tools",
        },
        {
          id: "ws2_305",
          title: "Replit AI",
          url: "https://replit.com",
          folderName: "AI Dev Tools",
        },
        {
          id: "ws2_306",
          title: "v0 by Vercel",
          url: "https://v0.dev",
          folderName: "AI Dev Tools",
        },
        {
          id: "ws2_307",
          title: "Hugging Face",
          url: "https://huggingface.co",
          folderName: "AI Dev Tools",
        },
      ],
    };
  if (id === 3)
    return {
      quickAccess: [
        // Platforms & hosting
        { id: 301, name: "GitHub", url: "https://github.com" },
        { id: 302, name: "Vercel", url: "https://vercel.com" },
        { id: 303, name: "Supabase", url: "https://supabase.com" },
        { id: 304, name: "Cloudflare", url: "https://cloudflare.com" },
        { id: 305, name: "Docker Hub", url: "https://hub.docker.com" },
        { id: 306, name: "Railway", url: "https://railway.app" },
        // Python ecosystem
        { id: 307, name: "Python", url: "https://python.org" },
        { id: 308, name: "Django", url: "https://djangoproject.com" },
        { id: 309, name: "DRF", url: "https://www.django-rest-framework.org" },
        { id: 310, name: "FastAPI", url: "https://fastapi.tiangolo.com" },
        { id: 311, name: "Flask", url: "https://flask.palletsprojects.com" },
        { id: 312, name: "PyPI", url: "https://pypi.org" },
        // Other languages
        { id: 313, name: "Rust", url: "https://rust-lang.org" },
        { id: 314, name: "crates.io", url: "https://crates.io" },
        // JS/TS ecosystem
        { id: 315, name: "React", url: "https://react.dev" },
        { id: 316, name: "Next.js", url: "https://nextjs.org" },
        { id: 317, name: "Tailwind", url: "https://tailwindcss.com" },
        { id: 318, name: "npm", url: "https://npmjs.com" },
        // Tools
        { id: 319, name: "Linear", url: "https://linear.app" },
        { id: 320, name: "Stripe", url: "https://stripe.com" },
        { id: 321, name: "Postman", url: "https://postman.com" },
        { id: 322, name: "Stack Overflow", url: "https://stackoverflow.com" },
        { id: 323, name: "DevDocs", url: "https://devdocs.io" },
        { id: 324, name: "DEV.to", url: "https://dev.to" },
      ],
      notes: [
        {
          id: 3101,
          title: "Git Workflow Cheatsheet",
          content:
            "Feature branches off main: feature/<short-name>\nRebase before opening a PR to keep history linear.\nSquash merge for small fixes, regular merge for multi-commit features.\nTag releases as vMAJOR.MINOR.PATCH and write a short changelog entry.",
          tags: ["dev", "git"],
          pinned: true,
          createdAt: Date.now() - 86400000 * 4,
        },
        {
          id: 3102,
          title: "API Design Checklist",
          content:
            "Use plural nouns for resources (/users, /projects).\nVersion the API (/v1/...) from day one.\nReturn consistent error shapes: { error: { code, message } }.\nPaginate list endpoints with cursor or page params.\nDocument auth requirements per endpoint.",
          tags: ["dev", "backend"],
          pinned: false,
          createdAt: Date.now() - 86400000 * 3,
        },
        {
          id: 3103,
          title: "Code Review Guidelines",
          content:
            "Keep PRs small — under ~400 lines where possible.\nLeave comments as questions, not commands.\nApprove with nits if the only issues are style/naming.\nBlock only for correctness, security, or maintainability concerns.",
          tags: ["dev", "process"],
          pinned: false,
          createdAt: Date.now() - 86400000 * 2,
        },
        {
          id: 3104,
          title: "Deployment Runbook",
          content:
            "1. Run full test suite and lint.\n2. Tag release and push to remote.\n3. Deploy to staging, smoke test critical flows.\n4. Promote to production, watch error rates for 15 min.\n5. Roll back via previous deployment if errors spike.",
          tags: ["dev", "devops"],
          pinned: false,
          createdAt: Date.now() - 86400000,
        },
        {
          id: 3105,
          title: "Useful CLI Snippets",
          content:
            "git log --oneline --graph --all\ndocker compose up -d --build\nlsof -i :3000   # find process on a port\nfind . -name '*.log' -mtime +7 -delete",
          tags: ["dev", "cli"],
          pinned: false,
          createdAt: Date.now() - 3600000 * 6,
        },
        {
          id: 3106,
          title: "Bug Triage Notes",
          content:
            "Reproduce first, then label severity (P0–P3).\nP0/P1: fix or hotfix same day.\nAlways add a regression test alongside the fix.\nLink the fixing commit/PR back to the issue.",
          tags: ["dev", "bugs"],
          pinned: false,
          createdAt: Date.now() - 1800000,
        },
      ],
      tasks: [
        {
          id: 3201,
          text: "Set up CI pipeline for automated testing",
          done: false,
        },
        {
          id: 3202,
          text: "Refactor auth module to use JWT refresh tokens",
          done: false,
        },
        {
          id: 3203,
          text: "Write API documentation for the v2 endpoints",
          done: false,
        },
        {
          id: 3204,
          text: "Investigate memory leak in the background worker",
          done: false,
        },
        {
          id: 3205,
          text: "Upgrade dependencies and resolve breaking changes",
          done: true,
        },
        {
          id: 3206,
          text: "Add error monitoring and alerting (Sentry)",
          done: true,
        },
      ],
      folders: [
        { name: "Code & Repos" },
        { name: "Docs & Reference" },
        { name: "Dev Platforms" },
        { name: "Design" },
      ],
      importedBookmarks: [
        // Code & Repos
        {
          id: "ws3_001",
          title: "GitHub",
          url: "https://github.com",
          folderName: "Code & Repos",
        },
        {
          id: "ws3_002",
          title: "GitLab",
          url: "https://gitlab.com",
          folderName: "Code & Repos",
        },
        {
          id: "ws3_003",
          title: "Bitbucket",
          url: "https://bitbucket.org",
          folderName: "Code & Repos",
        },
        {
          id: "ws3_004",
          title: "CodePen",
          url: "https://codepen.io",
          folderName: "Code & Repos",
        },
        {
          id: "ws3_005",
          title: "StackBlitz",
          url: "https://stackblitz.com",
          folderName: "Code & Repos",
        },
        {
          id: "ws3_006",
          title: "Replit",
          url: "https://replit.com",
          folderName: "Code & Repos",
        },
        {
          id: "ws3_007",
          title: "JSFiddle",
          url: "https://jsfiddle.net",
          folderName: "Code & Repos",
        },
        {
          id: "ws3_008",
          title: "npm",
          url: "https://npmjs.com",
          folderName: "Code & Repos",
        },
        // Docs & Reference
        {
          id: "ws3_101",
          title: "MDN Web Docs",
          url: "https://developer.mozilla.org",
          folderName: "Docs & Reference",
        },
        {
          id: "ws3_102",
          title: "DevDocs",
          url: "https://devdocs.io",
          folderName: "Docs & Reference",
        },
        {
          id: "ws3_103",
          title: "Stack Overflow",
          url: "https://stackoverflow.com",
          folderName: "Docs & Reference",
        },
        {
          id: "ws3_104",
          title: "W3Schools",
          url: "https://w3schools.com",
          folderName: "Docs & Reference",
        },
        {
          id: "ws3_105",
          title: "Can I Use",
          url: "https://caniuse.com",
          folderName: "Docs & Reference",
        },
        {
          id: "ws3_106",
          title: "CSS-Tricks",
          url: "https://css-tricks.com",
          folderName: "Docs & Reference",
        },
        {
          id: "ws3_107",
          title: "web.dev",
          url: "https://web.dev",
          folderName: "Docs & Reference",
        },
        // Dev Platforms
        {
          id: "ws3_201",
          title: "Vercel",
          url: "https://vercel.com",
          folderName: "Dev Platforms",
        },
        {
          id: "ws3_202",
          title: "Netlify",
          url: "https://netlify.com",
          folderName: "Dev Platforms",
        },
        {
          id: "ws3_203",
          title: "Railway",
          url: "https://railway.app",
          folderName: "Dev Platforms",
        },
        {
          id: "ws3_204",
          title: "Supabase",
          url: "https://supabase.com",
          folderName: "Dev Platforms",
        },
        {
          id: "ws3_205",
          title: "Firebase",
          url: "https://firebase.google.com",
          folderName: "Dev Platforms",
        },
        {
          id: "ws3_206",
          title: "Render",
          url: "https://render.com",
          folderName: "Dev Platforms",
        },
        {
          id: "ws3_207",
          title: "Cloudflare",
          url: "https://cloudflare.com",
          folderName: "Dev Platforms",
        },
        {
          id: "ws3_208",
          title: "Postman",
          url: "https://postman.com",
          folderName: "Dev Platforms",
        },
        // Design
        {
          id: "ws3_301",
          title: "Figma",
          url: "https://figma.com",
          folderName: "Design",
        },
        {
          id: "ws3_302",
          title: "Dribbble",
          url: "https://dribbble.com",
          folderName: "Design",
        },
        {
          id: "ws3_303",
          title: "Behance",
          url: "https://behance.net",
          folderName: "Design",
        },
        {
          id: "ws3_304",
          title: "Tailwind CSS",
          url: "https://tailwindcss.com",
          folderName: "Design",
        },
        {
          id: "ws3_305",
          title: "Google Fonts",
          url: "https://fonts.google.com",
          folderName: "Design",
        },
        {
          id: "ws3_306",
          title: "Font Awesome",
          url: "https://fontawesome.com",
          folderName: "Design",
        },
        {
          id: "ws3_307",
          title: "Coolors",
          url: "https://coolors.co",
          folderName: "Design",
        },
        {
          id: "ws3_308",
          title: "Lucide Icons",
          url: "https://lucide.dev",
          folderName: "Design",
        },
      ],
    };
  return { quickAccess: [], notes: [], tasks: [], importedBookmarks: [] };
};

const FALLBACK_QUOTES = [
  {
    quote: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
  },
  {
    quote: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
  },
  {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
];

// ===== STATE =====
let S = {
  user: {
    name: "",
    avatarColor: "#7c3aed",
    googlePicture: null,
    googleName: null,
  },
  workspaces: [],
  activeWsId: 1,
  wsData: {}, // {[wsId]: {quickAccess,notes,tasks}}
  trash: [],
  settings: {
    theme: "dark",
    accentColor: "#fe8019",
    clockFormat: "12",
    showSeconds: true,
    cardGlow: "glow",
    widgets: {
      notes: true,
      timer: true,
    },
    sidebarCollapsed: false,
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
        { id: 5004, name: "Hamro Patro", url: "https://hamropatro.com" },
        { id: 5005, name: "Upwork", url: "https://upwork.com" },
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
  kanban: {},
  _kanbanDragCard: null,
  _kanbanDragCol: null,
  _sbAddLinkGroup: null,
  _kanbanTargetCol: null,
  calEvents: [], // { id, title, date, type, weekday, customDays }
  _calMonth: null, // { year, month } — currently viewed month
  _qaDeleted: new Set(), // normalized URLs of explicitly-deleted QA items (tombstones)
  _cloudResetDone: false, // one-time cloud wipe+reupload has run on this install
};

// ===== BOOT =====
document.addEventListener("DOMContentLoaded", async () => {
  await loadState();
  migrateAddSocials();
  migrateSyncSbLinksToQA();
  migrateAddWorkspaceContent();
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
    const kb = S.settings.shortcuts || {};
    const searchKey = kb.search || "/";
    const timerKey = kb.timer || "";
    const noteKey = kb.note || "";
    const taskKey = kb.task || "";

    if (!inInput) {
      if (_kbMatch(e, searchKey)) { e.preventDefault(); openCmdPalette(); return; }
      if (timerKey && _kbMatch(e, timerKey)) { e.preventDefault(); navigateTo("timer"); return; }
      if (noteKey && _kbMatch(e, noteKey)) { e.preventDefault(); navigateTo("notes"); return; }
      if (taskKey && _kbMatch(e, taskKey)) { e.preventDefault(); navigateTo("tasks"); return; }
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
// wsData goes to local storage (large, can contain hundreds of bookmarks).
async function loadState() {
  let d = await API.getLocal([
    "user",
    "workspaces",
    "activeWsId",
    "trash",
    "settings",
    "weatherLocation",
    "wsData",
    "habits",
    "readingQueue",
    "tabSessions",
    "journal",
    "kanban",
    "calEvents",
    "_savedAt",
    "googleUser",
    "_focusSessions",
    "_focusMinutes",
    "_qaDeleted",
    "_cloudResetDone",
  ]);
  // One-time migration: pull from sync storage if local is still empty
  if (!d.settings && IS_CHROME && chrome.storage) {
    const synced = await API.get([
      "user",
      "workspaces",
      "activeWsId",
      "trash",
      "settings",
      "weatherLocation",
    ]);
    if (synced.settings) {
      d = { ...d, ...synced };
      save();
    }
  }
  S.user = d.user || S.user;
  S.workspaces =
    Array.isArray(d.workspaces) && d.workspaces.length
      ? d.workspaces
      : DEFAULT_WORKSPACES;
  // Normalize all workspace IDs to numbers for consistent comparison
  S.workspaces.forEach((ws) => {
    ws.id = Number(ws.id);
  });
  const savedWsId =
    d.activeWsId != null ? Number(d.activeWsId) : S.workspaces[0].id;
  S.activeWsId = S.workspaces.find((w) => w.id === savedWsId)
    ? savedWsId
    : S.workspaces[0].id;
  S.trash = Array.isArray(d.trash) ? d.trash : [];
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
  S.wsData = d.wsData || {};
  S.workspaces.forEach((ws) => {
    if (!S.wsData[ws.id]) S.wsData[ws.id] = DEFAULT_WS_DATA(ws.id);
  });
  // Self-heal duplicate Quick Access / imported-bookmark entries per workspace.
  Object.values(S.wsData).forEach((wd) => {
    if (wd.quickAccess) wd.quickAccess = _dedupeByUrl(wd.quickAccess);
    if (wd.importedBookmarks) wd.importedBookmarks = _dedupeByUrl(wd.importedBookmarks);
  });
  // Migration: ensure AI (id:2) and Dev (id:3) preset workspaces exist
  const wsIds = S.workspaces.map((w) => w.id);
  let migrated = false;
  if (!wsIds.includes(2)) {
    S.workspaces.push({ id: 2, name: "AI", icon: "🤖" });
    S.wsData[2] = DEFAULT_WS_DATA(2);
    migrated = true;
  }
  if (!wsIds.includes(3)) {
    S.workspaces.push({ id: 3, name: "Dev", icon: "💻" });
    S.wsData[3] = DEFAULT_WS_DATA(3);
    migrated = true;
  }
  if (migrated) save();
  // Load new feature state
  S.habits = Array.isArray(d.habits) ? d.habits : [];
  S.readingQueue = Array.isArray(d.readingQueue) ? d.readingQueue : [];
  S.tabSessions = Array.isArray(d.tabSessions) ? d.tabSessions : [];
  S.journal = d.journal && typeof d.journal === "object" ? d.journal : {};
  S.kanban = d.kanban && typeof d.kanban === "object" ? d.kanban : {};
  S.calEvents = Array.isArray(d.calEvents) ? d.calEvents : [];
  S._focusSessions = d._focusSessions && typeof d._focusSessions === "object" ? d._focusSessions : {};
  S._focusMinutes = d._focusMinutes && typeof d._focusMinutes === "object" ? d._focusMinutes : {};
  S._qaDeleted = new Set(Array.isArray(d._qaDeleted) ? d._qaDeleted : []);
  // Filter any tombstoned URLs out of all workspace quickAccess arrays
  Object.values(S.wsData).forEach((wd) => {
    if (Array.isArray(wd.quickAccess) && S._qaDeleted.size) {
      wd.quickAccess = wd.quickAccess.filter((q) => !S._qaDeleted.has(_normUrl(q.url)));
    }
  });
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
    workspaces: S.workspaces,
    activeWsId: S.activeWsId,
    trash: S.trash,
    settings: S.settings,
    weatherLocation: S.weatherLocation,
    wsData: S.wsData,
    habits: S.habits,
    readingQueue: S.readingQueue,
    tabSessions: S.tabSessions,
    journal: S.journal,
    kanban: S.kanban,
    calEvents: S.calEvents,
    _savedAt: S._savedAt,
    _focusSessions: S._focusSessions || {},
    _focusMinutes: S._focusMinutes || {},
    _qaDeleted: [...(S._qaDeleted || new Set())],
  });
  // Debounce cloud push — near-instant (2 s after last change)
  if (S.googleUser) scheduleDriveSync();
  return p;
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

// Workspace edit state
let _editingWsId = null;

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

// Current workspace data helpers
function wsData() {
  const d =
    S.wsData[S.activeWsId] ||
    (S.wsData[S.activeWsId] = {
      quickAccess: [],
      notes: [],
      tasks: [],
      importedBookmarks: [],
    });
  if (!d.folders) d.folders = [];
  return d;
}
function wsNotes() {
  return wsData().notes;
}
function wsTasks() {
  return wsData().tasks;
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
    const r = await fetch(url);
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
          const isToday = w.date === new Date().toISOString().slice(0, 10);
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
        return;
      }
    }
  } catch {}
  // Fallback: let wttr.in detect from the extension's outgoing IP
  fetchWeather(undefined);
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

// GPS → Nominatim → ipwho.is → wttr.in bare IP
async function autoDetectWeather() {
  if (S.weatherLocation) {
    fetchWeather(S.weatherLocation);
    return;
  }
  el("weatherCity").textContent = "Detecting...";
  el("weatherTemp").textContent = "--°C";
  el("weatherDesc").textContent = "";

  if (!navigator.geolocation) {
    detectByIP();
    return;
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
          return;
        }
      }
      detectByIP();
    },
    () => detectByIP(),
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
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const locStr = `${lat.toFixed(4)},${lon.toFixed(4)}`;
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

const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/drive.appdata",
];
const DRIVE_FILE_NAME = "novatab-sync.json";
const DRIVE_SPACES = "appDataFolder";
const _TK_ACCESS_KEY = "_ntAccess"; // { token, expiry }
const _TK_REFRESH_KEY = "_ntRefresh"; // refresh token string

// Drive namespace
const Drive = {
  _fileId: null,
  _syncTimer: null,
  _lastSyncAt: 0,
  _status: "idle",
};

// ── PKCE helpers ────────────────────────────────────────────────────────
function _randomBase64Url(bytes = 48) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
async function _sha256Base64Url(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str),
  );
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ── Token storage (chrome.storage.local — survives tab reloads) ─────────
async function _getAccess() {
  try {
    const d = await API.getLocal([_TK_ACCESS_KEY]);
    const c = d[_TK_ACCESS_KEY];
    if (c?.token && c.expiry > Date.now() + 60000) return c.token;
  } catch {}
  return null;
}
async function _saveAccess(token, expiresInSecs = 3500) {
  await API.setLocal({
    [_TK_ACCESS_KEY]: { token, expiry: Date.now() + expiresInSecs * 1000 },
  });
}
async function _getRefresh() {
  try {
    const d = await API.getLocal([_TK_REFRESH_KEY]);
    return d[_TK_REFRESH_KEY] || null;
  } catch {
    return null;
  }
}
async function _saveRefresh(token) {
  await API.setLocal({ [_TK_REFRESH_KEY]: token });
}
async function _clearTokens() {
  await API.setLocal({ [_TK_ACCESS_KEY]: null, [_TK_REFRESH_KEY]: null });
}

// ── Refresh access token using stored refresh token ─────────────────────
async function _refreshAccessToken() {
  const refresh = await _getRefresh();
  if (!refresh) return null;
  try {
    const refreshParams = {
      client_id: GOOGLE_CLIENT_ID,
      refresh_token: refresh,
      grant_type: "refresh_token",
    };
    if (GOOGLE_CLIENT_SECRET)
      refreshParams.client_secret = GOOGLE_CLIENT_SECRET;

    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(refreshParams),
    });
    if (!r.ok) {
      // Only clear tokens for definitive auth failures (400/401 = token revoked/expired).
      // Network errors and 5xx are transient — don't wipe the refresh token for those.
      if (r.status === 400 || r.status === 401) await _clearTokens();
      return null;
    }
    const d = await r.json();
    if (d.access_token) {
      await _saveAccess(d.access_token, d.expires_in || 3500);
      return d.access_token;
    }
  } catch {}
  return null;
}

// ── PKCE auth code flow via launchWebAuthFlow ───────────────────────────
// Works with ANY OAuth client type — no extension ID registration needed.
// Only requires:  https://<extensionId>.chromiumapp.org/  as a redirect URI
// in Google Console → Credentials → your OAuth client → Authorized redirect URIs
async function _launchPKCEFlow() {
  if (!IS_CHROME || !chrome.identity) return null;

  const verifier = _randomBase64Url(48);
  const challenge = await _sha256Base64Url(verifier);
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: OAUTH_SCOPES.join(" "),
      code_challenge: challenge,
      code_challenge_method: "S256",
      access_type: "offline", // gets refresh_token
      prompt: "consent", // always show consent so refresh_token is returned
    });

  // Step 1: get auth code
  const redirectUrl = await new Promise((resolve) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (url) => {
        if (chrome.runtime.lastError) {
          console.warn(
            "[novatab] Auth flow closed or cancelled.",
            chrome.runtime.lastError.message,
          );
        }
        resolve(url || null);
      },
    );
  });
  if (!redirectUrl) return null;

  const code = new URL(redirectUrl).searchParams.get("code");
  if (!code) return null;

  // Step 2: exchange code for tokens
  try {
    const exchangeParams = {
      client_id: GOOGLE_CLIENT_ID,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    };
    if (GOOGLE_CLIENT_SECRET)
      exchangeParams.client_secret = GOOGLE_CLIENT_SECRET;

    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(exchangeParams),
    });
    if (!r.ok) {
      const errBody = await r.text().catch(() => "(unreadable)");
      console.warn("[novatab] Token exchange failed:", r.status, errBody);
      return null;
    }
    const d = await r.json();
    if (d.access_token) {
      await _saveAccess(d.access_token, d.expires_in || 3500);
      if (d.refresh_token) await _saveRefresh(d.refresh_token);
      return d.access_token;
    }
  } catch {
    console.warn("[novatab] Auth request failed — network error.");
  }
  return null;
}

// ── Main getAuthToken: cache → refresh → interactive PKCE ───────────────
async function getAuthToken(interactive = false) {
  // 1. Valid cached access token
  const cached = await _getAccess();
  if (cached) return cached;

  // 2. Refresh token available → get new access token silently
  const refreshed = await _refreshAccessToken();
  if (refreshed) return refreshed;

  // 3. No tokens at all — interactive sign-in only
  if (!interactive) return null;
  return await _launchPKCEFlow();
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
      `https://www.googleapis.com/drive/v3/files?spaces=${DRIVE_SPACES}&q=name%3D'${DRIVE_FILE_NAME}'&fields=files(id%2CmodifiedTime)&orderBy=modifiedTime%20desc`,
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

async function _e2eDeriveKey(passphrase, saltBytes) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
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
  const key = await _e2eDeriveKey(passphrase, salt);
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    _e2e: 1,
    _version: payload._version,
    _savedAt: payload._savedAt,
    salt: _e2eBytesToB64(salt),
    iv: _e2eBytesToB64(iv),
    data: _e2eBytesToB64(new Uint8Array(cipher)),
  };
}

async function _e2eDecryptPayload(envelope, passphrase) {
  const salt = _e2eB64ToBytes(envelope.salt);
  const iv = _e2eB64ToBytes(envelope.iv);
  const data = _e2eB64ToBytes(envelope.data);
  const key = await _e2eDeriveKey(passphrase, salt);
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
    workspaces: S.workspaces,
    activeWsId: S.activeWsId,
    wsData: S.wsData,
    settings: S.settings,
    habits: S.habits,
    readingQueue: S.readingQueue,
    tabSessions: S.tabSessions,
    journal: S.journal,
    kanban: S.kanban,
    calEvents: S.calEvents,
    weatherLocation: S.weatherLocation,
    trash: S.trash,
    _qaDeleted: [...(S._qaDeleted || new Set())],
  };
}

// ── Apply cloud data pulled from Drive ──────────────────────────────────
function applyCloudData(cloud) {
  if (!cloud || cloud._version < 1) return;
  S.workspaces =
    Array.isArray(cloud.workspaces) && cloud.workspaces.length
      ? cloud.workspaces
      : S.workspaces;
  S.workspaces.forEach((ws) => {
    ws.id = Number(ws.id);
  });
  // Merge tombstones first so we can filter QA below
  if (Array.isArray(cloud._qaDeleted)) {
    S._qaDeleted = new Set([...S._qaDeleted, ...cloud._qaDeleted]);
  }
  // Apply cloud wsData but strip tombstoned Quick Access items
  if (cloud.wsData) {
    S.wsData = cloud.wsData;
    if (S._qaDeleted.size) {
      Object.values(S.wsData).forEach((wd) => {
        if (Array.isArray(wd.quickAccess)) {
          wd.quickAccess = wd.quickAccess.filter((q) => !S._qaDeleted.has(_normUrl(q.url)));
        }
      });
    }
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
  S.kanban =
    cloud.kanban && typeof cloud.kanban === "object" ? cloud.kanban : S.kanban;
  S.calEvents = Array.isArray(cloud.calEvents) ? cloud.calEvents : S.calEvents;
  S.trash = Array.isArray(cloud.trash) ? cloud.trash : S.trash;
  if (cloud.weatherLocation !== undefined)
    S.weatherLocation = cloud.weatherLocation;
  if (cloud.activeWsId != null) S.activeWsId = Number(cloud.activeWsId);
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
  // Ensure all WS data slots exist
  S.workspaces.forEach((ws) => {
    if (!S.wsData[ws.id]) S.wsData[ws.id] = DEFAULT_WS_DATA(ws.id);
  });
}

// Remove duplicate entries by normalized URL, keeping the first occurrence.
// Self-heals any duplicates already sitting in local/cloud storage from
// earlier id-based merges or renumbered defaults.
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
    workspaces: S.workspaces,
    activeWsId: S.activeWsId,
    wsData: S.wsData,
    settings: S.settings,
    habits: S.habits,
    readingQueue: S.readingQueue,
    tabSessions: S.tabSessions,
    journal: S.journal,
    kanban: S.kanban,
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

function _applyLiveStorageChange(changes) {
  if (changes.user) S.user = changes.user.newValue || S.user;
  if (changes.googleUser) S.googleUser = changes.googleUser.newValue || null;
  if (changes.workspaces) {
    S.workspaces = changes.workspaces.newValue || S.workspaces;
    S.workspaces.forEach((ws) => { ws.id = Number(ws.id); });
  }
  if (changes.activeWsId) S.activeWsId = Number(changes.activeWsId.newValue);
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
  if (changes.wsData) S.wsData = changes.wsData.newValue || S.wsData;
  if (changes.habits) S.habits = changes.habits.newValue || [];
  if (changes.readingQueue) S.readingQueue = changes.readingQueue.newValue || [];
  if (changes.tabSessions) S.tabSessions = changes.tabSessions.newValue || [];
  if (changes.journal) S.journal = changes.journal.newValue || {};
  if (changes.kanban) S.kanban = changes.kanban.newValue || {};
  if (changes.calEvents) S.calEvents = changes.calEvents.newValue || [];
  if (changes._focusSessions) S._focusSessions = changes._focusSessions.newValue || {};
  if (changes._focusMinutes) S._focusMinutes = changes._focusMinutes.newValue || {};
  if (changes._qaDeleted) S._qaDeleted = new Set(changes._qaDeleted.newValue || []);

  // Ensure all workspace data slots exist, then re-strip tombstoned QA items.
  S.workspaces.forEach((ws) => {
    if (!S.wsData[ws.id]) S.wsData[ws.id] = DEFAULT_WS_DATA(ws.id);
  });
  if (S._qaDeleted.size) {
    Object.values(S.wsData).forEach((wd) => {
      if (Array.isArray(wd.quickAccess)) {
        wd.quickAccess = wd.quickAccess.filter((q) => !S._qaDeleted.has(_normUrl(q.url)));
      }
    });
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
    body = pass
      ? JSON.stringify(await _e2eEncryptPayload(payload, pass))
      : JSON.stringify(payload);
  } else {
    body = JSON.stringify(payload);
  }
  const boundary = "novatab_boundary_" + Date.now();
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
        await _clearTokens();
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
  // Lead with stored tokens — works in Brave/Arc/Edge where getProfileUserInfo returns empty.
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
async function signIn() {
  if (!IS_CHROME || !chrome.identity) {
    openModal("profileModal");
    return;
  }
  setSyncStatus("syncing");
  const token = await getAuthToken(true); // interactive = true
  if (!token) {
    setSyncStatus("signed-out");
    showToast("Sign-in cancelled");
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
}

// ── Sign out: revoke token, clear state ──────────────────────────────────
async function signOut() {
  // Get token before clearing cache so we can revoke it
  const token = await getAuthToken(false);

  // Clear our storage cache first
  await _clearTokens();

  if (IS_CHROME && chrome.identity && token) {
    // Revoke on Google's servers
    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`).catch(
      () => {},
    );
    // Remove from Chrome's token cache
    chrome.identity.removeCachedAuthToken({ token }, () => {});
  }

  S.googleUser = null;
  S.user.googlePicture = null;
  S.user.googleName = null;
  Drive._fileId = null;
  Drive._lastSyncAt = 0;
  clearTimeout(Drive._syncTimer);
  save();
  updateAvatarDisplay();
  updateGreeting();
  setSyncStatus("signed-out");
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
  renderSidebarWorkspaces();
  renderSnavAI();
  renderSnavDev();
  renderSnavHome();
  renderSnavGoogle();
  renderSnavProjects();
  renderSnavOthers();
  renderSnavSocials();
  renderTabsWorkspaces();
  renderSidebarFolders();
  applyWidgetVisibility();
  renderQuickAccess();
  renderWorkspaceBookmarks();
  renderNotesWidget();
  renderTasksWidget();
  renderKanbanDash();
  renderNotesView();
  renderTrash();
  renderCalendarWidget();
  renderTimerStats();
  updateSidebarTabActive();
}

// ===== FIX #7 — WORKSPACE SWITCHING =====
function setActiveWorkspace(wsId) {
  const id = Number(wsId);
  if (id === S.activeWsId) return;
  S.activeWsId = id;
  save();
  renderSidebarWorkspaces();
  renderSnavAI();
  renderSnavDev();
  renderTabsWorkspaces();
  renderSidebarFolders();

  const content = document.querySelector(".home-content");
  const doRender = () => {
    renderQuickAccess();
    renderWorkspaceBookmarks();
    renderNotesWidget();
    renderTasksWidget();
    renderKanbanDash();
    renderNotesView();
  };
  if (content) {
    content.style.animation = "wsContentOut .14s ease forwards";
    setTimeout(() => {
      doRender();
      content.style.animation = "wsContentIn .2s cubic-bezier(.4,0,.2,1) both";
      content.addEventListener(
        "animationend",
        () => {
          content.style.animation = "";
        },
        { once: true },
      );
    }, 140);
  } else {
    doRender();
  }
}

// ===== WORKSPACES SIDEBAR =====
function renderSidebarWorkspaces() {
  const list = el("sidebarWorkspacesList");
  if (!list) return;
  const custom = S.workspaces.filter((ws) => ws.id > 3);
  if (!custom.length) {
    list.innerHTML = '<div class="sb-empty-state">No custom workspaces</div>';
    return;
  }
  list.innerHTML = custom
    .map(
      (ws) => `
    <div class="workspace-sidebar-item ${ws.id === S.activeWsId ? "active" : ""}" data-wsid="${ws.id}">
      <div class="ws-icon">${ws.icon}</div>
      <span style="flex:1">${escH(ws.name)}</span>
    </div>`,
    )
    .join("");
  list.querySelectorAll(".workspace-sidebar-item").forEach((item) => {
    item.addEventListener("click", () => setActiveWorkspace(item.dataset.wsid));
  });
  _addDragDrop(list, ".workspace-sidebar-item");
  // Scroll overflow indicator (same as folders)
  const wrap = el("sidebarWorkspacesWrap");
  if (wrap) {
    const update = () => {
      const overflows = list.scrollHeight > list.clientHeight;
      const atBottom =
        list.scrollTop + list.clientHeight >= list.scrollHeight - 2;
      wrap.classList.toggle("no-overflow", !overflows || atBottom);
    };
    update();
    list.removeEventListener("scroll", list._wsScrollIndicator);
    list._wsScrollIndicator = update;
    list.addEventListener("scroll", update);
  }
}

// ===== NEW SIDEBAR: AI / DEV DYNAMIC RENDERS =====
function _renderSnavLinks(containerId, wsId) {
  const container = el(containerId);
  if (!container) return;
  const data = S.wsData[wsId] || {};
  const links = data.quickAccess || [];
  if (!links.length) {
    container.innerHTML =
      '<div class="sb-empty-state">No links yet. Click + to add.</div>';
    return;
  }
  container.innerHTML = links
    .map(
      (link) => `
    <div class="sb-item sb-link-item" data-tip="${escH(link.name)}">
      <a href="${escH(link.url)}" class="sb-link-main" target="_blank" rel="noopener">
        <img class="sb-fav" src="${favSrc(link.url)}" alt="" onerror="this.style.display='none'">
        <span class="sb-item-label">${escH(link.name)}</span>
      </a>
      <div class="sb-link-actions">
        <a href="${escH(link.url)}" class="sb-open-btn" target="_blank" rel="noopener" title="Open in new tab">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
        <button class="sb-rm-btn" title="Remove" data-rm-ws="${wsId}" data-rm-id="${link.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>`,
    )
    .join("");
}
function renderSnavAI() {
  _renderSnavLinks("snavAIItems", 2);
}
function renderSnavDev() {
  _renderSnavLinks("snavDevItems", 3);
}
function renderSnavHome() {
  _renderSnavLinks("sbHomeLinks", 1);
}
function renderSnavGoogle() {
  _renderSnavGlobalLinks("snavGoogleItems", "google");
}
function renderSnavProjects() {
  _renderSnavGlobalLinks("snavProjectsItems", "projects");
}
function renderSnavOthers() {
  _renderSnavGlobalLinks("snavOthersItems", "others");
}
function renderSnavSocials() {
  _renderSnavGlobalLinks("snavSocialsItems", "socials");
}

// Render global (non-workspace) sidebar link lists
function _getSbGlobalLinks(group) {
  if (!S.settings.sbLinks) S.settings.sbLinks = {};
  if (!S.settings.sbLinks[group]) S.settings.sbLinks[group] = [];
  return S.settings.sbLinks[group];
}

function _renderSnavGlobalLinks(containerId, group) {
  const container = el(containerId);
  if (!container) return;
  const links = _getSbGlobalLinks(group);
  if (!links.length) {
    container.innerHTML = `<div class="sb-empty-state">No links yet — click + to add</div>`;
    return;
  }
  container.innerHTML = links
    .map(
      (link) => `
    <div class="sb-item sb-link-item" data-tip="${escH(link.name)}">
      <a href="${escH(link.url)}" class="sb-link-main" target="_blank" rel="noopener">
        <img class="sb-fav" src="${favSrc(link.url)}" alt="" onerror="this.style.display='none'">
        <span class="sb-item-label">${escH(link.name)}</span>
      </a>
      <div class="sb-link-actions">
        <a href="${escH(link.url)}" class="sb-open-btn" target="_blank" rel="noopener" title="Open in new tab">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
        <button class="sb-rm-btn" title="Remove" data-rm-group="${escH(group)}" data-rm-id="${link.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>`,
    )
    .join("");
}

function removeSbGlobalLink(group, linkId) {
  const links = _getSbGlobalLinks(group);
  S.settings.sbLinks[group] = links.filter((l) => l.id !== linkId);
  save();
  _renderSnavGlobalLinks(
    group === "google"
      ? "snavGoogleItems"
      : group === "socials"
        ? "snavSocialsItems"
        : group === "projects"
          ? "snavProjectsItems"
          : "snavOthersItems",
    group,
  );
}

function removeSbLink(wsId, linkId) {
  const data = S.wsData[wsId];
  if (!data) return;
  const removed = (data.quickAccess || []).find((l) => l.id === linkId);
  if (removed?.url) S._qaDeleted.add(_normUrl(removed.url));
  data.quickAccess = (data.quickAccess || []).filter((l) => l.id !== linkId);
  save();
  _renderSnavLinks(
    wsId === 1 ? "sbHomeLinks" : wsId === 2 ? "snavAIItems" : "snavDevItems",
    wsId,
  );
}

function openSbAddLink(group) {
  S._sbAddLinkGroup = group;
  const titles = {
    home: "Add Link to Home",
    ai: "Add AI Tool",
    dev: "Add Dev Tool",
    google: "Add Google Link",
    socials: "Add Social Link",
    projects: "Add Project",
    others: "Add Link",
  };
  el("sbAddLinkTitle").textContent = titles[group] || "Add Link";
  el("sbAddLinkName").value = "";
  el("sbAddLinkUrl").value = "";
  openModal("sbAddLinkModal");
  setTimeout(() => el("sbAddLinkName").focus(), 80);
}

function saveSbLink() {
  const name = el("sbAddLinkName").value.trim();
  const url = el("sbAddLinkUrl").value.trim();
  if (!name || !url) {
    showToast("Enter a name and URL", "error");
    return;
  }
  const group = S._sbAddLinkGroup;
  // Global groups (not workspace-based)
  if (group === "google" || group === "socials" || group === "projects" || group === "others") {
    _getSbGlobalLinks(group).push({ id: Date.now(), name, url });
    _mirrorLinkToHomeQA({ name, url });
    save();
    closeModal("sbAddLinkModal");
    if (group === "google") renderSnavGoogle();
    else if (group === "socials") renderSnavSocials();
    else if (group === "projects") renderSnavProjects();
    else renderSnavOthers();
    if (S.activeWsId === 1) renderQuickAccess();
    showToast("Link added", "success");
    return;
  }
  // Workspace-based groups
  const wsId = group === "ai" ? 2 : group === "dev" ? 3 : 1;
  if (!S.wsData[wsId])
    S.wsData[wsId] = {
      quickAccess: [],
      notes: [],
      tasks: [],
      folders: [],
      importedBookmarks: [],
    };
  if (!S.wsData[wsId].quickAccess) S.wsData[wsId].quickAccess = [];
  const normNew = _normUrl(url);
  if (S.wsData[wsId].quickAccess.some((l) => _normUrl(l.url) === normNew)) {
    showToast("Link already in Quick Access", "error");
    return;
  }
  S._qaDeleted.delete(normNew); // allow intentional re-add
  S.wsData[wsId].quickAccess.push({ id: Date.now(), name, url });
  save();
  closeModal("sbAddLinkModal");
  if (wsId === 2) renderSnavAI();
  else if (wsId === 3) renderSnavDev();
  else renderSnavHome();
  showToast("Link added", "success");
}

// ===== SIDEBAR TAB COLLAPSIBLE LOGIC =====
function initSidebarTabs() {
  document.querySelectorAll(".sb-group-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".sb-group");
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

function reorderWorkspaces(fromId, toId) {
  fromId = Number(fromId);
  toId = Number(toId);
  if (fromId === toId) return;
  const from = S.workspaces.findIndex((w) => w.id === fromId);
  const to = S.workspaces.findIndex((w) => w.id === toId);
  if (from < 0 || to < 0) return;
  const [item] = S.workspaces.splice(from, 1);
  S.workspaces.splice(to, 0, item);
  save();
  renderSidebarWorkspaces();
  renderTabsWorkspaces();
  renderManageWorkspacesList();
}

function _addDragDrop(container, itemSelector) {
  let dragId = null;
  container.querySelectorAll(itemSelector).forEach((item) => {
    item.setAttribute("draggable", "true");
    item.addEventListener("dragstart", (e) => {
      dragId = item.dataset.wsid;
      item.classList.add("ws-dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    item.addEventListener("dragend", () => {
      dragId = null;
      container
        .querySelectorAll(itemSelector)
        .forEach((el) => el.classList.remove("ws-dragging", "ws-drag-over"));
    });
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      container
        .querySelectorAll(itemSelector)
        .forEach((el) => el.classList.remove("ws-drag-over"));
      if (item.dataset.wsid !== dragId) item.classList.add("ws-drag-over");
    });
    item.addEventListener("dragleave", () =>
      item.classList.remove("ws-drag-over"),
    );
    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("ws-drag-over");
      if (dragId && item.dataset.wsid !== dragId)
        reorderWorkspaces(dragId, item.dataset.wsid);
    });
  });
}

function renderTabsWorkspaces() {
  const tabs = el("workspaceTabs");
  tabs.innerHTML = S.workspaces
    .map(
      (ws) => `
    <div class="ws-tab ${ws.id === S.activeWsId ? "active" : ""}" data-wsid="${ws.id}">
      <span class="ws-tab-icon">${ws.icon}</span>
      <span>${escH(ws.name)}</span>
    </div>`,
    )
    .join("");
  tabs.querySelectorAll(".ws-tab").forEach((tab) => {
    tab.addEventListener("click", () => setActiveWorkspace(tab.dataset.wsid));
  });
  _addDragDrop(tabs, ".ws-tab");
}

function renderManageWorkspacesList() {
  const list = el("manageWsList");
  if (!list) return;
  list.innerHTML = S.workspaces
    .map(
      (ws) => `
    <div class="manage-ws-row" data-wsid="${ws.id}">
      <span class="manage-ws-drag" data-tip="Drag to reorder">⠿</span>
      <span class="manage-ws-icon">${ws.icon}</span>
      <span class="manage-ws-name">${escH(ws.name)}</span>
      <div class="manage-ws-actions">
        <button class="manage-ws-edit" data-wsid="${ws.id}" data-tip="Edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="manage-ws-delete" data-wsid="${ws.id}" data-tip="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          Delete
        </button>
      </div>
    </div>`,
    )
    .join("");
  list.querySelectorAll(".manage-ws-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal("manageWorkspacesModal");
      openEditWorkspaceModal(btn.dataset.wsid);
    });
  });
  list.querySelectorAll(".manage-ws-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      closeModal("manageWorkspacesModal");
      const wsId = Number(btn.dataset.wsid);
      if (S.workspaces.length <= 1) {
        showToast("Cannot delete the last workspace!", "error");
        renderManageWorkspacesList();
        openModal("manageWorkspacesModal");
        return;
      }
      const ws = S.workspaces.find((w) => w.id === wsId);
      if (!ws) return;
      confirm2(
        `Delete "${ws.name}"?`,
        "All notes, tasks and quick access in this workspace will be moved to trash.",
        () => {
          const data = S.wsData[wsId];
          if (data) {
            (data.notes || []).forEach((n) =>
              S.trash.push({ ...n, _type: "note", _deletedAt: Date.now() }),
            );
            (data.tasks || []).forEach((t) =>
              S.trash.push({ ...t, _type: "task", _deletedAt: Date.now() }),
            );
          }
          delete S.wsData[wsId];
          S.workspaces = S.workspaces.filter((w) => w.id !== wsId);
          if (S.activeWsId === wsId) S.activeWsId = S.workspaces[0].id;
          save();
          renderAll();
          renderManageWorkspacesList();
          showToast("Workspace deleted", "success");
        },
        () => {
          renderManageWorkspacesList();
          openModal("manageWorkspacesModal");
        },
      );
    });
  });
  _addDragDrop(list, ".manage-ws-row");
}

function openNewWorkspaceModal() {
  _editingWsId = null;
  el("workspaceModalTitle").textContent = "New Workspace";
  el("workspaceName").value = "";
  el("selectedEmoji").value = "🏠";
  document
    .querySelectorAll(".emoji-picker span")
    .forEach((s) => s.classList.remove("selected"));
  document
    .querySelector('.emoji-picker span[data-emoji="🏠"]')
    ?.classList.add("selected");
  el("saveWorkspaceBtn").textContent = "Create";
  openModal("workspaceModal");
}

function openEditWorkspaceModal(wsId) {
  const ws = S.workspaces.find((w) => w.id === Number(wsId));
  if (!ws) return;
  _editingWsId = ws.id;
  el("workspaceModalTitle").textContent = "Edit Workspace";
  el("workspaceName").value = ws.name;
  el("selectedEmoji").value = ws.icon;
  document.querySelectorAll(".emoji-picker span").forEach((s) => {
    s.classList.toggle("selected", s.dataset.emoji === ws.icon);
  });
  el("saveWorkspaceBtn").textContent = "Save";
  openModal("workspaceModal");
}

function addWorkspace(name, icon) {
  const ws = { id: Date.now(), name, icon };
  S.workspaces.push(ws);
  S.wsData[ws.id] = {
    quickAccess: [],
    notes: [],
    tasks: [],
    importedBookmarks: [],
  };
  save();
  renderSidebarWorkspaces();
  renderTabsWorkspaces();
  showToast(`Workspace "${name}" created!`, "success");
}

function deleteWorkspace(e, wsId) {
  e.stopPropagation();
  if (S.workspaces.length <= 1) {
    showToast("Cannot delete the last workspace!", "error");
    return;
  }
  const ws = S.workspaces.find((w) => w.id === wsId);
  if (!ws) return;
  confirm2(
    `Delete workspace "${ws.name}"?`,
    "All notes, tasks and quick access in this workspace will be moved to trash.",
    () => {
      // Move data to trash
      const data = S.wsData[wsId];
      if (data) {
        (data.notes || []).forEach((n) =>
          S.trash.push({ ...n, _type: "note", _deletedAt: Date.now() }),
        );
        (data.tasks || []).forEach((t) =>
          S.trash.push({ ...t, _type: "task", _deletedAt: Date.now() }),
        );
      }
      delete S.wsData[wsId];
      S.workspaces = S.workspaces.filter((w) => w.id !== wsId);
      if (S.activeWsId === wsId) S.activeWsId = S.workspaces[0].id;
      save();
      renderAll();
      renderManageWorkspacesList();
      showToast(`Workspace deleted`, "success");
    },
  );
}

// ===== SHAREABLE WORKSPACES (export/import) =====
function exportWorkspace() {
  const ws = S.workspaces.find((w) => w.id === S.activeWsId);
  if (!ws) return;
  const data = S.wsData[ws.id] || {};
  const payload = {
    __novatabWorkspace: true,
    version: 1,
    exportedAt: new Date().toISOString(),
    workspace: { name: ws.name, icon: ws.icon },
    data: {
      quickAccess: data.quickAccess || [],
      notes: data.notes || [],
      tasks: data.tasks || [],
      importedBookmarks: data.importedBookmarks || [],
      folders: data.folders || [],
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `novatab-workspace-${ws.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  a.click();
  showToast(`Exported "${ws.name}"`, "success");
}

function importWorkspaceFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const d = JSON.parse(e.target.result);
      if (!d.__novatabWorkspace || !d.workspace || !d.data) {
        showToast("Not a valid workspace file", "error");
        return;
      }
      const baseName = d.workspace.name || "Imported";
      const existingNames = new Set(S.workspaces.map((w) => w.name));
      let finalName = baseName,
        n = 1;
      while (existingNames.has(finalName)) finalName = `${baseName} (${++n})`;
      const ws = { id: Date.now(), name: finalName, icon: d.workspace.icon || "📥" };
      S.workspaces.push(ws);
      S.wsData[ws.id] = {
        quickAccess: _dedupeByUrl(
          Array.isArray(d.data.quickAccess) ? d.data.quickAccess : [],
        ),
        notes: Array.isArray(d.data.notes) ? d.data.notes : [],
        tasks: Array.isArray(d.data.tasks) ? d.data.tasks : [],
        importedBookmarks: _dedupeByUrl(
          Array.isArray(d.data.importedBookmarks) ? d.data.importedBookmarks : [],
        ),
        folders: Array.isArray(d.data.folders) ? d.data.folders : [],
      };
      save();
      setActiveWorkspace(ws.id);
      renderAll();
      showToast(`Imported workspace "${finalName}"`, "success");
    } catch {
      showToast("Could not import — invalid workspace file", "error");
    }
  };
  reader.readAsText(file);
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
      <a href="${escH(item.url)}" class="folder-modal-item" target="_blank" style="flex:1">
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
            <a href="${escH(it.url)}" class="bm-item" target="_self">
              <img src="${favSrc(it.url)}" onerror="this.style.display='none'" alt="" width="16" height="16" style="border-radius:3px;flex-shrink:0">
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
              `<img class="favicon-img" src="${favSrc(bm.url)}" onerror="this.style.display='none'" alt="">`,
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
  const otherWorkspaces = S.workspaces.filter((w) => w.id !== S.activeWsId);
  menu.innerHTML = `
    <div class="bm-ctx-item" data-action="add">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add Bookmark
    </div>
    <div class="bm-ctx-item" data-action="rename">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Rename
    </div>
    ${
      otherWorkspaces.length
        ? `<div class="bm-ctx-item" data-action="move-ws">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      Move folder to workspace
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:auto"><polyline points="9,6 15,12 9,18"/></svg>
    </div>`
        : ""
    }
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
  menu
    .querySelector('[data-action="move-ws"]')
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemRect = e.currentTarget.getBoundingClientRect();
      _ctxSub.innerHTML = otherWorkspaces
        .map(
          (ws, i) =>
            `${i > 0 ? '<div class="bm-ctx-sep"></div>' : ""}
      <div class="bm-ctx-ws-header bm-ctx-ws-direct" data-wsid="${ws.id}" style="cursor:pointer">
        <span class="bm-ctx-ws-icon">${ws.icon}</span>
        <span style="flex:1">${escH(ws.name)}</span>
      </div>`,
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
      _ctxSub.querySelectorAll(".bm-ctx-ws-direct").forEach((opt) => {
        opt.addEventListener("click", async () => {
          const targetId = Number(opt.dataset.wsid);
          const src = wsData();
          const folderItems = (src.importedBookmarks || []).filter(
            (b) => b.folderName === folderName,
          );
          // Remove from current workspace
          src.importedBookmarks = (src.importedBookmarks || []).filter(
            (b) => b.folderName !== folderName,
          );
          // Also remove explicit folder entry
          if (src.folders)
            src.folders = src.folders.filter((f) => f.name !== folderName);
          // Add to target workspace
          const tgt =
            S.wsData[targetId] ||
            (S.wsData[targetId] = {
              quickAccess: [],
              notes: [],
              tasks: [],
              importedBookmarks: [],
              folders: [],
            });
          if (!tgt.importedBookmarks) tgt.importedBookmarks = [];
          if (!tgt.folders) tgt.folders = [];
          folderItems.forEach((b) => tgt.importedBookmarks.push({ ...b }));
          if (!tgt.folders.find((f) => f.name === folderName))
            tgt.folders.push({ name: folderName });
          await save();
          closeCtxMenu();
          renderWorkspaceBookmarks();
          renderSidebarFolders();
          const ws = S.workspaces.find((w) => w.id === targetId);
          showToast(
            `Folder "${folderName}" moved to ${ws?.name || "workspace"}`,
            "success",
          );
        });
      });
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
  const otherWorkspaces = S.workspaces.filter((w) => w.id !== S.activeWsId);
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
    ${
      otherWorkspaces.length
        ? `<div class="bm-ctx-item" data-action="move-ws">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      Move to workspace
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
    .querySelector('[data-action="move-ws"]')
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemRect = e.currentTarget.getBoundingClientRect();
      _ctxSub.innerHTML = otherWorkspaces
        .map((ws, i) => {
          const wsFolders = [
            ...(S.wsData[ws.id]?.folders || []).map((f) => f.name),
            ...[
              ...new Set(
                (S.wsData[ws.id]?.importedBookmarks || [])
                  .map((b) => b.folderName)
                  .filter(Boolean),
              ),
            ],
          ].filter((v, idx, a) => v && a.indexOf(v) === idx);
          const folderItems = wsFolders
            .map(
              (f) =>
                `<div class="bm-ctx-ws-folder" data-wsid="${ws.id}" data-folder="${escH(f)}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          ${escH(f)}
        </div>`,
            )
            .join("");
          return `${i > 0 ? '<div class="bm-ctx-sep"></div>' : ""}
<div class="bm-ctx-ws-header" data-ws-toggle="${ws.id}">
  <span class="bm-ctx-ws-icon">${ws.icon}</span>
  <span style="flex:1">${escH(ws.name)}</span>
  <svg class="bm-ctx-ws-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6,9 12,15 18,9"/></svg>
</div>
<div class="bm-ctx-ws-body" data-ws-body="${ws.id}" style="display:none">
${folderItems}
<div class="bm-ctx-ws-folder bm-ctx-ws-nofolder" data-wsid="${ws.id}" data-folder="">
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
  No folder
</div>
</div>`;
        })
        .join("");
      // Auto-expand first workspace
      const firstBody = _ctxSub.querySelector("[data-ws-body]");
      const firstHeader = _ctxSub.querySelector("[data-ws-toggle]");
      if (firstBody) {
        firstBody.style.display = "";
        firstHeader?.querySelector(".bm-ctx-ws-chevron")?.classList.add("open");
      }
      // Toggle collapse on header click
      _ctxSub.querySelectorAll("[data-ws-toggle]").forEach((hdr) => {
        hdr.addEventListener("click", (e) => {
          e.stopPropagation();
          const body = _ctxSub.querySelector(
            `[data-ws-body="${hdr.dataset.wsToggle}"]`,
          );
          if (!body) return;
          const open = body.style.display !== "none";
          body.style.display = open ? "none" : "";
          hdr
            .querySelector(".bm-ctx-ws-chevron")
            ?.classList.toggle("open", !open);
        });
      });
      _ctxSub.classList.add("open");
      requestAnimationFrame(() => {
        const subW = _ctxSub.offsetWidth;
        const subH = _ctxSub.offsetHeight;
        const spaceRight = window.innerWidth - itemRect.right - 8;
        const left =
          spaceRight >= subW ? itemRect.right + 4 : itemRect.left - subW - 4;
        const maxTop = window.innerHeight - subH - 8;
        _ctxSub.style.left = Math.max(4, left) + "px";
        _ctxSub.style.top = Math.min(itemRect.top, maxTop) + "px";
      });
      _ctxSub.querySelectorAll(".bm-ctx-ws-folder").forEach((opt) => {
        opt.addEventListener("click", async () => {
          const targetId = Number(opt.dataset.wsid);
          const targetFolder = opt.dataset.folder;
          const src = wsData();
          src.importedBookmarks = (src.importedBookmarks || []).filter(
            (b) => b.id !== bm.id,
          );
          const tgt =
            S.wsData[targetId] ||
            (S.wsData[targetId] = {
              quickAccess: [],
              notes: [],
              tasks: [],
              importedBookmarks: [],
              folders: [],
            });
          if (!tgt.importedBookmarks) tgt.importedBookmarks = [];
          tgt.importedBookmarks.push({
            ...bm,
            folderName: targetFolder || undefined,
          });
          await save();
          closeCtxMenu();
          closeModal("folderModal");
          renderWorkspaceBookmarks();
          renderSidebarFolders();
          const ws = S.workspaces.find((w) => w.id === targetId);
          const dest = targetFolder
            ? `"${targetFolder}" in ${ws?.name}`
            : ws?.name || "workspace";
          showToast(`Moved to ${dest}`, "success");
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
      <a class="bm-card" href="${escH(bm.url)}" target="_self" data-bmid="${escH(bm.id)}" draggable="true">
        <button class="bm-card-menu" data-bmid="${escH(bm.id)}" data-tip="Options">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
        <div class="bm-card-icon" data-letter="${escH(letter)}">
          <img src="${favSrc(bm.url)}" onerror="this.style.display='none';this.parentNode.classList.add('bm-icon-fallback')" alt="">
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
            <a href="${escH(it.url)}" class="history-item" target="_blank">
              <img src="${favSrc(it.url)}" onerror="this.style.display='none'" alt="" width="16" height="16" style="border-radius:3px;flex-shrink:0">
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
        return `<a href="${escH(item.url)}" class="qa-card" data-qaid="${item.id}" draggable="true">
      <button class="qa-menu-btn" data-qaid="${item.id}" title="Options">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
      </button>
      <div class="qa-favicon"><img src="${favSrc(item.url)}" onerror="this.style.display='none'" alt=""></div>
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
    _wsId: S.activeWsId,
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
      <img src="${favSrc(q.url)}" width="16" height="16" style="border-radius:3px;flex-shrink:0" onerror="this.style.display='none'">
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
            _wsId: S.activeWsId,
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
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener" class="md-link">${t}</a>`);
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
      _wsId: S.activeWsId,
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
  if (!container) return;
  const kb = getKanban();
  const todos = kb.todo || [];

  if (!todos.length) {
    container.innerHTML = `<div class="kd-empty">No to-dos yet — click + to add one.</div>`;
    return;
  }

  container.innerHTML = todos.map(card => `
    <div class="kd-todo-item" data-kid="${card.id}">
      <div class="kd-todo-check" data-kid="${card.id}" title="Mark done"></div>
      <span class="kd-todo-text">${escH(card.title)}</span>
      <button class="kd-todo-del" data-kid="${card.id}" title="Delete">✕</button>
    </div>`).join("");

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
      if (el("view-kanban")?.classList.contains("active")) renderKanban();
    });
  });

  container.querySelectorAll(".kd-todo-del").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.kid);
      const kb2 = getKanban();
      kb2.todo = (kb2.todo || []).filter(c => c.id !== id);
      save();
      renderKanbanDash();
      if (el("view-kanban")?.classList.contains("active")) renderKanban();
    });
  });
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
  ].filter(item => !existing.has(item.url));
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
    if (!existing.has(key)) {
      arr.push(item);
      existing.add(key);
    }
  }
  return arr;
}

// Add a sidebar link to the Home workspace's Quick Access, skipping it if a
// link to the same URL already exists there.
function _mirrorLinkToHomeQA(link) {
  const home = S.wsData[1];
  if (!home?.quickAccess) return false;
  const key = _normUrl(link.url);
  if (S._qaDeleted.has(key)) return false; // user deleted it — don't re-add
  if (home.quickAccess.some((q) => _normUrl(q.url) === key)) return false;
  home.quickAccess.push({
    id: Date.now() + Math.floor(Math.random() * 100000),
    name: link.name,
    url: link.url,
  });
  return true;
}

// ===== MIGRATION: populate sample notes/tasks for AI & Dev workspaces =====
function migrateAddWorkspaceContent() {
  let added = false;
  [2, 3].forEach((wsId) => {
    const data = S.wsData[wsId];
    if (!data) return;
    const defaults = DEFAULT_WS_DATA(wsId);
    if (Array.isArray(data.notes) && !data.notes.length && defaults.notes.length) {
      data.notes = defaults.notes;
      added = true;
    }
    if (Array.isArray(data.tasks) && !data.tasks.length && defaults.tasks.length) {
      data.tasks = defaults.tasks;
      added = true;
    }
  });
  if (added) save();
}

// ===== MIGRATION: mirror all global sidebar links into Home Quick Access =====
function migrateSyncSbLinksToQA() {
  let added = false;
  ["google", "projects", "others", "socials"].forEach((group) => {
    (S.settings.sbLinks?.[group] || []).forEach((link) => {
      if (_mirrorLinkToHomeQA(link)) added = true;
    });
  });
  if (added) save();
}

// ===== TASKS =====
function renderTasksWidget() {
  const tasks = wsTasks();
  const list = el("tasksList");
  const chip = el("tasksProgressChip");
  if (!list) return;
  if (!tasks.length) {
    list.innerHTML = `<div class="widget-empty-state">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      <span>No tasks yet</span></div>`;
    if (chip) {
      chip.className = "tasks-progress-chip";
    }
    return;
  }
  const done = tasks.filter((t) => t.done).length;
  if (chip) {
    if (done === tasks.length) {
      chip.textContent = "✓ All done";
      chip.className = "tasks-progress-chip visible all-done";
    } else {
      chip.textContent = `${done}/${tasks.length}`;
      chip.className = "tasks-progress-chip visible";
    }
  }
  list.innerHTML = tasks
    .slice(0, 6)
    .map(
      (t) => `
    <div class="task-item ${t.done ? "done" : ""}" data-tid="${t.id}">
      <div class="task-checkbox" data-tid="${t.id}"></div>
      <span class="task-text">${escH(t.text)}</span>
      <button class="task-del-btn" data-tid="${t.id}" data-tip="Delete">✕</button>
    </div>`,
    )
    .join("");
  list.querySelectorAll(".task-checkbox[data-tid]").forEach((cb) => {
    cb.addEventListener("click", () => toggleTask(Number(cb.dataset.tid)));
  });
  list.querySelectorAll(".task-del-btn[data-tid]").forEach((btn) => {
    btn.addEventListener("click", () => deleteTask(Number(btn.dataset.tid)));
  });
}

function toggleTask(id) {
  const taskId = Number(id);
  const t = wsTasks().find((t) => t.id === taskId);
  if (t) {
    t.done = !t.done;
    save();
    renderTasksWidget();
  }
}

function deleteTask(id) {
  const taskId = Number(id);
  const data = wsData();
  const t = data.tasks.find((t) => t.id === taskId);
  if (t) {
    S.trash.push({
      ...t,
      _type: "task",
      _wsId: S.activeWsId,
      _deletedAt: Date.now(),
    });
    data.tasks = data.tasks.filter((t) => t.id !== taskId);
    save();
    renderTasksWidget();
    renderTrash();
    showToast("Task deleted", "success");
  }
}

function addTask(text) {
  if (!text.trim()) return;
  wsTasks().unshift({ id: Date.now(), text: text.trim(), done: false });
  save();
  renderTasksWidget();
  showToast("Task added!", "success");
}

function loadHeroQuote() {
  // If user saved a custom quote, always show it
  const custom = S.settings.heroQuote;
  if (custom) {
    _setHeroQuote(custom.quote, custom.author);
    return;
  }
  // Show a random fallback immediately, then try the API
  const fb =
    FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  _setHeroQuote(fb.quote, fb.author);
  fetch("https://motivational-spark-api.vercel.app/api/quotes/random")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.quote) _setHeroQuote(d.quote, d.author);
    })
    .catch(() => {});
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
  const fb =
    FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  _setHeroQuote(fb.quote, fb.author);
  fetch("https://motivational-spark-api.vercel.app/api/quotes/random")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.quote) _setHeroQuote(d.quote, d.author);
    })
    .catch(() => {});
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
  const quote = txt.textContent.trim();
  const author = auth.textContent.replace(/^—\s*/, "").trim();
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
  const tasks = wsTasks().filter((t) => !t.done);
  const taskList =
    tasks
      .slice(0, 5)
      .map((t) => `- ${t.text}`)
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
    <span>Add your Anthropic API key to enable AI-generated briefings.</span>
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
let _organizeResults = []; // [{title, url, workspace}]

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
  if (S.workspaces.length < 1) {
    body.innerHTML = `<div class="organize-empty">Create a workspace first.</div>`;
    return;
  }

  body.innerHTML = `<div class="cmd-ai-loading"><div class="cmd-ai-spinner"></div>Scanning open tabs…</div>`;
  const tabs = await new Promise((res) => chrome.tabs.query({}, res));
  const ownPrefix = chrome.runtime.getURL("");
  const existingUrls = new Set();
  S.workspaces.forEach((ws) =>
    (S.wsData[ws.id]?.importedBookmarks || []).forEach((b) =>
      existingUrls.add(_normUrl(b.url)),
    ),
  );
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

  body.innerHTML = `<div class="cmd-ai-loading"><div class="cmd-ai-spinner"></div>Asking AI to sort ${candidates.length} tab${candidates.length === 1 ? "" : "s"}…</div>`;
  const wsNames = S.workspaces.map((w) => w.name);
  const list = candidates
    .map((t, i) => `${i}. [${getDomain(t.url)}] ${(t.title || t.url).slice(0, 80)}`)
    .join("\n");
  const prompt = `You are sorting browser tabs into existing workspaces.
Workspaces: ${wsNames.join(", ")}

Tabs:
${list}

For each numbered tab, pick the single best-matching workspace from the list above. Respond with ONLY a JSON array (no markdown, no commentary), one object per tab in the same order: {"workspace": "<exact workspace name from the list>"}`;

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
      workspace: wsNames.includes(parsed?.[i]?.workspace)
        ? parsed[i].workspace
        : S.workspaces.find((w) => w.id === S.activeWsId)?.name || wsNames[0],
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
    (groups[r.workspace] = groups[r.workspace] || []).push(i);
  });
  body.innerHTML = Object.entries(groups)
    .map(
      ([wsName, idxs]) => `
    <div class="organize-group">
      <div class="organize-group-title">${escH(wsName)} <span class="cmd-domain-tag">${idxs.length}</span></div>
      ${idxs
        .map((i) => {
          const r = _organizeResults[i];
          return `<label class="organize-item">
            <input type="checkbox" checked data-organize-idx="${i}">
            <img src="${favSrc(r.url)}" onerror="this.style.opacity=0" alt="">
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
  checked.forEach((cb) => {
    const r = _organizeResults[Number(cb.dataset.organizeIdx)];
    if (!r) return;
    const ws =
      S.workspaces.find((w) => w.name === r.workspace) ||
      S.workspaces.find((w) => w.id === S.activeWsId);
    if (!ws) return;
    if (!S.wsData[ws.id]) S.wsData[ws.id] = DEFAULT_WS_DATA(ws.id);
    const d = S.wsData[ws.id];
    if (!d.importedBookmarks) d.importedBookmarks = [];
    d.importedBookmarks.push({
      id: "ai_" + Date.now() + "_" + count,
      title: r.title,
      url: r.url,
      folderName: "Smart Organize",
    });
    d.importedBookmarks = _dedupeByUrl(d.importedBookmarks);
    count++;
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
  T.iv = setInterval(() => {
    if (T.remaining <= 0) {
      clearInterval(T.iv);
      T.running = false;
      el("timerPlayBtn").innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
      applyFocusBlockRules(false);
      _timerAudioDing();
      showToast("⏰ Focus session complete! Great job!", "success");
      _notifyUser("novatab Focus Complete", { body: `${Math.round(T.total / 60)}m session done! Take a break.`, icon: "icons/favicon.png" });
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
  chrome.notifications.create("novatab-" + Date.now(), {
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
      _notifyUser("novatab Habits", { body: `You have ${unchecked.length} habit${unchecked.length > 1 ? "s" : ""} to track today.`, icon: "icons/favicon.png" });
    }
  }, delay);
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

// Toggle declarativeNetRequest rules that block S.settings.focus.blockedSites.
// `active` reflects whether a focus session is currently running; blocking
// only takes effect when the user has also enabled Focus Mode in settings.
async function applyFocusBlockRules(active) {
  if (!IS_CHROME || !chrome.declarativeNetRequest) return;
  const sites = S.settings.focus?.blockedSites || [];
  const removeRuleIds = sites.map((_, i) => FOCUS_RULE_BASE_ID + i);
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
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
  } catch (e) {
    console.warn("Focus mode: failed to update block rules", e);
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

function saveFocusModeSettings() {
  const lines = el("focusModeSites").value.split("\n");
  const sites = [];
  const seen = new Set();
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const domain = getDomain(safeUrl(trimmed) || trimmed) || trimmed;
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
  applyFocusBlockRules(T.running);
  closeModal("focusModeModal");
  showToast("Focus mode settings saved", "success");
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
      const name = item.name || item.text || item.title || "Item";
      const icon =
        item._type === "task"
          ? "✅"
          : item._type === "quickAccess"
            ? "⚡"
            : "📝";
      const key = item.id || item._deletedAt;
      const typeClass =
        item._type === "task"
          ? "task-type"
          : item._type === "quickAccess"
            ? "qa-type"
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
    btn.addEventListener("click", () => restoreItem(Number(btn.dataset.key)));
  });
}

function restoreItem(key) {
  const idx = S.trash.findIndex((i) => (i.id || i._deletedAt) === key);
  if (idx === -1) return;
  const item = S.trash.splice(idx, 1)[0];
  const wsId = item._wsId || S.activeWsId;
  if (!S.wsData[wsId])
    S.wsData[wsId] = { quickAccess: [], notes: [], tasks: [] };
  if (item._type === "task")
    S.wsData[wsId].tasks.unshift({
      id: item.id || Date.now(),
      text: item.text,
      done: false,
    });
  else if (item._type === "note")
    S.wsData[wsId].notes.unshift({
      id: item.id || Date.now(),
      title: item.title,
      content: item.content,
      date: item.date || Date.now(),
    });
  else if (item._type === "quickAccess")
    S.wsData[wsId].quickAccess.unshift({
      id: item.id || Date.now(),
      name: item.name,
      url: item.url,
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

  let totalNotes = 0,
    totalTasksDone = 0,
    totalTasksPending = 0,
    totalQA = 0;
  S.workspaces.forEach((ws) => {
    const d = S.wsData[ws.id] || {};
    totalNotes += (d.notes || []).length;
    (d.tasks || []).forEach((t) => {
      if (t.done) totalTasksDone++;
      else totalTasksPending++;
    });
    totalQA += (d.quickAccess || []).length;
  });
  const totalTasks = totalTasksDone + totalTasksPending;
  const taskRate =
    totalTasks > 0 ? Math.round((totalTasksDone / totalTasks) * 100) : 0;
  const totalHabits = S.habits.length;
  const totalReadingItems = S.readingQueue.length;
  const totalCalEvents = S.calEvents.length;
  const doneReading = S.readingQueue.filter((r) => r.done).length;
  const today = new Date().toISOString().slice(0, 10);
  const habitsCompletedToday = S.habits.filter((h) =>
    (h.completions || []).includes(today),
  ).length;

  const topFolders = [...S.allBookmarks]
    .sort((a, b) => (b.items || []).length - (a.items || []).length)
    .slice(0, 8);
  const maxFolderSize = (topFolders[0]?.items || []).length || 1;

  const wsRows = S.workspaces.map((ws) => {
    const d = S.wsData[ws.id] || {};
    return {
      ws,
      notes: (d.notes || []).length,
      tasks: (d.tasks || []).length,
      done: (d.tasks || []).filter((t) => t.done).length,
      qa: (d.quickAccess || []).length,
    };
  });

  const tagCounts = {};
  S.workspaces.forEach((ws) => {
    (S.wsData[ws.id]?.notes || []).forEach((note) => {
      (note.tags || []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
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
  const allNotes = [];
  S.workspaces.forEach((ws) =>
    (S.wsData[ws.id]?.notes || []).forEach((n) =>
      allNotes.push({ ...n, _ws: ws.name }),
    ),
  );
  allNotes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const recentNotes = allNotes.slice(0, 5);

  // Pending tasks across all workspaces
  const allPending = [];
  S.workspaces.forEach((ws) =>
    (S.wsData[ws.id]?.tasks || [])
      .filter((t) => !t.done)
      .forEach((t) =>
        allPending.push({ ...t, _ws: ws.name, _wsIcon: ws.icon }),
      ),
  );
  const pendingDisplay = allPending.slice(0, 6);
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
        <div class="insights-kpi-trend neutral">${S.workspaces.length} workspaces</div>
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
              <span class="ins-row-sub">${escH(t._wsIcon || "")} ${escH(t._ws)}</span>
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
                  const done = (h.completions || []).includes(today);
                  const streak = (h.completions || []).reduce(
                    (s, d, i, arr) => {
                      if (i === 0) return 1;
                      const prev = new Date(arr[i - 1]);
                      const cur = new Date(d);
                      const diff = Math.round((cur - prev) / 86400000);
                      return diff === 1 ? s + 1 : 1;
                    },
                    h.completions?.length ? 1 : 0,
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

    <!-- Row: Workspaces | Bookmarks | Account -->
    <div class="insights-section-hd">Overview</div>
    <div class="insights-cards-row">

      <div class="insights-card">
        <div class="insights-card-hd">
          <span class="insights-card-title">Workspaces</span>
          <span class="insights-card-badge muted">${S.workspaces.length}</span>
        </div>
        ${wsRows
          .map(
            (r) => `
          <div class="ins-row">
            <div class="ins-row-left">
              <span style="font-size:16px">${escH(r.ws.icon)}</span>
              <span class="ins-row-label">${escH(r.ws.name)}</span>
            </div>
            <div style="display:flex;gap:6px;font-size:11px;color:var(--text-3)">
              <span>${r.notes}n</span><span>·</span><span>${r.tasks}t</span><span>·</span><span>${r.qa}qa</span>
            </div>
          </div>`,
          )
          .join("")}
      </div>

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
              ? `<img src="${escH(pic)}" class="ins-avatar-img" onerror="this.style.display='none'">`
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
        <div class="ins-row"><span class="ins-row-label">Data version</span><span class="ins-row-sub">novatab 1.x</span></div>
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
      return d.toISOString().slice(0, 10);
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
      return d.toISOString().slice(0, 10);
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
              <img src="${favSrc(s.url)}" style="width:16px;height:16px;border-radius:3px;flex-shrink:0" onerror="this.style.display='none'">
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
              <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=16" style="width:13px;height:13px;border-radius:2px;flex-shrink:0" onerror="this.style.display='none'">
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
  S.settings.showSeconds = el("showSecondsToggle").checked;
  const glowBtn = document.querySelector("#cardGlowGroup .toggle-opt.active");
  S.settings.cardGlow = glowBtn?.dataset.glow || "glow";
  S.settings.e2e = S.settings.e2e || {};
  S.settings.e2e.enabled = el("e2eToggle").checked;
  await _e2eSavePassphrase(el("e2ePassphrase").value);
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
}

// Export / Import
function exportData() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          user: S.user,
          workspaces: S.workspaces,
          wsData: S.wsData,
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
  a.download = `novatab-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  showToast("Data exported!", "success");
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const d = JSON.parse(e.target.result);
      if (d.workspaces) S.workspaces = d.workspaces;
      if (d.wsData) S.wsData = d.wsData;
      if (d.user) S.user = d.user;
      if (d.settings) S.settings = { ...S.settings, ...d.settings };
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

  // Bookmarks — combine Chrome bookmarks + workspace bookmarks, deduplicate, sort by score
  const allBmCandidates = [];
  for (const f of S.allBookmarks) {
    for (const it of f.items) allBmCandidates.push(it);
  }
  for (const ws of S.workspaces) {
    for (const bm of S.wsData[ws.id]?.importedBookmarks || []) {
      if (!allBmCandidates.find((b) => b.url === bm.url)) allBmCandidates.push({ title: bm.title, url: bm.url });
    }
    for (const qa of S.wsData[ws.id]?.quickAccess || []) {
      if (!allBmCandidates.find((b) => b.url === qa.url)) allBmCandidates.push({ title: qa.name, url: qa.url });
    }
  }
  const bmMatches = allBmCandidates
    .map((it) => ({ it, score: scoreItem(it.title, it.url) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.it);

  // Notes
  const noteMatches = [];
  for (const ws of S.workspaces) {
    for (const n of S.wsData[ws.id]?.notes || []) {
      if (_fuzzyMatch(n.title || "", q) || _fuzzyMatch(n.content || "", q)) noteMatches.push(n);
    }
  }

  // Tasks
  const taskMatches = [];
  for (const ws of S.workspaces) {
    for (const t of S.wsData[ws.id]?.tasks || []) {
      if (_fuzzyMatch(t.text || "", q)) taskMatches.push(t);
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
      <a href="${escH(bm.url)}" class="cmd-result-item" target="_self" data-cmd-item>
        <div class="cmd-favicon-wrap"><img src="${favSrc(bm.url)}" onerror="this.style.opacity=0" alt=""></div>
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

  html += `<a href="https://www.google.com/search?q=${encodeURIComponent(q)}" class="cmd-result-item cmd-google-item" target="_blank" data-cmd-item>
    <div class="cmd-google-icon">G</div>
    <div class="cmd-google-label">Search Google for <em>"${escH(q)}"</em></div>
  </a>`;

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
        navigateTo("home");
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
        <div class="cmd-favicon-wrap"><img src="${favSrc(t.url)}" onerror="this.style.opacity=0" alt=""></div>
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
      <a href="${escH(h.url)}" class="cmd-result-item" target="_blank" data-cmd-item>
        <div class="cmd-favicon-wrap"><img src="${favSrc(h.url)}" onerror="this.style.opacity=0" alt=""></div>
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
    ${isFollowUp ? `<div class="cmd-ai-history-badge">Conversation (${historyLen / 2 | 0} turns) · <button class="cmd-ai-clear-btn" onclick="_aiResetConversation();el('cmdResults').innerHTML='';el('cmdInput').value='';el('cmdInput').focus()">Clear</button></div>` : ""}
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
    ${turns > 1 ? `<div class="cmd-ai-history-badge">Conversation (${turns} turns) · <button class="cmd-ai-clear-btn" onclick="_aiResetConversation();el('cmdResults').innerHTML='';el('cmdInput').value='';el('cmdInput').focus()">Clear</button></div>` : ""}
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
// key string format: "Alt+K", "Ctrl+Shift+T", or single char "/"
function _kbMatch(e, keyStr) {
  if (!keyStr) return false;
  const parts = keyStr.split("+").map((s) => s.toLowerCase().trim());
  const mainKey = parts.at(-1);
  const needsAlt = parts.includes("alt");
  const needsCtrl = parts.includes("ctrl");
  const needsShift = parts.includes("shift");
  return (
    e.key.toLowerCase() === mainKey &&
    !!e.altKey === needsAlt &&
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
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(q)}`,
          "_blank",
        );
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
    renderBmWorkspaceTabs();
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
  if (view === "kanban") renderKanban();
}

function renderBmWorkspaceTabs() {
  const bar = el("bmWsTabs");
  if (!bar) return;
  bar.innerHTML = S.workspaces
    .map(
      (ws) => `
    <div class="bm-ws-tab ${ws.id === S.activeWsId ? "active" : ""}" data-wsid="${ws.id}">
      <span>${ws.icon}</span>
      <span>${escH(ws.name)}</span>
    </div>`,
    )
    .join("");
  bar.querySelectorAll(".bm-ws-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveWorkspace(tab.dataset.wsid);
      S.bmFolderFilter = null;
      renderBmWorkspaceTabs();
      renderBmForActiveWorkspace();
    });
  });
}

function renderBmForActiveWorkspace() {
  const items = wsBookmarks();
  const q = (el("bookmarkSearch")?.value || "").toLowerCase().trim();

  if (!items.length) {
    renderBmToolbar([]);
    el("allBookmarksList").innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔖</div>
        <div class="empty-state-text">No bookmarks in this workspace.<br>Click + to add one.</div>
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
            <a href="${escH(bm.url)}" class="bm-item" target="_self">
              <img src="${favSrc(bm.url)}" onerror="this.style.display='none'" alt="" width="16" height="16" style="border-radius:3px;flex-shrink:0">
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
    save();
  });
  el("weatherWidget").addEventListener("click", openWeatherLocationModal);

  // Nav — sidebar items with data-view
  document.querySelectorAll(".sb-item[data-view]").forEach((n) => {
    n.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(n.dataset.view);
    });
  });

  // Sidebar remove buttons — event delegation (CSP-safe, no inline onclick)
  el("sbNav")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".sb-rm-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const { rmWs, rmGroup, rmId } = btn.dataset;
    if (rmId !== undefined && rmWs !== undefined) {
      removeSbLink(Number(rmWs), Number(rmId));
    } else if (rmId !== undefined && rmGroup !== undefined) {
      removeSbGlobalLink(rmGroup, Number(rmId));
    }
  });

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

  // Shareable workspaces — export/import
  el("exportWorkspaceBtn").addEventListener("click", exportWorkspace);
  el("importWorkspaceBtn").addEventListener("click", () =>
    el("importWorkspaceFileInput").click(),
  );
  el("importWorkspaceFileInput").addEventListener("change", (e) => {
    if (e.target.files[0]) importWorkspaceFile(e.target.files[0]);
    e.target.value = "";
  });

  // Granular data clear
  el("clearNotesBtn").addEventListener("click", () => {
    confirm2(
      "Clear All Notes?",
      "All notes in the current workspace will be moved to Trash.",
      () => {
        const data = wsData();
        (data.notes || []).forEach((n) =>
          S.trash.push({
            ...n,
            _type: "note",
            _wsId: S.activeWsId,
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
      "Clear All Tasks?",
      "All tasks in the current workspace will be moved to Trash.",
      () => {
        const data = wsData();
        (data.tasks || []).forEach((t) =>
          S.trash.push({
            ...t,
            _type: "task",
            _wsId: S.activeWsId,
            _deletedAt: Date.now(),
          }),
        );
        data.tasks = [];
        save();
        renderTasksWidget();
        renderTrash();
        showToast("Tasks cleared", "success");
      },
    );
  });
  el("clearQuickAccessBtn").addEventListener("click", () => {
    confirm2(
      "Clear Quick Access?",
      "All quick access links in the current workspace will be removed.",
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
      "This will permanently delete all your notes, tasks, workspaces and settings. This cannot be undone.",
      () => {
        S.workspaces = DEFAULT_WORKSPACES;
        S.activeWsId = 1;
        S.wsData = {};
        S.weatherLocation = null;
        S.workspaces.forEach(
          (ws) => (S.wsData[ws.id] = DEFAULT_WS_DATA(ws.id)),
        );
        S.trash = [];
        S.settings = {
          theme: "dark",
          accentColor: "#fe8019",
          clockFormat: "12",
          showSeconds: true,
          cardGlow: "glow",
          widgets: {
            notes: true,
            timer: true,
          },
          heroBg: null,
          qaMode: "icon",
        };
        S.habits = [];
        S.readingQueue = [];
        S.tabSessions = [];
        S.journal = {};
        S.kanban = {};
        save();
        renderAll();
        applyTheme("dark");
        applyAccent("#fe8019");
        applyCardGlow("glow");
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

  // Workspaces (buttons now live inside sidebar Work tab)
  el("addWorkspaceBtn")?.addEventListener("click", openNewWorkspaceModal);
  el("newWorkspaceTabBtn")?.addEventListener("click", openNewWorkspaceModal);
  el("manageWorkspacesBtn")?.addEventListener("click", () => {
    renderManageWorkspacesList();
    openModal("manageWorkspacesModal");
  });
  el("manageWsAddBtn").addEventListener("click", () => {
    closeModal("manageWorkspacesModal");
    openNewWorkspaceModal();
  });
  document.querySelector(".emoji-picker span")?.classList.add("selected");
  document.querySelectorAll(".emoji-picker span").forEach((s) => {
    s.addEventListener("click", () => {
      document
        .querySelectorAll(".emoji-picker span")
        .forEach((x) => x.classList.remove("selected"));
      s.classList.add("selected");
      el("selectedEmoji").value = s.dataset.emoji;
    });
  });
  el("saveWorkspaceBtn").addEventListener("click", () => {
    const name = el("workspaceName").value.trim();
    const icon = el("selectedEmoji").value;
    if (!name) {
      showToast("Enter a workspace name", "error");
      return;
    }
    if (_editingWsId !== null) {
      const ws = S.workspaces.find((w) => w.id === _editingWsId);
      if (ws) {
        ws.name = name;
        ws.icon = icon;
      }
      save();
      renderSidebarWorkspaces();
      renderTabsWorkspaces();
      showToast("Workspace updated!", "success");
    } else {
      addWorkspace(name, icon);
    }
    _editingWsId = null;
    closeModal("workspaceModal");
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

  // Tasks (widget removed from dashboard — kept for data compat)
  el("addTaskBtn")?.addEventListener("click", () => openModal("taskModal"));
  el("saveTaskBtn").addEventListener("click", () => {
    const t = el("taskInput").value.trim();
    if (!t) {
      showToast("Enter a task!", "error");
      return;
    }
    addTask(t);
    el("taskInput").value = "";
    closeModal("taskModal");
  });
  el("taskInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") el("saveTaskBtn").click();
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
        ? `<img src="${escH(pic)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">`
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
    openModal("taskModal");
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

  // ── Sidebar + (add link) buttons ───────────────────────────────────────
  document.querySelectorAll(".sb-gplus").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openSbAddLink(btn.dataset.addlink);
    });
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
  el("kanbanDashOpenBtn")?.addEventListener("click", () => navigateTo("kanban"));
  el("kanbanDashAddBtn")?.addEventListener("click", () => openKanbanCardModal("todo"));
  document.querySelectorAll(".kanban-add-card").forEach((btn) => {
    btn.addEventListener("click", () => openKanbanCardModal(btn.dataset.col));
  });
  el("kanbanCardSaveBtn")?.addEventListener("click", saveKanbanCard);
  el("kanbanCardTitleInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveKanbanCard();
  });
  el("kanbanAiParseBtn")?.addEventListener("click", _kanbanParseAI);

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
    el("syncCard")?.classList.toggle("popup-open");
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
          return `<div class="habit-day ${done ? "done" : ""}" title="${day}" onclick="toggleHabitDay(${h.id},'${day}')">${label}</div>`;
        })
        .join("");
      return `<div class="habit-row">
      <span class="habit-emoji">${h.emoji || "⭐"}</span>
      <span class="habit-name">${escH(h.name)}</span>
      <span class="habit-streak" title="Current streak">${streak}🔥</span>
      <div class="habit-days">${dayBtns}</div>
      <button class="habit-del" onclick="deleteHabit(${h.id})" title="Delete habit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>`;
    })
    .join("");
}

function _todayKey() {
  return _dateKey(new Date());
}
function _dateKey(d) {
  return d.toISOString().slice(0, 10);
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
        <img src="${favSrc(item.url)}" alt="" onerror="this.style.display='none'">
      </div>
      <div class="reading-info">
        <div class="reading-title" onclick="window.open('${escH(item.url)}','_blank')">${escH(item.title)}</div>
        <div class="reading-url">${escH(getDomain(item.url))}</div>
      </div>
      <button class="reading-done-btn ${item.done ? "done" : ""}" onclick="toggleReadingDone(${item.id})" title="Mark as read">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
      </button>
      <button class="reading-del" onclick="deleteReading(${item.id})" title="Remove">
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
  const url = el("readingUrlInput").value.trim();
  if (!url) {
    showToast("Enter a URL", "error");
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
        <button class="session-restore-btn" onclick="restoreSession(${s.id})">Open All</button>
        <button class="session-del" onclick="deleteSession(${s.id})" title="Delete session">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="session-tabs-list">
        ${s.tabs
          .slice(0, 8)
          .map(
            (t) => `
          <a href="${escH(t.url)}" class="session-tab" target="_blank" rel="noopener">
            <img src="${t.favicon || ""}" alt="" onerror="this.style.display='none'" width="14" height="14">
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
    html += `<div class="${cls}" onclick="selectJournalDay('${key}')">${d}</div>`;
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

// ===== FEATURE 5: KANBAN BOARD ==========================================
let _kanbanTargetCol = null;

function getKanban() {
  const wsId = S.activeWsId;
  if (!S.kanban[wsId]) S.kanban[wsId] = { todo: [], doing: [], done: [] };
  return S.kanban[wsId];
}

function renderKanban() {
  const kb = getKanban();
  ["todo", "doing", "done"].forEach((col) => {
    const cards = kb[col] || [];
    const container = el(`kanban-${col}-cards`);
    const count = el(`kanban-${col}-count`);
    if (count) count.textContent = cards.length;
    if (!container) return;
    container.innerHTML = cards
      .map(
        (card) => `
      <div class="kanban-card" draggable="true" data-col="${col}" data-id="${card.id}">
        <div class="kanban-card-title">${escH(card.title)}</div>
        ${card.desc ? `<div class="kanban-card-meta"><span>${escH(card.desc)}</span><button class="kanban-card-del" onclick="deleteKanbanCard('${col}',${card.id})" title="Delete">✕</button></div>` : `<div class="kanban-card-meta"><span></span><button class="kanban-card-del" onclick="deleteKanbanCard('${col}',${card.id})" title="Delete">✕</button></div>`}
      </div>`,
      )
      .join("");
    container.querySelectorAll(".kanban-card").forEach((card) => {
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

function openKanbanCardModal(col) {
  _kanbanTargetCol = col;
  el("kanbanCardModalTitle").textContent =
    col === "todo"
      ? "Add To-Do"
      : col === "doing"
        ? "Add In-Progress Card"
        : "Add Done Card";
  el("kanbanCardTitleInput").value = "";
  el("kanbanCardDescInput").value = "";
  if (el("kanbanAiInput")) el("kanbanAiInput").value = "";
  if (el("kanbanAiResult")) { el("kanbanAiResult").style.display = "none"; el("kanbanAiResult").innerHTML = ""; }
  openModal("kanbanCardModal");
  // Show AI section only if AI is enabled
  const aiSection = el("kanbanAiSection");
  if (aiSection) aiSection.style.display = S.settings.ai?.enabled ? "" : "none";
  setTimeout(() => (S.settings.ai?.enabled ? el("kanbanAiInput")?.focus() : el("kanbanCardTitleInput")?.focus()), 80);
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
        if (t) kb[_kanbanTargetCol].push({ id: Date.now() + idx, title: t.title, desc: t.desc || "", createdAt: Date.now() });
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
  const kb = getKanban();
  if (!kb[_kanbanTargetCol]) kb[_kanbanTargetCol] = [];
  kb[_kanbanTargetCol].push({
    id: Date.now(),
    title,
    desc,
    createdAt: Date.now(),
  });
  save();
  closeModal("kanbanCardModal");
  renderKanban();
  renderKanbanDash();
}

function deleteKanbanCard(col, id) {
  const kb = getKanban();
  kb[col] = (kb[col] || []).filter((c) => c.id !== id);
  save();
  renderKanban();
  renderKanbanDash();
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
         onclick="applyHeroColor('${c.hex}')"></div>`,
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

// ===== CALENDAR WIDGET ================================================
function renderCalendarWidget() {
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
  return S.calEvents.some((ev) => calEventOccursOn(ev, d));
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
      if (calEventOccursOn(ev, date)) upcoming.push({ ev, date });
    });
  }
  upcoming.sort((a, b) => a.date - b.date);
  const shown = upcoming.slice(0, 5);
  if (!shown.length) {
    listEl.innerHTML = "";
    return;
  }
  listEl.innerHTML = shown
    .map(
      ({ ev, date }) =>
        `<div class="cal-event-item">
      <div class="cal-event-dot"></div>
      <span class="cal-event-text">${escH(ev.title)}</span>
      <span style="font-size:10px;color:var(--text-3);flex-shrink:0">${date.getDate()}/${date.getMonth() + 1}</span>
      <button class="cal-event-del" onclick="deleteCalEvent(${ev.id})">✕</button>
    </div>`,
    )
    .join("");
}

function openCalEventModal(dateStr) {
  el("calEventModalTitle").textContent = dateStr
    ? `Add Event — ${dateStr}`
    : "Add Event";
  el("calEventTitle").value = "";
  el("calEventDate").value = dateStr || new Date().toISOString().slice(0, 10);
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
  const startDate = dateVal || new Date().toISOString().slice(0, 10);

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
window.setActiveWorkspace = setActiveWorkspace;
window.deleteWorkspace = deleteWorkspace;
window.openEditWorkspaceModal = openEditWorkspaceModal;
window.openNewWorkspaceModal = openNewWorkspaceModal;
window.openFolderModal = openFolderModal;
window.toggleBmFolder = toggleBmFolder;
window.closeModal = closeModal;
window.openNoteEdit = openNoteEdit;
window.deleteNoteById = deleteNoteById;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
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
window.removeSbLink = removeSbLink;
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
window.removeSbGlobalLink = removeSbGlobalLink;
window.deleteCalEvent = deleteCalEvent;
window.signOut = signOut;
window.signIn = signIn;
window.pushToDrive = pushToDrive;
window.pullFromDrive = pullFromDrive;
