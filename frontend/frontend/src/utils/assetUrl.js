import { API_BASE_URL } from '../config';

export default function assetUrl(path) {
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  if (!path) return `${base}/uploads/placeholder-image.png`;
  const cleaned = path.replace(/^\/+/, '');
  return `${base}/${cleaned}`;
}
