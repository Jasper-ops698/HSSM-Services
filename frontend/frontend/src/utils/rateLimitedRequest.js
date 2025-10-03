import api from '../api';

/**
 * Makes an axios request with exponential backoff on 429 errors.
 * @param {Object} config - Axios request config.
 * @param {number} retries - Max number of retries.
 * @param {number} delay - Initial delay in ms.
 */
export async function rateLimitedRequest(config, retries = 5, delay = 1000) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
  return await api(config);
    } catch (err) {
      if (err.response && err.response.status === 429 && attempt < retries) {
        // If server provided a Retry-After header, respect it (seconds or HTTP-date)
        const ra = err.response.headers && (err.response.headers['retry-after'] || err.response.headers['Retry-After']);
        if (ra) {
          let waitMs = delay;
          // If numeric, header is seconds
          if (/^\d+$/.test(String(ra).trim())) {
            waitMs = parseInt(String(ra).trim(), 10) * 1000;
          } else {
            // Try parse HTTP-date
            const date = Date.parse(ra);
            if (!isNaN(date)) {
              const diff = date - Date.now();
              if (diff > 0) waitMs = diff;
            }
          }
          await new Promise(res => setTimeout(res, waitMs));
          // Increase delay for next exponential step
          delay = Math.max(delay * 2, 1000);
          attempt++;
        } else {
          // Wait for delay (exponential backoff)
          const wait = delay;
          await new Promise(res => setTimeout(res, wait));
          delay *= 2;
          attempt++;
        }
      } else {
        throw err;
      }
    }
  }
  throw new Error('Too many requests. Please try again later.');
}
