const DEFAULT_PROD_API = 'https://hssmservices-cwggbkcpadg2d3be.uaenorth-01.azurewebsites.net';
const DEFAULT_DEV_API = 'http://localhost:4000';

const collectCandidates = () => {
	const candidates = [];

	if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
		const raw = String(process.env.REACT_APP_API_URL);
		raw.split(',').map(s => s.trim()).filter(Boolean).forEach((val) => {
			if (!candidates.includes(val)) candidates.push(val);
		});
	}

	if (typeof window !== 'undefined') {
		if (window.__API_BASE_URL__) {
			const legacy = String(window.__API_BASE_URL__).trim();
			if (legacy && !candidates.includes(legacy)) candidates.push(legacy);
		}

		const hostname = window.location && window.location.hostname;
		if (hostname && ['localhost', '127.0.0.1'].includes(hostname) && !candidates.includes(DEFAULT_DEV_API)) {
			candidates.push(DEFAULT_DEV_API);
		}
	}

	if (!candidates.includes(DEFAULT_PROD_API)) {
		candidates.push(DEFAULT_PROD_API);
	}

	return candidates;
};

const API_BASE = collectCandidates().find(Boolean) || DEFAULT_PROD_API;

export const API_BASE_URL = API_BASE;
export const API_URL = API_BASE;
