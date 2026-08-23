# 🟧 Nestpane

<div align="center">
  <img src="logo.svg" alt="Nestpane Logo" width="120" height="120">
  <h3>Your browser's new happy place.</h3>
  <p>A sleek, dark-mode, productivity-focused Chrome New Tab extension and landing page.</p>
  
  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F0F0F?style=for-the-badge&logo=tailwind-css&logoColor=#FF6B00)
  ![Netlify](https://img.shields.io/badge/Deployed_on-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
</div>

---

## 📖 Overview
Nestpane replaces your default Chrome new tab screen with a beautifully designed, customizable dashboard. Built with a privacy-first approach, all your data (to-dos, bookmarks, widgets) stays local on your browser. No tracking, no telemetry.

This repository contains the official Nestpane landing site and comprehensive legal pages, built with pure HTML, Tailwind CSS, and Vanilla JS.

## 📄 Pages Included
- **`index.html`** — The main landing page with Hero, Features, Interactive Mockup, and FAQ.
- **`about.html`** — The mission statement and design philosophy behind Nestpane.
- **`privacy.html`** — Comprehensive, GDPR/CCPA compliant Privacy Policy.
- **`terms.html`** — Complete Terms of Service governing the use of the extension and site.

---

## 🎨 Design System & Branding

Nestpane relies on a dual-font system and a strict dark-mode color palette to balance modern tech aesthetics with high readability.

### Typography
| Role | Font | Usage | Tracking (Letter-Spacing) |
| :--- | :--- | :--- | :--- |
| **Display** | `Space Grotesk` | Headlines, Logo Wordmark, Numbers | `-0.02em` to `-0.05em` |
| **Body** | `Inter` | Paragraphs, UI elements, Navigation links | Normal |

**Google Fonts Import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
```

### Color Palette

| Role | Hex Code | Usage |
| :--- | :--- | :--- |
| **Primary Accent** | `#FF6B00` | Buttons, Logo background, Active states, Hover glows |
| **Background Base** | `#0F0F0F` | Main page background (Deep Charcoal) |
| **Background Secondary**| `#1A1A1A` | Cards, Browser Mockups, Inner sections |
| **Text Primary** | `#FFFFFF` | Main headings, bold text, "Nest" in wordmark |
| **Text Secondary** | `#E0E0E0` | Body copy, paragraphs |
| **Text Muted** | `#9CA3AF` (Gray-400)| Icons, placeholders, unactive links |

### Logo & Branding Concept
- **The Monogram:** The icon features the letters "NP" constructed from a grid of small, mathematically precise square blocks, contained within a larger rounded orange square. This represents "building blocks," modularity, and structure.
- **Wordmark:** The text "Nestpane" uses the Space Grotesk font with a tight tracking of `-0.02em`.
  - "Nest" is colored in pure White (`#FFFFFF`).
  - "Pane" is colored in the Primary Accent Orange (`#FF6B00`).

### UI Elements & Styling
To keep the site consistent, the following reusable styles are used across all pages:

**1. Grid Background:**
A subtle CSS grid pattern is applied to the body background to give depth.
```css
.grid-bg {
    background-image: 
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
}
```

**2. Cards:**
Rounded corners (`rounded-2xl`), secondary background (`#1A1A1A`), and thin white borders with 5% opacity (`border border-white/5`). Hover states transition to orange (`hover:border-[#FF6B00]/30`).

**3. Buttons:**
Pill-shaped (`rounded-full`), utilizing hover glows for primary CTAs.
```css
.btn-glow:hover {
    box-shadow: 0 0 25px rgba(255, 107, 0, 0.4);
}
```

---

## 📂 Project Structure

```text
nestpane/
├── index.html                        # Landing page
├── about.html                        # About / Mission page
├── privacy.html                      # Comprehensive Privacy Policy
├── terms.html                        # Comprehensive Terms of Service
├── README.md                         # You are here
├── favicon.svg                       # Browser tab favicon
├── logo.svg / logo.png               # Nest bowl logo (SVG source / PNG raster)
└── googleee397e5ec21b3ad7.html       # Google Search Console site-ownership verification file
```

> ⚠️ **Do not delete `googleee397e5ec21b3ad7.html`** — it's a legacy Search Console verification file for the old `nestpane.netlify.app` URL-prefix property. It's harmless to keep and still resolves fine, but it's **no longer the active verification** backing the OAuth consent screen.
>
> **The site is now served at `nestpane.kneeraazon.com`**, not `nestpane.netlify.app` (though the latter still resolves to the same deployment). Google's OAuth verification rejects homepages hosted on shared platform subdomains like `netlify.app` — see [Google's guidance](https://support.google.com/cloud/answer/13807376) — no matter how many times Search Console's URL-prefix method verifies successfully. The fix was moving to a subdomain of an existing owned domain (DNS on Cloudflare, CNAME'd to `nestpane.netlify.app`), verified in Search Console as a **Domain property** (covers every subdomain automatically, unlike URL-prefix). If you change the custom domain again, update this file's references, `index.html`'s canonical/og tags, the self-links in `privacy.html`/`terms.html`, and the OAuth consent screen fields all together.

## 🚀 Local Development

This site is built with pure HTML, Tailwind CSS (via CDN), and Vanilla JS. No build tools are required.

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nestpane.git
   ```
2. Navigate to the folder:
   ```bash
   cd nestpane
   ```
3. Open `index.html` in your browser to view the landing page locally.

## ☁️ Deployment (Netlify)

This site is configured for zero-config static hosting on Netlify.
1. Push your repository to GitHub.
2. Log into [Netlify](https://app.netlify.com/).
3. Click "Add new site" -> "Import an existing project".
4. Connect your GitHub repository.
5. No build command or base directory is needed. Netlify will automatically detect the HTML files and deploy them.

---

## 📄 License

Nestpane is open source under the [MIT License](https://github.com/karkinirajan/Nestpane/blob/main/LICENSE) — use, modify, and redistribute it freely, including commercially, as long as the copyright notice is kept.

The **Nestpane name and logo** are the project's brand identity and aren't covered by the code license — please don't use them to imply a modified or unofficial build is the official Nestpane product.

For questions, please contact [kneeraazon.com](https://kneeraazon.com).