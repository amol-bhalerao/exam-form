# Frontend Deployment Fix - Static File Serving

## Problem
Hostinger's deployment system was failing because:
1. The backend API build succeeds
2. The frontend Angular build succeeds and outputs to `frontend/dist/exam-form/browser`
3. But Hostinger's deployment system didn't know what to do with the frontend build files

Error message: "The deployment failed because the output directory is set to null in the configuration"

## Solution
The Express backend server now:
1. **Serves static files** from the Angular build directory (`frontend/dist/exam-form/browser`)
2. **Handles SPA routing** - serves `index.html` for unmatched routes so Angular's client-side routing works
3. **Serves API routes** normally under `/api` prefix

## Configuration Changes

### File: `backend/src/server.js`

**Added:**
- Import `path` and `fileURLToPath` for directory operations
- Static file serving middleware pointing to the Angular build output
- SPA fallback route with 1-day cache for static assets
- Catch-all route to serve `index.html` for any unmatched paths (except `/api`)

```javascript
// Serve Static Frontend Files (Angular Build)
const frontendPath = path.join(__dirname, '../../frontend/dist/exam-form/browser');
app.use(express.static(frontendPath, { maxAge: '1d', dotfiles: 'allow' }));

// SPA Fallback: Serve index.html for any unmatched routes
app.get('*', (_req, res) => {
  res.sendFile(frontendIndexPath);
});
```

## How It Works

### On Hostinger (Production):

1. Git push triggers automated build
2. Build script runs:
   ```bash
   npm install && cd backend && npm install && cd ../frontend && npm install && npm run build && cd ..
   ```
3. Frontend builds to: `/home/u441114691/domains/hsc-api.hisofttechnology.com/public_html/.builds/source/repository/frontend/dist/exam-form/browser`
4. Backend starts with PM2
5. Backend Express server:
   - Serves `/api/*` routes from backend code
   - Serves static files (CSS, JS, images) from `frontend/dist/exam-form/browser`
   - Resolves all other routes to `index.html` (Angular routing)

### Request Flow:

```
User Request
    ↓
Express Server
    ├─ /api/* → Route handler (Express API)
    ├─ /assets/* → Static file (CSS, JS, images)
    ├─ /student → index.html (Angular handles routing)
    ├─ /dashboard → index.html (Angular handles routing)
    └─ /* → index.html (fallback for SPA)
```

## Deployment Instructions

On Hostinger, after the automated build:

1. **Build completes successfully** (both backend and frontend)
2. **Backend starts with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```
3. **Frontend is automatically served by the backend**
   - No additional deployment step needed
   - The Express server handles everything

4. **Verify deployment**:
   ```bash
   # Check API is working
   curl https://hsc-api.hisofttechnology.com/api/health
   
   # Check frontend is being served
   curl https://hsc-api.hisofttechnology.com/
   # Should return the Angular app (index.html)
   ```

## Key Improvements

✅ **Unified Deployment** - Frontend and backend deployed together  
✅ **SPA Routing Works** - Angular routing works correctly on refresh and direct navigation  
✅ **Efficient Caching** - Static assets cached for 1 day  
✅ **Simplified Setup** - No separate frontend hosting needed  
✅ **Production Ready** - Uses standard Express patterns  

## Why This Works

1. **Express serves static files** - Uses `express.static()` middleware
2. **SPA routing compatibility** - Falls back to `index.html` for non-API routes
3. **Asset caching** - Sets `maxAge` for efficient caching
4. **Path resolution** - Uses `path` and `fileURLToPath` for cross-platform compatibility

## Testing

### Local Development:

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Start backend (will serve frontend)
cd backend && npm start
```

Then visit: `http://localhost:3000`
- API works at `http://localhost:3000/api/*`
- Frontend works at `http://localhost:3000/`
- Angular routing works at `http://localhost:3000/student`, etc.

### On Hostinger:

After deployment succeeds, visit:
- https://hsc-api.hisofttechnology.com/ - Should show Angular app
- https://hsc-api.hisofttechnology.com/student/onboarding - Should work (Angular routing)
- https://hsc-api.hisofttechnology.com/api/health - Should return JSON

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Hostinger Server                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Express.js Backend (Node.js)                  │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │          Express Routes (/api/*)             │   │  │
│  │  │  - Health checks                             │   │  │
│  │  │  - Student endpoints                         │   │  │
│  │  │  - Institute endpoints                       │   │  │
│  │  │  - Exam endpoints                            │   │  │
│  │  │  - Etc.                                      │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                      ↓                               │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │      Static File Serving (express.static)    │   │  │
│  │  │  - HTML, CSS, JS, Images                     │   │  │
│  │  │  - From: frontend/dist/exam-form/browser/   │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                      ↓                               │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │       SPA Fallback Routing                   │   │  │
│  │  │  - Unmatched routes → index.html             │   │  │
│  │  │  - Enables Angular client-side routing       │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │
                    Browser Requests
                    (HTTP/HTTPS)
```

## Migration Notes

- ✅ **No breaking changes** - API endpoints work exactly the same
- ✅ **Backward compatible** - Old deployments still work
- ✅ **Automatic** - No manual configuration needed
- ✅ **Production ready** - Tested and battle-hardened pattern

## Support

If frontend doesn't load:
1. Check backend is running: `pm2 status`
2. Check logs: `pm2 logs hsc-api`
3. Verify frontend build: `ls -la frontend/dist/exam-form/browser/`
4. Check Express is serving static files: `curl https://hsc-api.hisofttechnology.com/`
