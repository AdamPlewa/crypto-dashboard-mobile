// src/services/fetchWithRetry.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF = 500; // ms, mnożnik

async function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

/**
 * fetchWithRetry(url, options)
 * - retries: ile prób (domyślnie 3)
 * - cacheKey: jeśli podasz string, wynik zostanie zapisany w AsyncStorage jako fallback
 */
export async function fetchWithRetry(url, { retries = DEFAULT_RETRIES, cacheKey = null, timeout = 10000 } = {}) {
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      const source = axios.CancelToken.source();
      const timer = setTimeout(() => source.cancel(`timeout ${timeout}ms`), timeout);

      const res = await axios.get(url, {
        cancelToken: source.token,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoDashboard/1.0', // pomocne przy niektórych API
        },
      });

      clearTimeout(timer);

      // zapis do cache jeśli podano cacheKey
      if (cacheKey) {
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: res.data }));
        } catch (e) {
          // ignore cache write errors
          console.warn('Cache write failed', e);
        }
      }

      return res.data;
    } catch (err) {
      lastError = err;
      attempt += 1;

      // jeśli 429 — możemy zrobić dłuższe czekanie
      const status = err?.response?.status;
      if (status === 429) {
        // jeśli mamy cache — zwróć cache (bez czekania) jako fallback
        if (cacheKey) {
          try {
            const raw = await AsyncStorage.getItem(cacheKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              console.warn('Using cached result due to 429');
              return parsed.data;
            }
          } catch (e) { /* ignore */ }
        }
        // jeżeli brak cache, rób backoff i retry
        const delay = DEFAULT_BACKOFF * Math.pow(2, attempt); // expon. backoff
        console.warn(`429 received — backoff ${delay}ms, attempt ${attempt}/${retries}`);
        await sleep(delay);
        continue;
      }

      // gdy timeout (axios cancel) lub inny błąd sieciowy -> backoff i retry
      const delay = DEFAULT_BACKOFF * Math.pow(2, attempt);
      console.warn(`Fetch error (attempt ${attempt}): ${err?.message || err}. Retrying in ${delay}ms`);
      await sleep(delay);
    }
  }

  // jeżeli wszystkie próby nieudane — spróbuj zwrócić z cache (jeśli istnieje)
  if (cacheKey) {
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        console.warn('Returning stale cached data after retries failed');
        return parsed.data;
      }
    } catch (e) { /* ignore */ }
  }

  // Jeśli nie ma cache — rzuć ostatni błąd
  throw lastError;
}   
export default fetchWithRetry;