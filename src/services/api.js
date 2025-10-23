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

export async function fetchCoinMarketChart(id, vs_currency = 'usd', days = 7) {
  const url = `${BASE}/coins/${id}/market_chart?vs_currency=${vs_currency}&days=${days}&interval=daily`;
  const data = await fetchWithRetry(url, { retries: 3, cacheKey: `chart_${id}_${vs_currency}_${days}` });
  // data.prices ...
  return data;
}
