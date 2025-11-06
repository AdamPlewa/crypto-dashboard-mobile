// hooks/useTwoCoinsHistory.ts
import { useEffect, useRef, useState } from 'react'
import { fetchCoinMarketChart } from '../src/services/api' // ten sam serwis, co widok szczegółu

type Point = { x: Date; y: number }

function toSeries(prices: [number, number][]): Point[] {
	return prices.map(([ts, price]) => ({ x: new Date(ts), y: price }))
}

// pomocnik: pobiera z retry i timeoutem
async function loadChartWithRetry(
	id: string,
	vs: string,
	days: number,
	{ retries = 2, timeoutMs = 12000, signal }: { retries?: number; timeoutMs?: number; signal?: AbortSignal } = {}
) {
	let lastErr: any
	for (let attempt = 0; attempt <= retries; attempt++) {
		const ctl = new AbortController()
		const timeout = setTimeout(() => ctl.abort(), timeoutMs)
		try {
			const res = await fetchCoinMarketChart(id, vs, days, { signal: signal ?? ctl.signal })
			clearTimeout(timeout)
			if (!res?.prices?.length) throw new Error('No prices')
			return res.prices as [number, number][]
		} catch (e: any) {
			clearTimeout(timeout)
			lastErr = e
			// sieć/timeout → spróbuj ponownie
			if (attempt < retries && (e?.name === 'AbortError' || e instanceof TypeError)) {
				await new Promise(r => setTimeout(r, 600 * (attempt + 1)))
				continue
			}
			break
		}
	}
	if (lastErr instanceof TypeError || lastErr?.name === 'AbortError') {
		throw new Error('Network error (timeout/offline/SSL)')
	}
	throw lastErr
}

export function useTwoCoinsHistory(
	coinA?: string,
	coinB?: string,
	opts: { days?: number; vs?: string; asPctChange?: boolean; debounceMs?: number } = {}
) {
	const { days = 7, vs = 'usd', asPctChange = true, debounceMs = 200 } = opts
	const [seriesA, setA] = useState<Point[] | null>(null)
	const [seriesB, setB] = useState<Point[] | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const canFetch = !!coinA && !!coinB
	const debouncedKey = useDebounce(`${coinA}|${coinB}|${days}|${vs}|${asPctChange}`, debounceMs)
	const abortRef = useRef<AbortController | null>(null)

	useEffect(() => {
		if (!canFetch) return
		let alive = true
		setError(null)
		setA(null)
		setB(null)

		// cancel poprzedniego requestu (np. gdy szybko zmieniasz wybór)
		abortRef.current?.abort()
		const outerCtl = new AbortController()
		abortRef.current = outerCtl
		;(async () => {
			setLoading(true)
			try {
				// 1) pobierz A, 2) mała pauza, 3) pobierz B
				const pricesA = await loadChartWithRetry(coinA!, vs, days, { signal: outerCtl.signal })
				await new Promise(r => setTimeout(r, 120))
				const pricesB = await loadChartWithRetry(coinB!, vs, days, { signal: outerCtl.signal })

				if (!alive) return
				let A = toSeries(pricesA)
				let B = toSeries(pricesB)

				// przytnij do wspólnej długości (na wszelki wypadek)
				const len = Math.min(A.length, B.length)
				A = A.slice(-len)
				B = B.slice(-len)

				if (asPctChange) {
					const norm = (arr: Point[]) => {
						const base = arr[0]?.y ?? 1
						return arr.map(p => ({ x: p.x, y: ((p.y - base) / base) * 100 }))
					}
					A = norm(A)
					B = norm(B)
				}

				setA(A)
				setB(B)
			} catch (e: any) {
				if (!alive) return
				setError(e?.message || 'Network error')
			} finally {
				if (alive) setLoading(false)
			}
		})()

		return () => {
			alive = false
			outerCtl.abort()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedKey, canFetch])

	return { seriesA, seriesB, loading, error }
}

function useDebounce<T>(value: T, delay: number) {
	const [debounced, setDebounced] = useState(value)
	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay)
		return () => clearTimeout(id)
	}, [value, delay])
	return debounced
}
