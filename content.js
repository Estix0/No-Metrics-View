(async function () {
  'use strict';

  const storage = typeof browser !== "undefined" ? browser.storage.local : chrome.storage.local;

  const selectors = {
    replies: '[data-testid="reply"]',
    likes: ['[data-testid="like"]', '[data-testid="unlike"]'],
    retweets: ['[data-testid="retweet"]', '[data-testid="unretweet"]'],
    bookmarks: '[data-testid="bookmark"]',
    views: [
      'a[href*="/status/"][href*="/analytics"] [data-testid="app-text-transition-container"]',
      'div[style="color: rgb(255, 255, 255);"] [data-testid="app-text-transition-container"]'
    ],
    twitchViews: [
      '[data-a-target="animated-channel-viewers-count"]',
      '[data-a-target="preview-card-viewers-count"]',
      '[data-a-target="side-nav-live-status"]',
      '.tw-media-card-stat',
      '[aria-label="individual-view-count"]'
    ],
    seventvRaids: [
      '.seventv-raid-message-container span.bold:nth-child(2)',
      '[data-test-selector="raid-message"]'
    ],
    seventvUserMessages: [
      '.seventv-user-message:has(.seventv-chat-user-username span:contains("StreamElements"))',
      '.seventv-user-message:has(.seventv-chat-user-username span:contains("streamelements"))'
    ]
  };

  let currentPrefs = {
    replies: true,
    likes: true,
    retweets: true,
    bookmarks: true,
    views: true,
    twitchViews: true,
    seventvRaids: true,
    seventvUserMessages: true
  };

  async function loadPrefs() {
    const prefs = await storage.get([
      "replies", "likes", "retweets", "bookmarks", "views",
      "twitchViews", "seventvRaids", "seventvUserMessages"
    ]);
    currentPrefs = {
      replies: prefs.replies ?? true,
      likes: prefs.likes ?? true,
      retweets: prefs.retweets ?? true,
      bookmarks: prefs.bookmarks ?? true,
      views: prefs.views ?? true,
      twitchViews: prefs.twitchViews ?? true,
      seventvRaids: prefs.seventvRaids ?? true,
      seventvUserMessages: prefs.seventvUserMessages ?? true
    };
  }

  function toggleTwitterStatNumbers(key, shouldHide) {
    const sel = selectors[key];
    if (!sel) return;
    const selectorList = Array.isArray(sel) ? sel : [sel];
    selectorList.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const numberSpan = el.querySelector('span > span') || el.querySelector('span');
        if (numberSpan) {
          numberSpan.style.display = shouldHide ? 'none' : '';
        }
      });
    });

    // For views, special handling:
    if (key === "views") {
      document.querySelectorAll('[data-testid="app-text-transition-container"]').forEach(el => {
        const parentDiv = el.closest('div[dir="ltr"]');
        if (!parentDiv) return;
        const viewsLabel = Array.from(parentDiv.querySelectorAll('span')).find(s => s.textContent.trim().toLowerCase() === 'views');
        if (viewsLabel) {
          el.style.display = shouldHide ? 'none' : '';
        }
      });
    }
  }

  function toggleTwitchViews(shouldHide) {
    selectors.twitchViews.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = shouldHide ? 'none' : '';
      });
    });
  }

  // 7TV Raids toggle
  function toggleSeventvRaids(shouldHide) {
    document.querySelectorAll('.seventv-raid-message-container').forEach(container => {
      const boldSpans = container.querySelectorAll('span.bold');
      if (boldSpans.length > 1) {
        boldSpans[1].style.display = shouldHide ? 'none' : '';
      }
    });
  }

  // Remove StreamElements messages
  function removeSeventvUserMessages(shouldRemove) {
    if (!shouldRemove) return;

    document.querySelectorAll('.seventv-user-message').forEach(msg => {
      const name = msg.querySelector('.seventv-chat-user-username span')?.textContent?.trim().toLowerCase();
      if (name === 'streamelements') msg.remove();
    });
  }

  function applyToggles() {
    ['replies', 'likes', 'retweets', 'bookmarks'].forEach(key => {
      toggleTwitterStatNumbers(key, currentPrefs[key]);
    });

    toggleTwitterStatNumbers('views', currentPrefs.views);
    toggleTwitchViews(currentPrefs.twitchViews);
    toggleSeventvRaids(currentPrefs.seventvRaids);
    removeSeventvUserMessages(currentPrefs.seventvUserMessages);
  }

  // MutationObserver for Twitter dynamic content
  const twitterObserver = new MutationObserver(() => {
    applyToggles();
  });

  function observeTwitter() {
    twitterObserver.observe(document.body, { childList: true, subtree: true });
  }

  async function init() {
    await loadPrefs();
    applyToggles();

    if (location.hostname.includes("x.com") || location.hostname.includes("twitter.com")) {
      observeTwitter();
    }

    setInterval(() => {
      toggleTwitchViews(currentPrefs.twitchViews);
      toggleSeventvRaids(currentPrefs.seventvRaids);
      removeSeventvUserMessages(currentPrefs.seventvUserMessages);
    }, 150);
  }

  const hideRaidMessages = () => {
    selectors.seventvRaids.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) el.style.display = 'none';
    });
  };

  // Initial hide in case they're already present
  hideRaidMessages();
  removeSeventvUserMessages(true);

  // Observe DOM changes for dynamically injected raid messages and user messages
  const raidObserver = new MutationObserver(() => {
    hideRaidMessages();
    removeSeventvUserMessages(currentPrefs.seventvUserMessages);
  });
  raidObserver.observe(document.body, { childList: true, subtree: true });

  storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    let changed = false;
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key in currentPrefs && currentPrefs[key] !== newValue) {
        currentPrefs[key] = newValue;
        changed = true;
      }
    }
    if (changed) applyToggles();
  });

  init();

})();

