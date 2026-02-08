# Jake's Extension

Jake's Extension is a Manifest V3 browser extension that quickly extracts and audits useful page data from a popup menu. It replaces several third-party extensions I previously used, in an attempt to reduce my exposure to supply chain attacks.

It opens results in a new tab and supports exporting results to JSON and CSV (where applicable).

## Features

### 1) Show all linked images on page
- Finds image URLs from:
  - image links (`a[href]` that look like image URLs)
  - visible images (`img/src`, `img/srcset`, `source/srcset`)
  - CSS background images (`background-image`)
- Deduplicates URLs
- Shows optional thumbnails (toggle)

### 2) Extract all links
- Collects all unique links on the page
- Labels links as internal or external
- Includes basic metadata like `nofollow`, target, and occurrence count

### 3) Find and copy emails / phone numbers
- Extracts emails and phone numbers from visible text and `mailto:` / `tel:` links
- Groups and deduplicates results
- Includes one-click copy buttons for emails and phone numbers

### 4) SEO snapshot
- Shows common SEO metadata and checks, including:
  - title and length
  - meta description and length
  - canonical URL
  - robots tag
  - H1 count
  - Open Graph / Twitter metadata
  - basic issue flags

### 5) Summarize page structure
- Counts common page elements (headings, paragraphs, links, forms, tables, media, scripts, etc.)
- Includes heading level counts and sample heading text

### 6) Table Export
- Detects HTML tables on the page
- Shows a preview of each table
- Supports per-table CSV and JSON export, plus combined CSV export

### 7) Color palette extractor
- Finds top visible colors used on the page
- Shows ranked swatches with HEX/RGB values and usage counts

### 8) Readability mode
- Extracts the main readable article-like content
- Presents simplified text view in the results tab

### 9) Performance hints
- Runs lightweight heuristic checks (not a full Lighthouse audit)
- Flags common issues such as potentially oversized images and blocking scripts

### 10) DOM query runner
- Prompts for a CSS selector
- Returns matching elements with quick metadata and HTML snippets

### 11) Privacy tracker inspector
- Summarizes third-party domains observed from page resources/scripts/iframes
- Categorizes domains into basic groups (analytics, ads, social, etc.)

## Where Results Appear
- Each action opens a new extension results page tab.
- The results page includes:
  - action-specific stats
  - action-specific data views
  - JSON export
  - CSV export when that action provides CSV output

## Supported Pages
- Works on normal `http://` and `https://` pages.
- Not intended for restricted browser pages like:
  - `chrome://*`
  - `brave://*`
  - extension store pages

## Permissions
The extension uses:
- `activeTab`: run actions on the active tab you are viewing
- `scripting`: execute page data collectors
- `storage`: store scan/action results before opening the results tab

## Installation (Brave)
1. Open `brave://extensions/`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select this folder:
   - `/Users/jake/Projects/browser-extensions/jakes-extension/extension`
5. Pin the extension from the puzzle icon if desired

## Installation (Chrome)
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder:
   - `/Users/jake/Projects/browser-extensions/jakes-extension/extension`

## Usage
1. Open any normal web page
2. Click the extension icon
3. Choose an action from the popup
4. Review results in the new tab
5. Export JSON/CSV if needed

## Notes
- Some previews/URLs may fail to load due to site protections (CSP, auth, hotlink blocking).
- Output quality for readability, contact extraction, and tracker categorization depends on page structure.
