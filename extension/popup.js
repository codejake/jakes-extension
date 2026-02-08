const statusEl = document.getElementById("status");
const actionButtons = Array.from(document.querySelectorAll(".action-btn"));

const ACTION_LABELS = {
  images: "Show all linked images on page",
  links: "Extract all links",
  contacts: "Find and copy emails / phone numbers",
  seo: "SEO snapshot",
  structure: "Summarize page structure",
  tables: "Table Export",
  palette: "Color palette extractor",
  readability: "Readability mode",
  performance: "Performance hints",
  "dom-query": "DOM query runner",
  privacy: "Privacy tracker inspector",
};

actionButtons.forEach((button) => {
  button.addEventListener("click", () => runAction(button.dataset.actionId || ""));
});

async function runAction(actionId) {
  if (!actionId || !ACTION_LABELS[actionId]) {
    return;
  }

  try {
    const options = await getActionOptions(actionId);
    if (options === null) {
      setStatus("Action cancelled.", "");
      return;
    }

    setStatus("Running action...", "");
    setButtonsDisabled(true);

    const response = await chrome.runtime.sendMessage({
      type: "run-action",
      actionId,
      options,
    });

    if (!response?.ok) {
      throw new Error(response?.error || "The action failed.");
    }

    setStatus("Opened results in a new tab.", "success");
    window.close();
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Unexpected error occurred.",
      "error",
    );
  } finally {
    setButtonsDisabled(false);
  }
}

async function getActionOptions(actionId) {
  if (actionId !== "dom-query") {
    return {};
  }

  const selector = window.prompt("Enter a CSS selector to run:", "a[href]");
  if (selector === null) {
    return null;
  }
  const trimmed = selector.trim();
  if (!trimmed) {
    throw new Error("A CSS selector is required.");
  }
  return { selector: trimmed };
}

function setButtonsDisabled(disabled) {
  actionButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

function setStatus(message, state) {
  statusEl.textContent = message;
  statusEl.className = `status${state ? ` ${state}` : ""}`;
}
