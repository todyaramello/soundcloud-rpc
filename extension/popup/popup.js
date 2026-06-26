const wsDot = document.getElementById('wsDot');
const wsStatus = document.getElementById('wsStatus');
const trackInfo = document.getElementById('trackInfo');

function updateUI(msg) {
  if (!msg) return;

  const connected = msg.data?.wsConnected;
  wsDot.className = 'dot ' + (connected ? 'green' : 'red');
  wsStatus.textContent = 'server: ' + (connected ? 'connected' : 'disconnected');

  if (connected && msg.data?.title) {
    trackInfo.innerHTML = `
      <div class="track-title">${escapeHtml(msg.data.title)}</div>
      <div class="track-artist">${escapeHtml(msg.data.artist || 'Unknown')}</div>
      <div class="track-time">${msg.data.isPlaying ? '▶ playing' : '⏸ paused'} ${msg.data.currentTime} / ${msg.data.totalTime}</div>
    `;
  } else if (connected) {
    trackInfo.innerHTML = `<div class="empty">no track yet - open soundcloud and play smth</div>`;
  } else {
    trackInfo.innerHTML = `<div class="empty">waiting for server...</div>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (resp) => {
  updateUI({ data: resp || {} });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATUS_UPDATE') {
    updateUI(msg);
  }
});
