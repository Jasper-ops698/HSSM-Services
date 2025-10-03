// Allow environment variable to contain a comma-separated list (e.g. for deploy/runtime convenience)
// Use the first non-empty trimmed value as the effective API base URL.
const _rawApi = process.env.REACT_APP_API_URL || 'https://hssm-2-1.onrender.com';
const _firstApi = (typeof _rawApi === 'string' ? _rawApi.split(',').map(s => s.trim()).find(Boolean) : _rawApi) || 'https://hssm-2-1.onrender.com';
export const API_BASE_URL = _firstApi;
export const API_URL = _firstApi;
