import { io } from 'socket.io-client';
import { API_BASE_URL as CONFIG_API_BASE } from './config';

// Build socket URL with fallbacks. Some deployments may provide a comma-separated
// REACT_APP_API_URL; config.js already normalized to the first valid entry.
const legacyGlobal = (typeof window !== 'undefined' && window.__API_BASE_URL__) || null;
const locationOrigin = (typeof window !== 'undefined' && window.location && window.location.origin) || null;
const fallback = legacyGlobal || locationOrigin || 'http://localhost:5000';

// Choose the first valid, non-empty option and strip trailing slashes
const rawBase = (CONFIG_API_BASE && String(CONFIG_API_BASE).trim()) || fallback;
const base = rawBase.replace(/\/+$/, '');

const socket = io(base, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
