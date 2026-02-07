const ACTION_DEFS = {
  images: { label: "Show all linked images on page" },
  links: { label: "Extract all links" },
  contacts: { label: "Find and copy emails / phone numbers" },
  seo: { label: "SEO snapshot" },
  tables: { label: "Table Export" },
  readability: { label: "Readability mode" },
  performance: { label: "Performance hints" },
  "dom-query": { label: "DOM query runner" },
  privacy: { label: "Privacy tracker inspector" },
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "run-action") {
    return;
  }

  runAction(message.actionId, message.options || {})
    .then((scanId) => sendResponse({ ok: true, scanId }))
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  return true;
});

async function runAction(actionId, options) {
  const action = ACTION_DEFS[actionId];
  if (!action) {
    throw new Error("Unsupported action.");
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    throw new Error("No active tab was found.");
  }

  if (!tab.url || !/^https?:\/\//i.test(tab.url)) {
    throw new Error("This action currently supports normal web pages only.");
  }

  const executionResults = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: runCollector,
    args: [actionId, options],
  });

  const data = executionResults[0]?.result;
  if (!data) {
    throw new Error("Failed to collect data from the page.");
  }
  if (data.error) {
    throw new Error(data.error);
  }

  const scanId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const storageKey = getStorageKey(scanId);

  await chrome.storage.local.set({
    [storageKey]: {
      scanId,
      createdAt: new Date().toISOString(),
      pageUrl: tab.url,
      pageTitle: tab.title ?? "",
      actionId,
      actionLabel: action.label,
      data,
    },
  });

  await chrome.tabs.create({
    url: chrome.runtime.getURL(`results.html?scan=${encodeURIComponent(scanId)}`),
  });

  return scanId;
}

function getStorageKey(scanId) {
  return `scan:${scanId}`;
}

function runCollector(actionId, options) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function toAbsoluteUrl(url) {
    if (!url || typeof url !== "string") {
      return null;
    }
    try {
      const absolute = new URL(url, location.href).href;
      if (absolute.startsWith("javascript:")) {
        return null;
      }
      return absolute;
    } catch {
      return null;
    }
  }

  function parseSrcset(srcset) {
    if (!srcset || typeof srcset !== "string") {
      return [];
    }
    return srcset
      .split(",")
      .map((entry) => entry.trim().split(/\s+/)[0])
      .filter(Boolean);
  }

  function csvEscape(value) {
    const raw = String(value ?? "");
    return `"${raw.replaceAll('"', '""')}"`;
  }

  function toCsv(rows) {
    return `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
  }

  function summarizeStat(label, value) {
    return { label, value: String(value) };
  }

  function collectImages() {
    const imageExtRe =
      /\.(avif|apng|bmp|gif|ico|jpe?g|jfif|pjpeg|pjp|png|svg|tiff?|webp)(?:$|[?#])/i;
    const map = new Map();

    function add(url, source) {
      const absolute = toAbsoluteUrl(url);
      if (!absolute) {
        return;
      }
      const existing = map.get(absolute);
      if (existing) {
        existing.sources.add(source);
        return;
      }
      map.set(absolute, { url: absolute, sources: new Set([source]) });
    }

    function looksLikeImageUrl(url) {
      return (
        imageExtRe.test(url) ||
        url.startsWith("data:image/") ||
        url.startsWith("blob:")
      );
    }

    document.querySelectorAll("a[href]").forEach((anchor) => {
      const href = anchor.getAttribute("href");
      if (href && looksLikeImageUrl(href)) {
        add(href, "linked");
      }
    });

    document.querySelectorAll("img[src]").forEach((img) => {
      add(img.currentSrc || img.getAttribute("src"), "visible-img");
    });

    document.querySelectorAll("img[srcset], source[srcset]").forEach((node) => {
      parseSrcset(node.getAttribute("srcset")).forEach((candidate) =>
        add(candidate, "visible-srcset"),
      );
    });

    const urlExtractor = /url\((['"]?)(.*?)\1\)/gi;
    document.querySelectorAll("*").forEach((element) => {
      const bgImage = getComputedStyle(element).backgroundImage;
      if (!bgImage || bgImage === "none") {
        return;
      }
      urlExtractor.lastIndex = 0;
      let match;
      while ((match = urlExtractor.exec(bgImage)) !== null) {
        const extracted = match[2]?.trim();
        if (extracted) {
          add(extracted, "visible-css-background");
        }
      }
    });

    const images = Array.from(map.values())
      .map((item) => ({
        url: item.url,
        sources: Array.from(item.sources).sort(),
        fromLinkedAnchor: item.sources.has("linked"),
        fromVisibleElement: Array.from(item.sources).some((source) =>
          source.startsWith("visible-"),
        ),
      }))
      .sort((a, b) => a.url.localeCompare(b.url));

    const linkedCount = images.filter((image) => image.fromLinkedAnchor).length;
    const visibleCount = images.filter((image) => image.fromVisibleElement).length;

    return {
      stats: [
        summarizeStat("Total Unique", images.length),
        summarizeStat("From Linked Anchors", linkedCount),
        summarizeStat("From Visible Elements", visibleCount),
      ],
      images,
      csvContent: toCsv([
        ["url", "sources", "fromLinkedAnchor", "fromVisibleElement"],
        ...images.map((image) => [
          image.url,
          image.sources.join("|"),
          String(image.fromLinkedAnchor),
          String(image.fromVisibleElement),
        ]),
      ]),
    };
  }

  function collectLinks() {
    const map = new Map();
    const currentHost = location.hostname;

    document.querySelectorAll("a[href]").forEach((anchor) => {
      const absolute = toAbsoluteUrl(anchor.getAttribute("href"));
      if (!absolute) {
        return;
      }
      const existing = map.get(absolute);
      if (existing) {
        existing.occurrences += 1;
        return;
      }

      const host = (() => {
        try {
          return new URL(absolute).hostname;
        } catch {
          return "";
        }
      })();

      map.set(absolute, {
        url: absolute,
        text: (anchor.textContent || "").trim().replace(/\s+/g, " ").slice(0, 220),
        target: anchor.getAttribute("target") || "",
        nofollow: (anchor.getAttribute("rel") || "").toLowerCase().includes("nofollow"),
        internal: host === currentHost,
        occurrences: 1,
      });
    });

    const links = Array.from(map.values()).sort((a, b) => a.url.localeCompare(b.url));

    return {
      stats: [
        summarizeStat("Total Unique Links", links.length),
        summarizeStat(
          "Internal Links",
          links.filter((link) => link.internal).length,
        ),
        summarizeStat(
          "External Links",
          links.filter((link) => !link.internal).length,
        ),
      ],
      links,
      csvContent: toCsv([
        ["url", "text", "internal", "nofollow", "target", "occurrences"],
        ...links.map((link) => [
          link.url,
          link.text,
          String(link.internal),
          String(link.nofollow),
          link.target,
          String(link.occurrences),
        ]),
      ]),
    };
  }

  function collectContacts() {
    const emailMap = new Map();
    const phoneMap = new Map();

    function addEmail(email, source) {
      const normalized = String(email || "").trim().toLowerCase();
      if (!normalized) {
        return;
      }
      if (!emailMap.has(normalized)) {
        emailMap.set(normalized, { value: normalized, sources: new Set() });
      }
      emailMap.get(normalized).sources.add(source);
    }

    function normalizePhone(input) {
      const trimmed = String(input || "").trim();
      if (!trimmed) {
        return "";
      }
      const hasPlus = trimmed.startsWith("+");
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        return "";
      }
      return `${hasPlus ? "+" : ""}${digits}`;
    }

    function addPhone(phone, source) {
      const normalized = normalizePhone(phone);
      if (!normalized) {
        return;
      }
      if (!phoneMap.has(normalized)) {
        phoneMap.set(normalized, { value: normalized, sources: new Set() });
      }
      phoneMap.get(normalized).sources.add(source);
    }

    const bodyText = (document.body?.innerText || "").slice(0, 500000);
    const emailMatches = bodyText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    emailMatches.forEach((email) => addEmail(email, "visible-text"));

    const phoneMatches =
      bodyText.match(/(?:\+?\d[\d().\-\s]{6,}\d)/g) || [];
    phoneMatches.forEach((phone) => addPhone(phone, "visible-text"));

    document.querySelectorAll("a[href^='mailto:']").forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      const value = href.replace(/^mailto:/i, "").split("?")[0];
      addEmail(value, "mailto-link");
    });

    document.querySelectorAll("a[href^='tel:']").forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      const value = href.replace(/^tel:/i, "").split("?")[0];
      addPhone(value, "tel-link");
    });

    const emails = Array.from(emailMap.values())
      .map((entry) => ({
        value: entry.value,
        sources: Array.from(entry.sources).sort(),
      }))
      .sort((a, b) => a.value.localeCompare(b.value));

    const phones = Array.from(phoneMap.values())
      .map((entry) => ({
        value: entry.value,
        sources: Array.from(entry.sources).sort(),
      }))
      .sort((a, b) => a.value.localeCompare(b.value));

    return {
      stats: [
        summarizeStat("Emails", emails.length),
        summarizeStat("Phone Numbers", phones.length),
        summarizeStat("Total Contacts", emails.length + phones.length),
      ],
      emails,
      phones,
      csvContent: toCsv([
        ["type", "value", "sources"],
        ...emails.map((email) => ["email", email.value, email.sources.join("|")]),
        ...phones.map((phone) => ["phone", phone.value, phone.sources.join("|")]),
      ]),
    };
  }

  function collectSeo() {
    const metaByName = (name) =>
      document.querySelector(`meta[name='${name}']`)?.getAttribute("content") || "";
    const metaByProp = (prop) =>
      document.querySelector(`meta[property='${prop}']`)?.getAttribute("content") || "";

    const hreflangs = Array.from(document.querySelectorAll("link[rel='alternate'][hreflang]")).map(
      (node) => ({
        hreflang: node.getAttribute("hreflang") || "",
        href: toAbsoluteUrl(node.getAttribute("href")) || "",
      }),
    );

    const snapshot = {
      title: document.title || "",
      titleLength: (document.title || "").trim().length,
      metaDescription: metaByName("description"),
      metaDescriptionLength: metaByName("description").trim().length,
      canonical: toAbsoluteUrl(document.querySelector("link[rel='canonical']")?.getAttribute("href")) || "",
      robots: metaByName("robots"),
      h1Count: document.querySelectorAll("h1").length,
      ogTitle: metaByProp("og:title"),
      ogDescription: metaByProp("og:description"),
      ogImage: metaByProp("og:image"),
      twitterCard: metaByName("twitter:card"),
      twitterTitle: metaByName("twitter:title"),
      twitterDescription: metaByName("twitter:description"),
      twitterImage: metaByName("twitter:image"),
      hreflangs,
    };

    const issues = [];
    if (!snapshot.title) issues.push("Missing <title>.");
    if (snapshot.titleLength > 65) issues.push("Title is longer than ~65 characters.");
    if (!snapshot.metaDescription) issues.push("Missing meta description.");
    if (snapshot.metaDescriptionLength > 160) {
      issues.push("Meta description is longer than ~160 characters.");
    }
    if (!snapshot.canonical) issues.push("Missing canonical URL.");
    if (snapshot.h1Count === 0) issues.push("No H1 found.");
    if (!snapshot.ogTitle || !snapshot.ogDescription || !snapshot.ogImage) {
      issues.push("Open Graph tags are incomplete.");
    }
    if (!snapshot.twitterCard) issues.push("Missing Twitter card tag.");

    const kvRows = [
      ["Title", snapshot.title],
      ["Title Length", String(snapshot.titleLength)],
      ["Meta Description", snapshot.metaDescription],
      ["Description Length", String(snapshot.metaDescriptionLength)],
      ["Canonical", snapshot.canonical],
      ["Robots", snapshot.robots],
      ["H1 Count", String(snapshot.h1Count)],
      ["OG Title", snapshot.ogTitle],
      ["OG Description", snapshot.ogDescription],
      ["OG Image", snapshot.ogImage],
      ["Twitter Card", snapshot.twitterCard],
      ["Twitter Title", snapshot.twitterTitle],
      ["Twitter Description", snapshot.twitterDescription],
      ["Twitter Image", snapshot.twitterImage],
      ["Hreflang Count", String(snapshot.hreflangs.length)],
    ];

    return {
      stats: [
        summarizeStat("SEO Issues", issues.length),
        summarizeStat("H1 Count", snapshot.h1Count),
        summarizeStat("Hreflang Tags", snapshot.hreflangs.length),
      ],
      snapshot,
      issues,
      csvContent: toCsv([["metric", "value"], ...kvRows]),
    };
  }

  function collectTables() {
    const tables = Array.from(document.querySelectorAll("table"));
    const extracted = tables.map((table, index) => {
      const caption = table.querySelector("caption")?.textContent?.trim() || `Table ${index + 1}`;
      const rows = Array.from(table.querySelectorAll("tr")).map((row) =>
        Array.from(row.querySelectorAll("th, td")).map((cell) =>
          (cell.textContent || "").replace(/\s+/g, " ").trim(),
        ),
      );
      const normalizedRows = rows.filter((row) => row.length > 0);
      const maxCols = normalizedRows.reduce((max, row) => Math.max(max, row.length), 0);
      const paddedRows = normalizedRows.map((row) => {
        const out = row.slice(0, 24);
        while (out.length < maxCols && out.length < 24) {
          out.push("");
        }
        return out;
      });
      const csv = paddedRows.length ? toCsv(paddedRows) : "";
      return {
        index,
        caption,
        rowCount: paddedRows.length,
        colCount: clamp(maxCols, 0, 24),
        rows: paddedRows,
        previewRows: paddedRows.slice(0, 10),
        csv,
      };
    });

    const csvSections = extracted
      .filter((table) => table.csv)
      .map((table) => `# ${table.caption}\n${table.csv.trimEnd()}`);

    return {
      stats: [
        summarizeStat("Tables Found", extracted.length),
        summarizeStat(
          "Total Rows",
          extracted.reduce((sum, table) => sum + table.rowCount, 0),
        ),
      ],
      tables: extracted,
      csvContent: csvSections.length ? `${csvSections.join("\n\n")}\n` : "",
    };
  }

  function collectReadability() {
    const candidates = [
      ...Array.from(document.querySelectorAll("article, main, [role='main']")),
      ...Array.from(document.querySelectorAll("section, div")),
    ];

    let best = document.body;
    let bestScore = 0;

    candidates.forEach((node) => {
      const text = (node.innerText || "").trim();
      if (text.length < 280) {
        return;
      }
      const pCount = node.querySelectorAll("p").length;
      const score = text.length + pCount * 180;
      if (score > bestScore) {
        best = node;
        bestScore = score;
      }
    });

    const title = document.querySelector("h1")?.textContent?.trim() || document.title || "Untitled";

    let paragraphs = Array.from(best.querySelectorAll("p"))
      .map((p) => (p.textContent || "").replace(/\s+/g, " ").trim())
      .filter((text) => text.length >= 35)
      .slice(0, 140);

    if (!paragraphs.length) {
      paragraphs = (best.innerText || "")
        .split(/\n+/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length >= 35)
        .slice(0, 140);
    }

    const wordCount = paragraphs.reduce((sum, text) => sum + text.split(/\s+/).length, 0);

    return {
      stats: [
        summarizeStat("Paragraphs", paragraphs.length),
        summarizeStat("Approx Words", wordCount),
      ],
      title,
      paragraphs,
      csvContent: toCsv([
        ["paragraph", "text"],
        ...paragraphs.map((text, idx) => [String(idx + 1), text]),
      ]),
    };
  }

  function collectPerformance() {
    const hints = [];

    const images = Array.from(document.images || []);
    const oversized = images.filter((img) => {
      const naturalPixels = (img.naturalWidth || 0) * (img.naturalHeight || 0);
      const drawnPixels = (img.clientWidth || 0) * (img.clientHeight || 0);
      return naturalPixels > 2000000 && drawnPixels > 0 && naturalPixels / drawnPixels > 4;
    });
    if (oversized.length) {
      hints.push({
        severity: "medium",
        label: "Potentially oversized images",
        detail: `${oversized.length} image(s) look much larger than rendered size.`,
      });
    }

    const lazyCandidates = images.filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.top > window.innerHeight * 1.25 && img.loading !== "lazy";
    });
    if (lazyCandidates.length) {
      hints.push({
        severity: "low",
        label: "Missing lazy-loading",
        detail: `${lazyCandidates.length} below-the-fold image(s) are not marked loading='lazy'.`,
      });
    }

    const blockingScripts = Array.from(document.querySelectorAll("head script[src]")).filter(
      (script) => !script.defer && !script.async,
    );
    if (blockingScripts.length) {
      hints.push({
        severity: "high",
        label: "Render-blocking scripts",
        detail: `${blockingScripts.length} script(s) in <head> load without async/defer.`,
      });
    }

    const resourceEntries = performance.getEntriesByType("resource") || [];
    const transferBytes = resourceEntries.reduce(
      (sum, entry) => sum + ((entry.transferSize && Number.isFinite(entry.transferSize)) ? entry.transferSize : 0),
      0,
    );
    if (transferBytes > 5000000) {
      hints.push({
        severity: "medium",
        label: "Heavy network payload",
        detail: `Approx transfer size is ${(transferBytes / 1024 / 1024).toFixed(2)} MB.`,
      });
    }

    const currentHost = location.hostname;
    const thirdPartyScripts = Array.from(document.querySelectorAll("script[src]"))
      .map((node) => toAbsoluteUrl(node.getAttribute("src")))
      .filter(Boolean)
      .filter((url) => {
        try {
          return new URL(url).hostname !== currentHost;
        } catch {
          return false;
        }
      });

    if (thirdPartyScripts.length >= 8) {
      hints.push({
        severity: "medium",
        label: "Many third-party scripts",
        detail: `${thirdPartyScripts.length} script(s) are loaded from other domains.`,
      });
    }

    if (!hints.length) {
      hints.push({
        severity: "low",
        label: "No major issues flagged",
        detail: "Quick checks did not detect obvious performance risks.",
      });
    }

    return {
      stats: [
        summarizeStat("Hints", hints.length),
        summarizeStat("Resources", resourceEntries.length),
        summarizeStat("Transfer (MB)", (transferBytes / 1024 / 1024).toFixed(2)),
      ],
      hints,
      csvContent: toCsv([
        ["severity", "label", "detail"],
        ...hints.map((hint) => [hint.severity, hint.label, hint.detail]),
      ]),
    };
  }

  function collectDomQuery(opts) {
    const selector = String(opts?.selector || "").trim();
    if (!selector) {
      return { error: "A CSS selector is required." };
    }

    let nodes;
    try {
      nodes = Array.from(document.querySelectorAll(selector));
    } catch {
      return { error: "Invalid CSS selector." };
    }

    const matches = nodes.slice(0, 250).map((node, index) => {
      const classes = (node.className && typeof node.className === "string") ? node.className : "";
      const text = (node.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200);
      const html = (node.outerHTML || "").replace(/\s+/g, " ").trim().slice(0, 280);
      return {
        index: index + 1,
        tag: node.tagName.toLowerCase(),
        id: node.id || "",
        classes,
        text,
        html,
      };
    });

    return {
      stats: [
        summarizeStat("Selector", selector),
        summarizeStat("Matches", nodes.length),
        summarizeStat("Returned", matches.length),
      ],
      selector,
      totalMatches: nodes.length,
      matches,
      csvContent: toCsv([
        ["index", "tag", "id", "classes", "text"],
        ...matches.map((match) => [
          String(match.index),
          match.tag,
          match.id,
          match.classes,
          match.text,
        ]),
      ]),
    };
  }

  function collectPrivacy() {
    const domainMap = new Map();
    const currentHost = location.hostname;

    function categorize(host) {
      const h = host.toLowerCase();
      if (/google-analytics|doubleclick|segment|mixpanel|amplitude|hotjar|clarity|fullstory/.test(h)) {
        return "analytics";
      }
      if (/googletagmanager|tagmanager|tealium/.test(h)) {
        return "tag-manager";
      }
      if (/facebook|instagram|twitter|tiktok|linkedin|pinterest/.test(h)) {
        return "social";
      }
      if (/adservice|adsystem|adnxs|taboola|outbrain|criteo|pubmatic/.test(h)) {
        return "ads";
      }
      if (/cloudfront|akamai|fastly|cdn/.test(h)) {
        return "cdn";
      }
      return "other";
    }

    function bump(host, type) {
      if (!host || host === currentHost) {
        return;
      }
      if (!domainMap.has(host)) {
        domainMap.set(host, {
          domain: host,
          category: categorize(host),
          resources: 0,
          scriptRefs: 0,
          iframeRefs: 0,
        });
      }
      const entry = domainMap.get(host);
      if (type === "resource") entry.resources += 1;
      if (type === "script") entry.scriptRefs += 1;
      if (type === "iframe") entry.iframeRefs += 1;
    }

    (performance.getEntriesByType("resource") || []).forEach((entry) => {
      try {
        bump(new URL(entry.name).hostname, "resource");
      } catch {
        // ignore invalid URLs
      }
    });

    document.querySelectorAll("script[src]").forEach((node) => {
      const src = toAbsoluteUrl(node.getAttribute("src"));
      if (!src) return;
      try {
        bump(new URL(src).hostname, "script");
      } catch {
        // ignore invalid URLs
      }
    });

    document.querySelectorAll("iframe[src]").forEach((node) => {
      const src = toAbsoluteUrl(node.getAttribute("src"));
      if (!src) return;
      try {
        bump(new URL(src).hostname, "iframe");
      } catch {
        // ignore invalid URLs
      }
    });

    const domains = Array.from(domainMap.values())
      .sort((a, b) => (b.resources + b.scriptRefs + b.iframeRefs) - (a.resources + a.scriptRefs + a.iframeRefs));

    return {
      stats: [
        summarizeStat("Third-Party Domains", domains.length),
        summarizeStat(
          "Total Third-Party References",
          domains.reduce((sum, d) => sum + d.resources + d.scriptRefs + d.iframeRefs, 0),
        ),
      ],
      domains,
      csvContent: toCsv([
        ["domain", "category", "resources", "scriptRefs", "iframeRefs"],
        ...domains.map((domain) => [
          domain.domain,
          domain.category,
          String(domain.resources),
          String(domain.scriptRefs),
          String(domain.iframeRefs),
        ]),
      ]),
    };
  }

  if (actionId === "images") return collectImages();
  if (actionId === "links") return collectLinks();
  if (actionId === "contacts") return collectContacts();
  if (actionId === "seo") return collectSeo();
  if (actionId === "tables") return collectTables();
  if (actionId === "readability") return collectReadability();
  if (actionId === "performance") return collectPerformance();
  if (actionId === "dom-query") return collectDomQuery(options);
  if (actionId === "privacy") return collectPrivacy();

  return { error: "Unsupported action." };
}
