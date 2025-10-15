import axios from 'axios';


const BASE = 'https://api.coingecko.com/api/v3';


export async function fetchMarketData(vs_currency = 'usd', per_page = 50) {
const url = `${BASE}/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=${per_page}&page=1&sparkline=false`;
const res = await axios.get(url);
return res.data;
}


export async function fetchCoinDetails(id) {
const url = `${BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
const res = await axios.get(url);
return res.data;
}