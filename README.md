# ProITBridge — AI Career Transformation Platform

Full-stack monorepo.

```
.
├── package.json   root scripts (run both apps from here)
├── frontend/      React + TypeScript + Vite
└── backend/       Node.js + Express
```

## First-time setup

```bash
npm run install:all
```

Then copy the backend env template:

```bash
cp backend/.env.example backend/.env
```

## Running both apps together

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:8080  (health check at `/health`)

## Running individually

```bash
npm run dev:frontend
npm run dev:backend
```
