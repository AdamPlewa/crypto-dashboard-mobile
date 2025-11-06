// src/services/fetchWithRetry.js
import axios from 'axios';

const memoryCache = new Map();
let globalCooldownUntil = 0; // kiedy kończy się cooldown po 429

export async function fetchWithRetry(url, options = {}) {
  const {
    retries = 3,
    backoffBase = 2000,
    cacheKey,
    cacheTTL = 20_000,
    axiosConfig = {},
  } = options;

  // Jeśli cache ma świeże dane → zwróć natychmiast
  if (cacheKey && memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey);
    if (Date.now() < entry.expiresAt) {
      return entry.data;
    } else {
      memoryCache.delete(cacheKey);
    }
  }

  // Jeśli globalny cooldown (np. po 429)
  if (Date.now() < globalCooldownUntil) {
    const waitMs = globalCooldownUntil - Date.now();
    console.warn(`fetchWithRetry: global cooldown active (${waitMs}ms)`);
    await new Promise(res => setTimeout(res, waitMs));
  }

  let attempt = 0;
  while (true) {
    try {
      const resp = await axios.get(url, axiosConfig);
      const data = resp.data;

      if (cacheKey) {
        memoryCache.set(cacheKey, { data, expiresAt: Date.now() + cacheTTL });
      }
      return data;

    } catch (err) {
      attempt++;
      const status = err?.response?.status;

      // CoinGecko 429 → ustaw globalny cooldown
      if (status === 429) {
        const retryAfter = Number(err?.response?.headers?.['retry-after']) || 60;
        const waitMs = retryAfter * 1000;
        globalCooldownUntil = Date.now() + waitMs;
        console.warn(`Rate limited (429). Waiting ${waitMs / 1000}s before retry`);
        await new Promise(res => setTimeout(res, waitMs));
        continue;
      }

      // inne 4xx → nie retry'ujemy
      if (status && status >= 400 && status < 500) {
        throw err;
      }

      // jeśli osiągnięto limit prób
      if (attempt > retries) {
        throw err;
      }

      // exponential backoff
      const wait = backoffBase * 2 ** (attempt - 1);
      console.warn(`fetchWithRetry: attempt ${attempt}/${retries} failed (status ${status}). Backing off ${wait}ms`);
      await new Promise(res => setTimeout(res, wait));
    }
  }
}

export default fetchWithRetry;
