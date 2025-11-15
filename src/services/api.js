// src/services/api.js
import { fetchWithRetry } from './fetchWithRetry';

const BASE = 'https://api.coingecko.com/api/v3';

export async function fetchMarketData(vs_currency = 'usd', per_page = 50) {
  const url = `${BASE}/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=${per_page}&page=1&sparkline=false`;
  const data = await fetchWithRetry(url, { retries: 3, cacheKey: `market_${vs_currency}_${per_page}` });
  return data;
}

export async function fetchCoinDetails(id) {
  if (!id) throw new Error('fetchCoinDetails: id is required');
  const url = `${BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
  const data = await fetchWithRetry(url, { retries: 3, cacheKey: `coin_${id}` });
  return data;
}

/**
 * Pobiera wykres rynku z CoinGecko.
 * Dla krótkich zakresów (1,3,7 dni) nie dodajemy `interval=daily` aby dostać gęstsze dane.
 * Dla dłuższych zakresów (>=30 dni) dodajemy `interval=daily` żeby otrzymać codzienne punkty.
 */
export async function fetchCoinMarketChart(id, vs_currency = 'usd', days = 7) {
  if (!id) throw new Error('fetchCoinMarketChart: id is required');

  // zdecydujemy, kiedy dołączać interval=daily — tylko dla dłuższych zakresów
  // (CoinGecko automatycznie dostarczy wyższą rozdzielczość dla krótszych zakresów jeśli nie wymuszamy 'daily')
  const intervalParam = Number(days) >= 30 ? '&interval=daily' : '';

  const url = `${BASE}/coins/${id}/market_chart?vs_currency=${vs_currency}&days=${days}${intervalParam}`;
  const data = await fetchWithRetry(url, { retries: 3, cacheKey: `chart_${id}_${vs_currency}_${days}${intervalParam}` });
  return data;
}
