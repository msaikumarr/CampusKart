Deployment guide — Vercel (client) + Render (server)

Overview
- Frontend: Vite React app (client/) — deploy to Vercel (static build)
- Backend: Express + Socket.io (server/) — deploy to Render (or Railway)

Server (Render)
1. Push your repo to GitHub (repo already present).
2. Create a new Web Service on Render and connect your GitHub repo.
3. Set the root directory to `/server` and the build & start commands:
   - Build Command: (none required)
   - Start Command: `npm start`
   - Environment: `Node 18+` (Render sets this)
4. Add environment variables (from `server/.env.example`) in Render's dashboard:
   - `JWT_SECRET`, `MONGODB_URI`, `SERVER_URL` (e.g. https://your-server.onrender.com)
   - `CLIENT_URLS` or `CLIENT_URL` (your Vercel client URL)
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `COLLEGE_EMAIL_DOMAINS`
5. Websockets: Render supports WebSockets — socket.io should work out of the box.
6. Uploads: This project writes to `server/uploads` locally. For production, use external object storage (S3, DigitalOcean Spaces) and update upload middleware accordingly.

Client (Vercel)
1. In Vercel, create a new project and import the GitHub repo.
2. Set the Root Directory to `/client`.
3. Build Command: `npm run build` (Vercel will detect automatically).
4. Output Directory: `dist`
5. Add any environment variables needed for the client (if any). The backend URL should be available to the client via runtime config or by setting `VITE_API_URL` in Vercel if you add it to the client code.

Optional: Serve client from backend
- Build the client locally (`cd client && npm run build`) and copy `client/dist` to `server/public` or serve statically from Express.
- Then deploy a single service (server) that serves API and static files. You would need to add static middleware in `server.js` (example below):

  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });

Notes & Checklist
- Ensure `server/.env` on Render contains production values.
- Confirm CORS `CLIENT_URLS` includes Vercel domain.
- For file uploads, use remote storage in production.
- Set `NODE_ENV=production` on the server service.

Quick commands (local)
```bash
# Build client
cd client
npm install
npm run build

# Run server locally
cd ../server
npm install
npm run dev
```
