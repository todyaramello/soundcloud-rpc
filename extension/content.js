let prevHash = '';

function extractTime(raw) {
  const m = raw.match(/(\d+:\d+(?::\d+)?)/);
  return m ? m[1] : '0:00';
}

function cleanTitle(t) {
  return t.replace(/^(?:Current\s*(?:track|playing):\s*)/i, '').trim();
}

function getSrc(img) {
  return img.getAttribute('src') ||
         img.getAttribute('data-src') ||
         img.getAttribute('data-url') ||
         '';
}

function getTrackInfo() {
  const info = { title: '', artist: '', artUrl: '', isPlaying: false, currentTime: '0:00', totalTime: '0:00', trackUrl: '' };

  const player = document.querySelector('[class*="playControls"]');
  if (!player) return info;

  const badge = player.querySelector('[class*="playbackSoundBadge"]');
  if (!badge) return info;

  const links = badge.querySelectorAll('a');
  let artistLink = null;
  let titleLink = null;

  for (const link of links) {
    const href = (link.getAttribute('href') || '').replace(/https?:\/\/soundcloud\.com\//, '');
    const parts = href.split('/').filter(Boolean);
    const text = link.textContent?.trim();
    if (!text || !href) continue;
    if (parts.length >= 2 && text) {
      titleLink = link;
    } else if (parts.length === 1 && text) {
      artistLink = link;
    }
  }

  if (titleLink) {
    const visibleSpan = titleLink.querySelector('[aria-hidden="true"]');
    if (visibleSpan) {
      info.title = cleanTitle(visibleSpan.textContent.trim());
    } else {
      info.title = cleanTitle(titleLink.innerText?.trim() || titleLink.textContent.trim());
    }
    info.trackUrl = titleLink.href;
  }

  if (artistLink) {
    const visibleSpan = artistLink.querySelector('[aria-hidden="true"]');
    if (visibleSpan) {
      info.artist = cleanTitle(visibleSpan.textContent.trim());
    } else {
      info.artist = cleanTitle(artistLink.innerText?.trim() || artistLink.textContent.trim());
    }
  }

  if (!info.title) {
    const clean = document.title.replace(/\s*[|–-]\s*SoundCloud.*$/i, '').trim();
    const parts = clean.split(/\s+by\s+/);
    info.title = parts[0] || clean;
    info.artist = parts[1] || info.artist;
  }

  for (const img of badge.querySelectorAll('img')) {
    let src = getSrc(img);
    if (!src) {
      const source = img.closest('picture')?.querySelector('source');
      if (source) src = source.getAttribute('srcset') || '';
    }
    if (src && src.includes('sndcdn')) {
      info.artUrl = src.replace(/-(?:large|original|t\d+x\d+|crop|badge|tiny|small|mini)\./, '-t500x500.');
      if (!info.artUrl.includes('-t500x500.')) {
        info.artUrl = src.replace(/\.(jpg|jpeg|png|webp)(\?.*)?$/, '-t500x500.$1');
      }
      break;
    }
  }

  if (!info.artUrl) {
    for (const div of badge.querySelectorAll('[class*="artwork"], [class*="Artwork"], [class*="avatar"], [class*="Avatar"]')) {
      const bg = div.style?.backgroundImage || '';
      const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (m && m[1].includes('sndcdn')) {
        info.artUrl = m[1].replace(/-(?:large|original|t\d+x\d+|crop|badge|tiny|small|mini)\./, '-t500x500.');
        break;
      }
    }
  }

  if (!info.artUrl) {
    const og = document.querySelector('meta[property="og:image"]');
    if (og) info.artUrl = og.getAttribute('content');
  }

  const playBtn = player.querySelector('[class*="playControls__play"]');
  info.isPlaying = playBtn?.classList?.contains('playing') ||
                   playBtn?.getAttribute('aria-label') === 'Pause' ||
                   false;

  const passed = player.querySelector('[class*="timePassed"], [class*="TimePassed"]');
  const dur = player.querySelector('[class*="duration"], [class*="Duration"]');
  info.currentTime = passed ? extractTime(passed.textContent) : '0:00';
  info.totalTime = dur ? extractTime(dur.textContent) : '0:00';

  return info;
}

function getHash(i) {
  return `${i.title}|${i.artist}|${i.isPlaying}|${i.currentTime}`;
}

function tick() {
  const info = getTrackInfo();
  const hash = getHash(info);
  if (hash !== prevHash && info.title) {
    prevHash = hash;
    try { chrome.runtime.sendMessage({ type: 'TRACK_UPDATE', data: info }); } catch (e) {}
  }
}

const interval = setInterval(tick, 2000);
setTimeout(tick, 500);
