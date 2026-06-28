const DiscordRPC = require('discord-rpc');
const WebSocket = require('ws');

const CLIENT_ID = '1520467260727103609'; // replace with your bots application id

const WS_PORT = 8765;

let rpc;
let reconnectTimer;
let currentActivity = null;

DiscordRPC.register(CLIENT_ID);

async function initRPC() {
  try {
    rpc = new DiscordRPC.Client({ transport: 'ipc' });

    rpc.on('ready', () => {
      console.log('Connected to Discord');
      if (currentActivity) {
        setActivity(currentActivity);
      }
    });

    rpc.on('disconnected', () => {
      console.log('Disconnected, reconnecting in 5 seconds');
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(initRPC, 5000);
    });

    await rpc.login({ clientId: CLIENT_ID });
  } catch (err) {
    console.error('failed:', err.message);
    console.log('Retrying in 5 seconds');
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(initRPC, 5000);
  }
}

function parseTime(ts) {
  if (!ts) return 0;
  const parts = ts.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function setActivity(data) {
  if (!rpc || !rpc.user) return;
  currentActivity = data;
  console.log('[Activity]', JSON.stringify(data));

  if (!data || !data.title) {
    rpc.clearActivity();
    return;
  }

  const elapsed = parseTime(data.currentTime);
  const total = parseTime(data.totalTime);
  const now = Math.floor(Date.now() / 1000);

  const activity = {
    details: data.title.substring(0, 128),
    state: (data.artist || 'Unknown').substring(0, 128),
    type: 2,
    instance: false,
  };

  if (data.artUrl) {
    activity.largeImageKey = data.artUrl;
    activity.smallImageKey = 'soundcloud';
    activity.smallImageText = data.isPlaying ? 'Playing' : 'Paused';
  }

  if (total > 0) {
    activity.startTimestamp = now - elapsed;
    activity.endTimestamp = now + (total - elapsed);
  }

  if (data.trackUrl) {
    activity.buttons = [{ label: 'Listen on SoundCloud', url: data.trackUrl }];
  }

  rpc.setActivity(activity).catch(console.error);
}

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`[Server] WebSocket listening on ws://localhost:${WS_PORT}`);
});

wss.on('connection', (ws) => {
  console.log('[Server] Extension connected');

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'TRACK_UPDATE') {
        setActivity(data.data);
      }
    } catch (e) {
    }
  });

  ws.on('close', () => {
    console.log('[Server] Extension disconnected');
  });
});

initRPC();
