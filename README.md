# Metamend Dashboard

React 19 + TypeScript frontend for the NEX Health Intelligence platform.

## Local Development

```bash
npm install
npm run dev
```

## Docker

```bash
docker build -t metamend-dashboard .
docker run -p 3000:80 -e API_URL=http://your-backend:8080 metamend-dashboard
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API base URL (used by nginx proxy) | `http://localhost:8080` |

## Tech Stack

- React 19, TypeScript, Vite
- TanStack Router (file-based routing)
- Tailwind CSS v4
- Recharts, Three.js, React Flow
- Axios
