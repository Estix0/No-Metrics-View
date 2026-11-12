(async function () {
  'use strict';

  const storageRoot = typeof browser !== "undefined" ? browser.storage : chrome.storage;
  const storage = storageRoot.local;

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
      '[data-a-target="home-live-overlay-button"]',
      '.tw-media-card-stat',
      '[aria-label="individual-view-count"]'
    ],
    seventvRaids: [
      '.seventv-raid-message-container span.bold:nth-child(2)',
      '[data-test-selector="raid-message"]'
    ],
    twitchGoLive: 'a[href*="dashboard.twitch.tv"][href*="/stream"]'
  };

  const hostname = location.hostname;
  const isTwitter = hostname.includes("x.com") || hostname.includes("twitter.com");
  const isTwitch = hostname.includes("twitch.tv");

  let currentPrefs = {
    replies: true,
    likes: true,
    retweets: true,
    bookmarks: true,
    views: true,
    twitchViews: true,
    seventvRaids: true,
    seventvUserMessages: true,
    twitchGoLive: true
  };

  async function loadPrefs() {
    const prefs = await storage.get([
      "replies", "likes", "retweets", "bookmarks", "views",
      "twitchViews", "seventvRaids", "seventvUserMessages", "twitchGoLive"
    ]);
    currentPrefs = {
      replies: prefs.replies ?? true,
      likes: prefs.likes ?? true,
      retweets: prefs.retweets ?? true,
      bookmarks: prefs.bookmarks ?? true,
      views: prefs.views ?? true,
      twitchViews: prefs.twitchViews ?? true,
      seventvRaids: prefs.seventvRaids ?? true,
      seventvUserMessages: prefs.seventvUserMessages ?? true,
      twitchGoLive: prefs.twitchGoLive ?? true
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

    document.querySelectorAll('.tw-channel-status-text-indicator').forEach(indicator => {
      const parentContainer = indicator.parentElement?.parentElement;
      if (!parentContainer) return;

      parentContainer.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (shouldHide) {
            if (node.nodeValue.trim() !== '' && /\d/.test(node.nodeValue)) {
              node._originalText = node.nodeValue;
              node.nodeValue = '';
            }
          } else {
            if (node.nodeValue === '' && node._originalText) {
              node.nodeValue = node._originalText;
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'span') {
          if (/\d/.test(node.textContent)) {
            node.style.display = shouldHide ? 'none' : '';
          }
        }
      });
    });

    document.querySelectorAll('[data-test-selector="metadata-layout__split-top"] p').forEach(p => {
      const dot = p.previousElementSibling;
      const hasDotBefore = dot && dot.tagName === 'SPAN' && dot.textContent.trim() === '·';
      const isAfterCategory = p.matches('a[data-a-target="video-info-game-boxart-link"] ~ p');
      if ((isAfterCategory || hasDotBefore) && /\d/.test(p.textContent)) {
        p.style.display = shouldHide ? 'none' : '';
        if (hasDotBefore) {
          dot.style.display = shouldHide ? 'none' : '';
        }
      }
    });
  }

  function toggleSeventvRaids(shouldHide) {
    selectors.seventvRaids.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = shouldHide ? 'none' : '';
      });
    });

    document.querySelectorAll('.seventv-raid-message-container').forEach(container => {
      const boldSpans = container.querySelectorAll('span.bold');
      if (boldSpans.length > 1) {
        boldSpans[1].style.display = shouldHide ? 'none' : '';
      }
    });
  }

  function removeSeventvUserMessages(shouldRemove) {
    if (!shouldRemove) return;

    document.querySelectorAll('.seventv-user-message').forEach(msg => {
      const name = msg.querySelector('.seventv-chat-user-username span')?.textContent?.trim().toLowerCase();
      if (name === 'streamelements' || name === 'soundalerts') msg.remove();
    });
  }

  function toggleTwitchGoLive(shouldHide) {
    document.querySelectorAll(selectors.twitchGoLive).forEach(targetLink => {
      const wrapper = targetLink.closest('div');
      const target = (wrapper && wrapper.parentElement && wrapper.children.length === 1)
        ? wrapper
        : targetLink;
      target.style.display = shouldHide ? 'none' : '';
    });
  }

  function applyToggles() {
    if (isTwitter) {
      ['replies', 'likes', 'retweets', 'bookmarks', 'views'].forEach(key => {
        toggleTwitterStatNumbers(key, currentPrefs[key]);
      });
    }

    if (isTwitch) {
      toggleTwitchViews(currentPrefs.twitchViews);
      toggleSeventvRaids(currentPrefs.seventvRaids);
      removeSeventvUserMessages(currentPrefs.seventvUserMessages);
      toggleTwitchGoLive(currentPrefs.twitchGoLive);
    }
  }

  const domObserver = new MutationObserver(() => {
    applyToggles();
  });

  async function init() {
    await loadPrefs();
    applyToggles();

    if (isTwitter || isTwitch) {
      domObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (isTwitch) {
      setInterval(() => {
        toggleTwitchViews(currentPrefs.twitchViews);
        toggleSeventvRaids(currentPrefs.seventvRaids);
        removeSeventvUserMessages(currentPrefs.seventvUserMessages);
        toggleTwitchGoLive(currentPrefs.twitchGoLive);
      }, 150);
    }
  }

  storageRoot.onChanged.addListener((changes, area) => {
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
