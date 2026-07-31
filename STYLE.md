# Signal Sheet: A Responsive Browser Extension Style Guide

This is a self-contained visual specification for browser extension interfaces.
It is intended to be copied into any extension project and used by a designer,
developer, or coding agent without additional design context.

Apply this guide to extension popups, options pages, side panels, onboarding
screens, and small supporting views. When an existing product has established
brand assets, keep those assets but express them through the system below.

## Instructions for agents

When building or reviewing an interface:

1. Use the tokens in this file as the default source of truth.
2. Reuse the component patterns before inventing new ones.
3. Preserve the compact spacing, editorial hierarchy, and signal-sheet structure.
4. Adapt content and component names to the extension's purpose.
5. Keep brand-specific colors contained to identity or domain-specific icons.
6. Implement every relevant state: loading, populated, empty, error, disabled,
   hover, active, and keyboard focus.
7. Do not add a framework, icon library, or web font solely to reproduce this
   style. The system font stack and CSS shapes are sufficient.
8. Prefer semantic HTML and accessible native controls.

If a requirement conflicts with this guide, satisfy the requirement while
preserving the closest compatible tokens and principles.

## Visual character

The interface should feel like a beautifully designed instrument: compact, calm,
precise, responsive, and quietly distinctive. It borrows the clarity of an
editorial index and the legibility of a measurement display without becoming
retro, industrial, or dashboard-like.

### Compact, not cramped

Browser extension surfaces are small. Keep information dense, but use consistent
gaps and clear grouping so the content remains easy to scan.

### Editorial surface, strong hierarchy

Use a warm near-white canvas with faint registration lines, a crisp white content
sheet, subtle borders, and restrained shadows. Create hierarchy primarily with
type weight, spacing, and contrast rather than decoration.

### A signal, not an accent wash

Use signal orange as a precise point of emphasis: one mark, one status light, one
focus ring, or one action edge. Do not flood large surfaces with it.
Domain-specific colors may appear inside contained icons and measurement rails,
but should not color entire rows or compete with the product signal.

### One sheet, not a pile of cards

Related results belong in one continuous rounded sheet separated by hairlines.
This creates a more coherent reading rhythm than a stack of independent floating
cards and uses limited popup space more efficiently.

### Content before ornament

Primary labels and outcomes are the visual entry points. Supporting metadata
comes next. Decorative elements should improve recognition without displacing
useful information.

## Design tokens

Start new stylesheets with these custom properties. Values may be renamed to fit
an existing token convention, but their visual roles should remain intact.

```css
:root {
  color-scheme: light;

  --font-sans:
    Inter,
    ui-sans-serif,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  --color-accent: #ff5c35;
  --color-accent-hover: #d94a28;
  --color-accent-soft: #fff1ec;
  --color-accent-softer: #ffe3da;

  --color-canvas: #f4f5f1;
  --color-surface: #ffffff;
  --color-text: #171a1f;
  --color-text-strong: #1c2027;
  --color-text-secondary: #5e636d;
  --color-text-muted: #7a7f88;
  --color-border: #dfe1dc;
  --color-divider: #eceee9;

  --color-success: #16815d;
  --color-success-soft: #e9f7f1;
  --color-warning: #9a6410;
  --color-warning-soft: #fff5dd;
  --color-danger: #c63f52;
  --color-danger-soft: #fff0f2;

  --space-1: 3px;
  --space-2: 5px;
  --space-3: 8px;
  --space-4: 11px;
  --space-5: 15px;
  --space-6: 20px;
  --space-7: 24px;

  --radius-sm: 9px;
  --radius-control: 9px;
  --radius-icon: 12px;
  --radius-sheet: 17px;
  --radius-pill: 999px;

  --shadow-sheet:
    0 1px 1px rgb(18 25 33 / 4%),
    0 8px 24px rgb(18 25 33 / 4%);
  --focus-ring: 0 0 0 3px rgb(255 92 53 / 28%);

  --motion-fast: 120ms;
  --motion-normal: 180ms;
}

* {
  box-sizing: border-box;
}

[hidden] {
  display: none !important;
}

html {
  font-family: var(--font-sans);
  color: var(--color-text);
  background: var(--color-canvas);
}

body {
  margin: 0;
}
```

Add a token only when a value is reused or has a clear semantic purpose. Avoid
creating multiple nearly identical oranges, grays, radii, or spacing values.

## Color

### Core palette

| Role | Value | Usage |
| --- | --- | --- |
| Signal accent | `#ff5c35` | Brand mark, status light, focus, action edge |
| Accent hover | `#d94a28` | Hovered accent controls |
| Accent tint | `#fff1ec` | Empty-state or notice background |
| Accent tint strong | `#ffe3da` | Stronger accent support |
| Canvas | `#f4f5f1` | Warm extension background |
| Surface | `#ffffff` | Header, signal sheet, menus, and dialogs |
| Primary text | `#171a1f` | Default text |
| Strong text | `#1c2027` | Headings and primary labels |
| Secondary text | `#5e636d` | Secondary values |
| Muted text | `#7a7f88` | Status and supporting copy |
| Border | `#dfe1dc` | Sheet and control outlines |
| Divider | `#eceee9` | Rows and neutral placeholders |

Use the lightest neutral that still communicates the intended boundary. Prefer a
border before adding a shadow. Avoid pure black for body text.

### Semantic colors

Use green, amber, and red only when they communicate success, caution, or failure.
Pair semantic foreground colors with their soft background tokens. Never rely on
color alone: include a label, icon, or explanatory text.

### Domain-specific colors

When content items have their own colors, contain those colors inside a small icon
or logo tile. The tile must retain readable foreground contrast. Use white
lettering on sufficiently dark colors and a dark foreground on light colors.

## Typography

The type system is deliberately small.

| Style | Size | Weight | Typical usage |
| --- | --- | --- | --- |
| Brand | `16px` | `750–760` | Extension name |
| Icon initial | `14px` | `800–820` | Initials inside logo tiles |
| Primary label | `13px` | `700–750` | Item names, hostnames, compact headings |
| Supporting label | `10–11px` | `650–700` | Signal count and compact buttons |
| Supporting text | `11px` | `400–500` | Status and explanations |
| Metadata | `10px` | `400–500` | Evidence, timestamps, secondary values |

Use `line-height: 1.4` for body and supporting text. Compact single-line labels
may use the browser's normal line height.

Use tight tracking (`letter-spacing: -0.01em` to `-0.025em`) only for the brand or
similarly prominent short labels. Use a system monospace stack, uppercase text,
and positive tracking for instrument-like counts. Use tabular numerals for all
changing measurements.

Keep labels concise. Truncate long secondary values to one line when a component
needs a stable compact height, and make the complete value available through a
tooltip, detail view, or accessible label.

## Spacing and density

Use the defined spacing scale:

| Token | Value | Typical usage |
| --- | --- | --- |
| `--space-1` | `3px` | Separation inside a text stack |
| `--space-2` | `5px` | Tight inset or inline gap |
| `--space-3` | `8px` | List gaps and compact control padding |
| `--space-4` | `11px` | Card padding and icon-to-label gap |
| `--space-5` | `15px` | Main content padding and section separation |
| `--space-6` | `20px` | Spacious inset |
| `--space-7` | `24px` | Empty-state and large-section breathing room |

Use the smallest token that clearly separates related elements. Increase spacing
when moving between semantic groups. Avoid arbitrary values when a token is within
two pixels of the desired result.

## Shape and elevation

Rounded corners should feel friendly but restrained.

| Element | Radius |
| --- | --- |
| Favicons and small decorative shapes | `9px` |
| Buttons, inputs, and compact controls | `9px` |
| Logo or icon tiles | `12px` |
| Signal sheets | `17px` |
| Pills and circular badges | `999px` |

The continuous signal sheet uses a one-pixel neutral border and a low, broad
shadow:

```css
.signal-sheet {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sheet);
  background: var(--color-surface);
  box-shadow: var(--shadow-sheet);
}
```

Do not shadow each result row. The sheet is the elevated object; its rows are
structure within it.

## Surface layouts

### Popup

Default browser extension popups to `400px` wide. Treat the root dimensions as an
explicit contract with Chrome, Brave, and other Chromium browsers rather than a
normal responsive webpage. Let the interior layout remain flexible, but keep the
popup shell stable at first paint.

Reserve the expected populated height before asynchronous work finishes. For a
three-row signal sheet, `378px` is a good default: it covers the header, current
page context, three result rows, and bottom padding without feeling padded out.
If a product normally shows a different number of rows, calculate the reserved
height from the real row geometry rather than using a vague placeholder.

Avoid fixed heights and internal scrolling unless the list can become genuinely
long. If the list is long, scroll the list region deliberately and visibly; do
not let the popup root become the accidental scroll container.

```css
html {
  width: 400px;
  min-width: 400px;
  background: var(--color-canvas);
}

body {
  width: 400px;
  min-width: 400px;
  min-height: 378px;
  margin: 0;
  overflow: visible;
}

main {
  min-width: 0;
  padding: 14px 16px 18px;
}
```

For Chrome extension popups, put the width contract on `html` and `body`.
Avoid `max-width: 100vw` on the popup root: Chrome can initially measure a popup
against a tiny viewport, causing the document to collapse into a narrow strip.
Make the popup shell stable, then let the internal rows and text respond within
that width.

Do not put `overflow-x: hidden` on the popup root. In browsers, setting one
overflow axis can make the other axis compute to `auto`, turning the popup body
into a scroll container. Chrome extension popups can then keep the early measured
height after asynchronous content renders, which looks like vertical truncation
even when the screen has space. Fix the child layout that causes overflow instead
of clipping the root.

If the popup renders content asynchronously, render a loading state with the same
row geometry as the final list. Skeleton rows should use the exact row grid,
padding, icon size, confidence column, and signal rail dimensions as populated
rows. Chrome and Brave measure extension popups early; if the first paint is a
short empty shell, the final content may be trapped inside an unnecessary scroll
viewport even when the screen has enough vertical space.

After rendering final content, nudge the root height in `requestAnimationFrame`:

```js
requestAnimationFrame(() => {
  const height = Math.ceil(document.body.scrollHeight);
  document.documentElement.style.height = `${height}px`;
  document.body.style.height = `${height}px`;
});
```

Use this as a browser sizing hint, not as a replacement for stable first-paint
geometry. The popup should already be close to the correct size before this runs.

Prefer one continuous result sheet. Avoid horizontal scrolling. Keep the popup
focused on one primary task rather than treating it as a miniature website.

### Side panel and options page

Retain the same tokens and components while increasing whitespace. Constrain the
main content column to a readable width of roughly `640px–800px`. Do not enlarge
type merely because more space is available; use layout and grouping first.

### Standard list item

Use three columns when an item has identity, details, and a trailing value:

```text
[ 40px icon ] [ flexible label and metadata ] [ trailing value ]
```

Keep the icon and trailing value fixed while the center column absorbs available
space. The flexible column must use `minmax(0, 1fr)`, not plain `1fr`; otherwise,
long content can retain its intrinsic width and push the trailing value outside
the extension surface.

## Components

### App header

The header contains product identity on the left and an optional compact summary
or utility action on the right.

```css
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 66px;
  padding: 17px 20px;
  border-bottom: 1px solid var(--color-divider);
  background: rgb(255 255 255 / 76%);
  backdrop-filter: blur(12px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 16px;
  font-weight: 760;
  letter-spacing: -0.025em;
}
```

If no logo exists, create a small abstract signal from two or three narrow marks
with varied vertical registration. Use the signal accent once and neutral ink for
the remaining marks. Favor this compact rhythm over a generic rounded-square app
icon.

### Signal count

Render short live summaries as instrument labels rather than pills. Use a small
signal dot, a two-digit tabular count, and an uppercase noun such as
`03 SIGNALS`.

```css
.signal-count {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  white-space: nowrap;
}

.signal-count::before {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 0 3px rgb(255 92 53 / 12%);
  content: "";
}
```

### Context row

Use this pattern to identify the active page, account, workspace, or other current
context. Show a `30px` icon beside a two-line stack:

1. Context name in strong `14px` type.
2. Current status or description in muted `10px` type.

Hide a missing image rather than showing a broken-image indicator. Truncate long
primary labels on one line. If the row uses flexbox, apply `min-width: 0` to the
element that wraps the two text lines.

### Signal sheet and result row

Put related results inside one `.signal-sheet`. Separate rows with hairlines; do
not add gaps or individual rounded containers. Each row contains:

1. A `40px` softly tinted identity tile.
2. A strong item name and one line of metadata.
3. An optional trailing measurement.
4. A two-pixel signal rail below the text, beginning after the identity tile.

```css
.signal-sheet {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sheet);
  background: var(--color-surface);
  box-shadow: var(--shadow-sheet);
}

.signal-row {
  --item-color: #68707d;
  --signal-value: 0%;

  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  grid-template-rows: auto 2px;
  align-items: center;
  gap: 10px 12px;
  min-width: 0;
  padding: 13px 14px 11px;
  background: var(--color-surface);
  transition: background-color var(--motion-fast) ease;
}

.signal-row + .signal-row {
  border-top: 1px solid var(--color-divider);
}

.signal-row:hover {
  background: #fafbf8;
}

.item-details {
  min-width: 0;
}

.item-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--item-color) 25%, var(--color-border));
  border-radius: var(--radius-icon);
  color: var(--item-color);
  background: color-mix(in srgb, var(--item-color) 10%, #fff);
  font-size: 14px;
  font-weight: 820;
}

.item-title {
  overflow: hidden;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 750;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  margin-top: 3px;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 10px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-value {
  min-width: 34px;
  color: #30353d;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 680;
  text-align: right;
  white-space: nowrap;
}

.signal-rail {
  position: relative;
  grid-column: 2 / 4;
  height: 2px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--color-divider);
}

.signal-rail::after {
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--signal-value);
  border-radius: inherit;
  background: var(--item-color);
  content: "";
}
```

The signal rail is a secondary reading aid, not a chart. Use it only when a row
has a bounded quantity such as confidence, progress, or strength. Always retain a
text value or accessible label. If no bounded value exists, omit the rail and use
a single-row grid.

The item name remains the visual entry point. Keep metadata quiet but available.
Use a centered dot (`·`) to separate short metadata fragments. Make complete
truncated content available through an appropriate tooltip, accessible name, or
detail view.

### Empty state

Keep empty states concise and left-aligned inside a sheet-like surface. Use a
`40px` tinted icon, a strong heading, one short explanation, and an optional
recovery action. Supporting text should not exceed approximately `290px`.

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 26px 24px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sheet);
  color: var(--color-text-muted);
  background: var(--color-surface);
  box-shadow: var(--shadow-sheet);
  text-align: left;
}

.empty-state__icon {
  display: grid;
  width: 40px;
  height: 40px;
  margin-bottom: 17px;
  place-items: center;
  border: 1px solid #ffc3b4;
  border-radius: var(--radius-icon);
  color: var(--color-accent);
  background: var(--color-accent-soft);
  font-weight: 800;
}
```

Use the native `hidden` attribute to remove an inactive state.

### Loading state

Keep the surrounding layout stable while loading. Use concise status text such as
“Loading…” or “Checking…”. If a skeleton is useful, match the final component's
dimensions and animate only opacity. Avoid indefinite spinners when meaningful
partial content is available.

### Error state

State what failed and offer one recovery action when possible. Use the soft danger
background for a compact inline notice; do not tint the entire interface red.
Avoid exposing implementation details unless the view is explicitly for
developers.

### Buttons

Primary buttons use ink rather than a large block of signal orange. A thin inset
accent edge preserves the product signal without turning the action into a
generic bright call-to-action. Labels should be short and action-oriented.

```css
button,
.button {
  min-height: 32px;
  padding: 7px 13px;
  border: 0;
  border-radius: var(--radius-control);
  color: #ffffff;
  background: var(--color-text-strong);
  box-shadow: inset 0 -2px 0 var(--color-accent);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color var(--motion-fast) ease,
    transform var(--motion-fast) ease;
}

button:hover,
.button:hover {
  background: #343a45;
}

button:active,
.button:active {
  transform: translateY(1px);
}

button:focus-visible,
.button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

button:disabled,
.button[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}
```

Secondary buttons use a white surface, primary text, and the standard border.
Text buttons should be reserved for low-emphasis actions.

### Inputs

Inputs use white surfaces, the standard border, a `9px` radius, and at least a
`32px` height. Apply the same focus ring as buttons. Labels belong above controls
with a `5px` gap. Placeholder text must not replace a visible label when the
control's purpose would otherwise be unclear.

## Content style

Use direct, compact language.

- Prefer “Checking…” over “The current page is being checked.”
- Prefer “3 found” over “3 items have been found.”
- Name empty states by outcome: “No results found.”
- Explain uncertainty honestly.
- Use sentence case for interface labels.
- Use verbs for actions: “Try again,” “Save,” or “Open settings.”
- Use an ellipsis character (`…`) for ongoing activity.
- Avoid exclamation marks unless the situation genuinely warrants excitement.

## Motion

Motion communicates state; it should not add spectacle.

- Keep transitions between `120ms` and `180ms`.
- Limit transitions to color, opacity, or transforms of one or two pixels.
- Do not animate layout dimensions in compact surfaces.
- Avoid continuous animation except for an active loading indicator.
- Honor reduced-motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

## Accessibility

- Use semantic elements before adding ARIA.
- Keep text contrast readable against its actual surface.
- Do not communicate identity or status through color alone.
- Give every interactive control a visible `:focus-visible` treatment.
- Maintain a practical click target around compact controls; prefer at least
  `30px` for controls in dense popup layouts and `36px` where space permits.
- Use empty `alt` text for decorative images when an adjacent label conveys the
  same information.
- Mark decorative brand elements with `aria-hidden="true"`.
- Use `aria-live="polite"` for useful asynchronous status updates.
- Make important truncated content available another way.
- Keep DOM order aligned with visual and keyboard order.
- Ensure the UI remains understandable at browser zoom levels up to `200%`.

## Responsive and overflow behavior

- Never introduce horizontal scrolling in a popup.
- Do not rely on `100vw` to size the root of a Chrome extension popup. Set an
  explicit root width on `html` and `body`, then use responsive constraints
  inside the popup.
- Do not use root-level `overflow-x: hidden` to mask layout issues. It can make
  vertical overflow scrollable and cause Chrome to truncate the popup after async
  rendering.
- Reserve the final list geometry during loading when content arrives
  asynchronously; do not let the popup first paint as a short empty shell.
- Use `minmax(0, 1fr)` for flexible grid columns so text can shrink below its
  intrinsic content width.
- Apply `min-width: 0` to grid or flex children that contain truncating text.
- Protect trailing values and controls with `white-space: nowrap`; allow the
  central content column to truncate before a trailing element is clipped.
- Use the complete ellipsis trio together: `overflow: hidden`,
  `text-overflow: ellipsis`, and `white-space: nowrap`.
- Do not use `overflow: hidden` on a large parent merely to conceal a sizing bug.
  Fix the intrinsic sizing of the child that is forcing the overflow.
- Let option pages and side panels reflow to one column below `600px`.
- Do not hide primary actions merely because the surface narrows.
- Test with unusually long translated labels, URLs, identifiers, and metadata.
- During visual verification, confirm that every row and trailing value ends
  inside the body width and that the document has no horizontal overflow.

## Dark mode

This specification defines a light theme. Do not invent a partial dark theme by
inverting individual colors. If dark mode is required, define a complete parallel
semantic palette, verify contrast for every state, and test native controls under
`color-scheme: dark`.

## Review checklist

Before shipping a component or screen, verify:

- It uses the established tokens and spacing rhythm.
- Its hierarchy remains clear without extra color or heavy shadows.
- Long labels, missing images, and missing data have deliberate behavior.
- Long central content truncates before trailing values or controls are clipped.
- Loading, populated, empty, error, disabled, hover, active, and focus states are
  implemented where relevant.
- Domain-specific colors remain contained to identity elements.
- The popup works between `320px` and `400px` without horizontal overflow.
- Keyboard order and screen-reader behavior match the visual presentation.
- Motion is restrained and respects reduced-motion preferences.
- The result uses no unnecessary framework, font, or icon dependency.
