// use browser.* for Firefox, chrome.* for Chrome. Shim both:
const storage = typeof browser !== "undefined" ? browser.storage.local : chrome.storage.local;

const toggles = ["replies", "likes", "retweets", "bookmarks", "views", "twitchViews", "seventvRaids", "seventvUserMessages", "twitchGoLive"];

async function loadPreferences() {
  const result = await storage.get(toggles);
  toggles.forEach(key => {
    document.getElementById(key).checked = result[key] ?? true;
  });
  updateSectionButtons();
}

function savePreferences() {
  const prefs = {};
  toggles.forEach(key => {
    prefs[key] = document.getElementById(key).checked;
  });
  storage.set(prefs);
  updateSectionButtons();
}

function updateSectionButtons() {
  document.querySelectorAll(".section-toggle").forEach(btn => {
    const keys = btn.dataset.keys.split(",");
    const allChecked = keys.every(key => document.getElementById(key)?.checked);
    btn.textContent = allChecked ? "All off" : "All on";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPreferences();
  toggles.forEach(id => {
    document.getElementById(id).addEventListener("change", savePreferences);
  });

  document.querySelectorAll(".section-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const keys = btn.dataset.keys.split(",");
      const allChecked = keys.every(key => document.getElementById(key)?.checked);
      keys.forEach(key => {
        const el = document.getElementById(key);
        if (el) el.checked = !allChecked;
      });
      savePreferences();
    });
  });
});
