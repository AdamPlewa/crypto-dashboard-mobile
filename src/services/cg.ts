const BASE_FREE = 'https://api.coingecko.com/api/v3'
const BASE_PRO = 'https://pro-api.coingecko.com/api/v3' // jeśli kiedyś użyjesz PRO
const KEY = process.env.EXPO_PUBLIC_CG_KEY // ustaw w .env / app.config.ts

function buildUrl(pathAndQuery: string) {
	const base = KEY ? BASE_FREE : BASE_FREE // możesz przełączyć na BASE_PRO po zakupie Pro
	const url = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`
	// doklej klucz też jako query (CoinGecko to akceptuje)
	const sep = url.includes('?') ? '&' : '?'
	const withKey = KEY ? `${url}${sep}x_cg_demo_api_key=${encodeURIComponent(KEY)}` : url
	return base + withKey
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 10000) {
	const ctl = new AbortController()
	const id = setTimeout(() => ctl.abort(), timeoutMs)
	try {
		// ważne: dokładamy też nagłówek klucza
		const headers = KEY ? { ...(init.headers || {}), 'x-cg-demo-api-key': KEY } : init.headers || {}
		const res = await fetch(input, { ...init, headers, signal: ctl.signal })
		return res
	} finally {
		clearTimeout(id)
	}
}

export async function cgFetch(pathAndQuery: string, init: RequestInit = {}, retries = 2) {
	const url = buildUrl(pathAndQuery)
	let lastErr: any
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const res = await fetchWithTimeout(url, init, 12000)
			if (!res.ok) {
				const txt = await res.text().catch(() => '')
				throw new Error(`HTTP ${res.status} ${txt}`.trim())
			}
			return res.json()
		} catch (e: any) {
			lastErr = e
			// Sieciowe rzeczy: AbortError / TypeError → retry po małej pauzie
			if (attempt < retries && (e?.name === 'AbortError' || e instanceof TypeError)) {
				await new Promise(r => setTimeout(r, 600 * (attempt + 1)))
				continue
			}
			// Nie-sieciowe → przerwij od razu
			break
		}
	}
	// Lepszy komunikat dla RN
	if (lastErr instanceof TypeError || lastErr?.name === 'AbortError') {
		throw new Error('Network error (timeout/offline/SSL). Sprawdź połączenie lub blokady.')
	}
	throw lastErr
}
