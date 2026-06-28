# SoundCloud RPC

This uses a chrome extension and a local server to show the music you are listening to on SoundCloud, it looks similar to PreMid's but with some additional features, easier to setup and lightweight.

It works by reading the current song directly from the SoundCloud web player through the chrome extension then sending that information to the websocket, and then updating the Discord RPC through the Discord IPC API.

## Features

- Displays the current track and artist
- Live progress bar and timestamps
- Album artwork
- Play / pause detection
- "Listen on SoundCloud" button
- Automatically reconnects to Discord and the extension if either disconnects

## Requirements

- Node.js 18+
- Discord Desktop Application (any version works)
- Every chromium browser, such as: Chrome, Edge, Brave, Opera and more

## Installation

Clone the repository,
```bash
git clone https://github.com/todyaramello/soundcloud-rpc.git
cd soundcloud-rpc
```
Install the dependencies,
```bash
cd server
npm install
```
Start the server
```bash
npm start
```

## Loading the extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension` folder

Open SoundCloud, start playing a track, and your Discord status should update automatically.

## Detailed explanation on how it works

```text
SoundCloud
     │
     ▼
Content Script
     │
     ▼
Background Service Worker
     │
     ▼
WebSocket (localhost:8765)
     │
     ▼
Node.js RPC Server
     │
     ▼
Discord IPC
     │
     ▼
Discord Rich Presence
```

## Additional information

- Discord must be running before starting the server.

## License
MIT
