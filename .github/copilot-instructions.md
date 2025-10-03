# Copilot Instructions for MultiShop Ecommerce App

## Architecture Overview

This is a full-stack MERN-style application:

- **Backend**: Node.js/Express API server with MongoDB (Mongoose) for data persistence.
- **Frontend**: React SPA with Material-UI, Firebase for authentication and notifications.
- **Key Flows**: Frontend calls backend APIs (e.g., `/api/auth/login`), backend handles auth (JWT + Firebase), queries DB, and returns JSON responses. AI chat integrates Gemini API for user queries.

## Essential Files & Structure

- **Backend Entry**: `backend/src/server.js` - Main server setup, middleware, and route mounting.
- **Routes/Controllers**: `backend/routes/` and `backend/controllers/` - API endpoints (e.g., `authRoutes.js` for login/signup).
- **Models**: `backend/models/` - Mongoose schemas (e.g., `User.js` for auth, `Notification.js` for messages).
- **Frontend Entry**: `frontend/src/App.js` - React router and component structure.
- **Auth Context**: `frontend/src/context/AuthContext.js` - Manages user state and JWT tokens.
- **API Calls**: Use `axios` with `process.env.REACT_APP_API_URL` (set to backend URL, e.g., `https://hssm-2-1.onrender.com`).

## Critical Workflows

- **Local Development**:
  - Backend: `cd backend && npm install && npm start` (runs `node src/server.js`, connects to MongoDB).
  - Frontend: `cd frontend && npm install && npm start` (dev server on port 3000).
  - Set env vars in `.env` files (e.g., `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY` for backend; `REACT_APP_API_URL` for frontend).
- **Deployment**:
  - Backend: Deploy to Render, set env vars in dashboard (e.g., `ALLOWED_ORIGINS=https://hssm-services.web.app` for CORS).
  - Frontend: Deploy to Firebase, update `REACT_APP_API_URL` to production backend URL.
- **Debugging**: Check Render/Firebase logs for errors; use `console.log` in controllers for DB queries.

## Project-Specific Patterns

- **Middleware Usage**: Always apply `{ protect }` from `authMiddleware.js` for authenticated routes; use `verifyRole(['role'])` for role checks (e.g., `verifyRole(['student'])` in `studentRoutes.js`).
- **Error Handling**: Controllers use try-catch, return `{ success: false, message: '...' }` with appropriate status codes (e.g., 500 for server errors).
- **Data Filtering**: Announcements in `getAnnouncements` filter by user role/dept (e.g., `$or: [{ targetRoles: 'all' }, { targetRoles: userRole }]`).
- **AI Integration**: Chat endpoint (`/api/chat`) constructs prompts for Gemini API; handle responses with `candidates[0].content.parts[0].text`.
- **CORS**: Configured in `server.js` with `ALLOWED_ORIGINS` env var; ensure frontend origin is allowed for cross-origin requests.
- **Auth Flow**: Login via `/api/auth/login`, store JWT in localStorage, include in headers as `Authorization: Bearer ${token}`.

## Integration Points

- **Firebase**: Used for auth (signInWithPopup), notifications (getToken for device tokens), and hosting frontend.
- **Gemini AI**: API calls in `chatRoutes.js`; requires `GEMINI_API_KEY` env var.
- **MongoDB**: Queries use Mongoose (e.g., `User.findById(decoded.userId)` in auth middleware).

Focus on these patterns when modifying code to maintain consistency.
