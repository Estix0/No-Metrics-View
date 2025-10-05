// use browser.* for Firefox, chrome.* for Chrome. Shim both:
const storage = typeof browser !== "undefined" ? browser.storage.local : chrome.storage.local;

const toggles = ["replies", "likes", "retweets", "bookmarks", "views", "twitchViews", "seventvRaids", "seventvUserMessages"];

function loadPreferences() {
  storage.get(toggles, (result) => {
    toggles.forEach(key => {
      document.getElementById(key).checked = !!result[key];
    });
  });
}

function savePreferences() {
  toggles.forEach(key => {
    const value = document.getElementById(key).checked;
    storage.set({ [key]: value });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPreferences();
  toggles.forEach(id => {
    document.getElementById(id).addEventListener("change", savePreferences);
  });
});

