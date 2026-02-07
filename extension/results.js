const params = new URLSearchParams(location.search);
const scanId = params.get("scan");
const storageKey = scanId ? `scan:${scanId}` : null;

const titleEl = document.getElementById("title");
const metaEl = document.getElementById("meta");
const statsEl = document.getElementById("stats");
const contentEl = document.getElementById("content");
const emptyEl = document.getElementById("empty");
const exportJsonBtn = document.getElementById("export-json");
const exportCsvBtn = document.getElementById("export-csv");
const thumbToggleWrapEl = document.getElementById("thumb-toggle");
const showThumbnailsEl = document.getElementById("show-thumbnails");

let activeScan = null;
let showThumbnails = true;

initialize().catch((error) => {
  showError(error instanceof Error ? error.message : "Unable to load results.");
});

exportJsonBtn.addEventListener("click", () => {
  if (!activeScan) {
    return;
  }
  const content = JSON.stringify(activeScan, null, 2);
  downloadFile(toSafeFilename(activeScan, "json"), "application/json", content);
});

exportCsvBtn.addEventListener("click", () => {
  if (!activeScan?.data?.csvContent) {
    return;
  }
  downloadFile(toSafeFilename(activeScan, "csv"), "text/csv", activeScan.data.csvContent);
});

if (showThumbnailsEl) {
  showThumbnailsEl.addEventListener("change", (event) => {
    showThumbnails = event.target.checked;
    if (activeScan) {
      renderContent(activeScan);
    }
  });
}

async function initialize() {
  if (!storageKey) {
    throw new Error("Missing scan id.");
  }

  const stored = await chrome.storage.local.get(storageKey);
  const scan = stored[storageKey];
  if (!scan) {
    throw new Error("No scan data found for this page.");
  }

  activeScan = scan;
  render(scan);
}

function render(scan) {
  const title = `${scan.actionLabel || "Action"} Results`;
  titleEl.textContent = title;
  document.title = title;

  const titlePart = scan.pageTitle ? `${scan.pageTitle} - ` : "";
  metaEl.textContent = `${titlePart}${scan.pageUrl}`;

  renderStats(scan.data?.stats || []);

  const csvEnabled = Boolean(scan.data?.csvContent);
  exportCsvBtn.disabled = !csvEnabled;

  const showThumbControl = scan.actionId === "images";
  thumbToggleWrapEl.hidden = !showThumbControl;

  renderContent(scan);
}

function renderStats(stats) {
  statsEl.textContent = "";
  if (!Array.isArray(stats) || !stats.length) {
    statsEl.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  stats.forEach((stat) => {
    const card = document.createElement("article");
    card.className = "stat-card";

    const label = document.createElement("h2");
    label.className = "stat-label";
    label.textContent = stat.label || "Metric";

    const value = document.createElement("p");
    value.className = "stat-value";
    value.textContent = String(stat.value ?? "");

    card.appendChild(label);
    card.appendChild(value);
    fragment.appendChild(card);
  });

  statsEl.appendChild(fragment);
  statsEl.hidden = false;
}

function renderContent(scan) {
  contentEl.textContent = "";
  emptyEl.hidden = true;

  switch (scan.actionId) {
    case "images":
      renderImages(scan.data?.images || []);
      break;
    case "links":
      renderLinks(scan.data?.links || []);
      break;
    case "contacts":
      renderContacts(scan.data || {});
      break;
    case "seo":
      renderSeo(scan.data || {});
      break;
    case "tables":
      renderTables(scan.data?.tables || [], scan);
      break;
    case "readability":
      renderReadability(scan.data || {});
      break;
    case "performance":
      renderPerformance(scan.data?.hints || []);
      break;
    case "dom-query":
      renderDomQuery(scan.data || {});
      break;
    case "privacy":
      renderPrivacy(scan.data?.domains || []);
      break;
    default:
      renderFallback(scan.data);
  }
}

function renderImages(images) {
  if (!images.length) {
    emptyEl.hidden = false;
    emptyEl.textContent = "No image URLs found.";
    return;
  }

  const list = document.createElement("ul");
  list.className = "result-list";

  const fragment = document.createDocumentFragment();
  images.forEach((image) => {
    const item = document.createElement("li");
    item.className = "result-item";

    if (showThumbnails) {
      item.classList.add("has-thumb");
      item.appendChild(buildThumbnail(image.url));
    }

    const main = document.createElement("div");
    main.className = "item-main";

    const url = document.createElement("a");
    url.className = "linkish";
    url.href = image.url;
    url.textContent = image.url;
    url.target = "_blank";
    url.rel = "noopener noreferrer";
    main.appendChild(url);

    const tags = document.createElement("div");
    tags.className = "tags";
    (image.sources || []).forEach((source) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = source;
      tags.appendChild(tag);
    });
    main.appendChild(tags);

    item.appendChild(main);
    fragment.appendChild(item);
  });

  list.appendChild(fragment);
  contentEl.appendChild(list);
}

function renderLinks(links) {
  if (!links.length) {
    emptyEl.hidden = false;
    emptyEl.textContent = "No links found.";
    return;
  }

  const list = document.createElement("ul");
  list.className = "result-list";

  links.forEach((link) => {
    const item = document.createElement("li");
    item.className = "result-item";

    const anchor = document.createElement("a");
    anchor.className = "linkish";
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.url;

    const meta = document.createElement("p");
    meta.className = "meta-row";
    const text = link.text ? `text: ${link.text}` : "text: (none)";
    meta.textContent = `${text} | occurrences: ${link.occurrences}`;

    const tags = document.createElement("div");
    tags.className = "tags";
    tags.appendChild(makeTag(link.internal ? "internal" : "external"));
    if (link.nofollow) tags.appendChild(makeTag("nofollow"));
    if (link.target) tags.appendChild(makeTag(`target:${link.target}`));

    item.appendChild(anchor);
    item.appendChild(meta);
    item.appendChild(tags);
    list.appendChild(item);
  });

  contentEl.appendChild(list);
}

function renderContacts(data) {
  const emails = data.emails || [];
  const phones = data.phones || [];

  if (!emails.length && !phones.length) {
    emptyEl.hidden = false;
    emptyEl.textContent = "No contacts found.";
    return;
  }

  const stack = document.createElement("div");
  stack.className = "stack";

  stack.appendChild(renderContactCard("Emails", emails, "email"));
  stack.appendChild(renderContactCard("Phone Numbers", phones, "phone"));

  contentEl.appendChild(stack);
}

function renderContactCard(title, entries, kind) {
  const card = document.createElement("section");
  card.className = "card";

  const heading = document.createElement("h2");
  heading.className = "card-head";
  heading.textContent = `${title} (${entries.length})`;
  card.appendChild(heading);

  if (entries.length) {
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = `Copy ${title}`;
    copyBtn.addEventListener("click", () => {
      const text = entries.map((entry) => entry.value).join("\n");
      copyText(text, `Copied ${entries.length} ${kind}${entries.length === 1 ? "" : "s"}.`);
    });
    card.appendChild(copyBtn);
  }

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "meta-row";
    empty.textContent = "None found.";
    card.appendChild(empty);
    return card;
  }

  const list = document.createElement("ul");
  list.className = "result-list";
  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "result-item";

    const valueEl = document.createElement("div");
    valueEl.className = "linkish";
    valueEl.textContent = entry.value;

    const tags = document.createElement("div");
    tags.className = "tags";
    (entry.sources || []).forEach((source) => tags.appendChild(makeTag(source)));

    item.appendChild(valueEl);
    item.appendChild(tags);
    list.appendChild(item);
  });

  card.appendChild(list);
  return card;
}

function renderSeo(data) {
  const snapshot = data.snapshot || {};
  const issues = data.issues || [];

  const card = document.createElement("section");
  card.className = "card";

  const heading = document.createElement("h2");
  heading.className = "card-head";
  heading.textContent = "SEO Snapshot";
  card.appendChild(heading);

  const table = document.createElement("table");
  table.className = "kv";

  const rows = [
    ["Title", snapshot.title || ""],
    ["Title Length", snapshot.titleLength ?? ""],
    ["Meta Description", snapshot.metaDescription || ""],
    ["Description Length", snapshot.metaDescriptionLength ?? ""],
    ["Canonical", snapshot.canonical || ""],
    ["Robots", snapshot.robots || ""],
    ["H1 Count", snapshot.h1Count ?? ""],
    ["OG Title", snapshot.ogTitle || ""],
    ["OG Description", snapshot.ogDescription || ""],
    ["OG Image", snapshot.ogImage || ""],
    ["Twitter Card", snapshot.twitterCard || ""],
  ];

  rows.forEach(([key, value]) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = key;
    const td = document.createElement("td");
    td.textContent = String(value || "(empty)");
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);
  });

  card.appendChild(table);

  const h = document.createElement("h3");
  h.className = "subhead";
  h.textContent = `Issues (${issues.length})`;
  card.appendChild(h);

  if (!issues.length) {
    const clean = document.createElement("p");
    clean.className = "meta-row";
    clean.textContent = "No obvious issues flagged by quick checks.";
    card.appendChild(clean);
  } else {
    const list = document.createElement("ul");
    list.className = "stack";
    issues.forEach((issue) => {
      const li = document.createElement("li");
      li.className = "warning";
      li.textContent = issue;
      list.appendChild(li);
    });
    card.appendChild(list);
  }

  if ((snapshot.hreflangs || []).length) {
    const p = document.createElement("p");
    p.className = "meta-row";
    p.textContent = `Hreflang tags: ${snapshot.hreflangs.length}`;
    card.appendChild(p);
  }

  contentEl.appendChild(card);
}

function renderTables(tables, scan) {
  if (!tables.length) {
    emptyEl.hidden = false;
    emptyEl.textContent = "No tables found on this page.";
    return;
  }

  const stack = document.createElement("div");
  stack.className = "stack";

  tables.forEach((table) => {
    const card = document.createElement("section");
    card.className = "card";

    const heading = document.createElement("h2");
    heading.className = "card-head";
    heading.textContent = table.caption || `Table ${table.index + 1}`;
    card.appendChild(heading);

    const meta = document.createElement("p");
    meta.className = "meta-row";
    meta.textContent = `${table.rowCount} rows x ${table.colCount} columns`;
    card.appendChild(meta);

    if (table.csv) {
      const exportBtn = document.createElement("button");
      exportBtn.type = "button";
      exportBtn.textContent = "Export This Table CSV";
      exportBtn.addEventListener("click", () => {
        const name = toSafeFilename(scan, "csv", `table-${table.index + 1}`);
        downloadFile(name, "text/csv", table.csv);
      });
      card.appendChild(exportBtn);
    }

    if ((table.previewRows || []).length) {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";

      const preview = document.createElement("table");
      preview.className = "preview-table";

      table.previewRows.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");
        row.forEach((value) => {
          const cell = document.createElement(rowIndex === 0 ? "th" : "td");
          cell.textContent = value;
          tr.appendChild(cell);
        });
        preview.appendChild(tr);
      });

      wrap.appendChild(preview);
      card.appendChild(wrap);
    }

    stack.appendChild(card);
  });

  contentEl.appendChild(stack);
}

function renderReadability(data) {
  const title = data.title || "Article";
  const paragraphs = data.paragraphs || [];

  if (!paragraphs.length) {
    emptyEl.hidden = false;
    emptyEl.textContent = "Could not extract readable article text.";
    return;
  }

  const card = document.createElement("section");
  card.className = "card readability";

  const heading = document.createElement("h2");
  heading.className = "card-head";
  heading.textContent = title;
  card.appendChild(heading);

  paragraphs.forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    card.appendChild(p);
  });

  contentEl.appendChild(card);
}

function renderPerformance(hints) {
  if (!hints.length) {
    emptyEl.hidden = false;
    emptyEl.textContent = "No hints available.";
    return;
  }

  const list = document.createElement("ul");
  list.className = "result-list";

  hints.forEach((hint) => {
    const item = document.createElement("li");
    item.className = "result-item";

    const title = document.createElement("h3");
    title.className = "subhead";
    title.textContent = hint.label;

    const severity = makeTag(hint.severity || "info");
    const tags = document.createElement("div");
    tags.className = "tags";
    tags.appendChild(severity);

    const detail = document.createElement("p");
    detail.className = "meta-row";
    detail.textContent = hint.detail || "";

    item.appendChild(title);
    item.appendChild(tags);
    item.appendChild(detail);
    list.appendChild(item);
  });

  contentEl.appendChild(list);
}

function renderDomQuery(data) {
  if (data.error) {
    showError(data.error);
    return;
  }

  const matches = data.matches || [];
  if (!matches.length) {
    emptyEl.hidden = false;
    emptyEl.textContent = `No matches found for selector: ${data.selector || ""}`;
    return;
  }

  const stack = document.createElement("div");
  stack.className = "stack";

  const intro = document.createElement("section");
  intro.className = "card";
  const heading = document.createElement("h2");
  heading.className = "card-head";
  heading.textContent = "DOM Query";
  const meta = document.createElement("p");
  meta.className = "meta-row";
  meta.textContent = `Selector: ${data.selector} | Total Matches: ${data.totalMatches}`;
  intro.appendChild(heading);
  intro.appendChild(meta);
  stack.appendChild(intro);

  const list = document.createElement("ul");
  list.className = "result-list";
  matches.forEach((match) => {
    const item = document.createElement("li");
    item.className = "result-item";

    const titleRow = document.createElement("p");
    titleRow.className = "meta-row";
    titleRow.textContent = `#${match.index} <${match.tag}>${match.id ? ` id=\"${match.id}\"` : ""}`;

    const tags = document.createElement("div");
    tags.className = "tags";
    if (match.classes) {
      tags.appendChild(makeTag(`class:${match.classes}`));
    }

    const text = document.createElement("p");
    text.className = "meta-row";
    text.textContent = match.text || "(no text)";

    const code = document.createElement("pre");
    code.className = "code";
    code.textContent = match.html || "";

    item.appendChild(titleRow);
    item.appendChild(tags);
    item.appendChild(text);
    item.appendChild(code);
    list.appendChild(item);
  });

  stack.appendChild(list);
  contentEl.appendChild(stack);
}

function renderPrivacy(domains) {
  if (!domains.length) {
    emptyEl.hidden = false;
    emptyEl.textContent = "No third-party domains observed.";
    return;
  }

  const card = document.createElement("section");
  card.className = "card";

  const heading = document.createElement("h2");
  heading.className = "card-head";
  heading.textContent = "Third-Party Domains";
  card.appendChild(heading);

  const table = document.createElement("table");
  table.className = "kv";

  const header = document.createElement("tr");
  ["Domain", "Category", "Resources", "Scripts", "Iframes"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    header.appendChild(th);
  });
  table.appendChild(header);

  domains.forEach((domain) => {
    const tr = document.createElement("tr");
    [
      domain.domain,
      domain.category,
      String(domain.resources),
      String(domain.scriptRefs),
      String(domain.iframeRefs),
    ].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  card.appendChild(table);
  contentEl.appendChild(card);
}

function renderFallback(data) {
  const pre = document.createElement("pre");
  pre.className = "code";
  pre.textContent = JSON.stringify(data || {}, null, 2);
  contentEl.appendChild(pre);
}

function showError(message) {
  titleEl.textContent = "Error";
  metaEl.textContent = message;
  metaEl.classList.add("warning");
  exportJsonBtn.disabled = true;
  exportCsvBtn.disabled = true;
  if (showThumbnailsEl) {
    showThumbnailsEl.disabled = true;
  }
}

function buildThumbnail(url) {
  const wrap = document.createElement("div");
  wrap.className = "thumb-wrap";

  const img = document.createElement("img");
  img.className = "thumb";
  img.src = url;
  img.alt = "";
  img.loading = "lazy";
  img.addEventListener("error", () => {
    wrap.classList.add("is-error");
    wrap.textContent = "No preview";
  });

  wrap.appendChild(img);
  return wrap;
}

function makeTag(text) {
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = text;
  return tag;
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    metaEl.textContent = successMessage;
  } catch {
    metaEl.textContent = "Copy failed. Clipboard access was blocked.";
    metaEl.classList.add("warning");
  }
}

function toSafeFilename(scan, extension, suffix = "") {
  const host = (() => {
    try {
      return new URL(scan.pageUrl).hostname;
    } catch {
      return "page";
    }
  })();
  const action = scan.actionId || "action";
  const date = (scan.createdAt || new Date().toISOString()).replace(/[:.]/g, "-");
  const tail = suffix ? `-${suffix}` : "";
  return `${action}-${host}-${date}${tail}.${extension}`;
}

function downloadFile(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
