# Madhwa Video Backend Server

Fetches the latest videos from the YouTube channel, auto-classifies them into categories, and serves them to the frontend via a REST API.

## Setup

### 1. Get a YouTube API Key

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create (or select) a project
3. Go to **APIs & Services → Library** → search and enable **YouTube Data API v3**
4. Go to **APIs & Services → Credentials → Create API Key**
5. (Recommended) Restrict the key: Application restrictions → HTTP referrers; API restrictions → YouTube Data API v3

### 2. Configure

```bash
cd server
cp .env.example .env
# Now edit .env and paste your API key
```

### 3. Run

```bash
# Backend only
cd server
npm start

# OR from the root — runs both frontend (Vite) AND backend together:
npm run dev:all
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/videos` | All videos, latest first (cached 15 min) |
| GET | `/api/videos/featured` | Single latest video |
| GET | `/api/videos/refresh` | Force cache refresh |
| GET | `/api/health` | Server health + config status |

### Auto-classification

Videos are automatically classified into categories based on keyword matching in the title and description:

| Category | Keywords matched |
|----------|-----------------|
| Philosophy | dwaita, vedanta, siddhanta, pramana, mayavad, tattvavada |
| Temples | mutt, udupi, temple, krishna, shrine |
| Music & Poetry | haridasa, bhajan, music, song, poem, carnatic |
| Biography | biography, life of, madhvacharya, anandatirtha |
| History | ashta matha, eight mutt, history of |
| Traditions | paryaya, festival, ritual, ceremony, tradition |
| Spirituality | bhakti, devotion, prayer, worship, spiritual |
| General | everything else |

### Auto-update

The cache automatically refreshes every **15 minutes**. When you upload a new video to YouTube, it will appear on the website within 15 minutes without any manual intervention.

For immediate updates after uploading: `GET /api/videos/refresh`

### Deployment

On a server (e.g. DigitalOcean, Railway, Render):

```bash
# Start with PM2
pm2 start server/index.js --name madhwa-backend

# Or Docker (add Dockerfile as needed)
```

The Vite frontend's proxy config (`vite.config.js`) handles `/api/*` routing in development automatically. For **production builds**, set the `VITE_API_BASE` env var or configure your reverse proxy (nginx/Caddy) to route `/api/*` to the backend server.
