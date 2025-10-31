import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'

type Coin = {
	id: string
	symbol: string
	name: string
	image: string
	current_price: number
	price_change_percentage_24h: number
}

type CoinsContextValue = {
	coins: Coin[]
	isLoading: boolean
	error: string | null
	refresh: () => void
}

const CoinsContext = createContext<CoinsContextValue | undefined>(undefined)

export const CoinsProvider = ({ children }: { children: ReactNode }) => {
	const [coins, setCoins] = useState<Coin[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchCoins = async () => {
		try {
			setIsLoading(true)
			setError(null)
			const url =
				'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h'
			const res = await fetch(url)
			if (!res.ok) throw new Error(`HTTP ${res.status}`)
			const data = await res.json()
			setCoins(data)
		} catch (e: any) {
			setError(e?.message ?? 'Unknown error')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchCoins()
	}, [])

	return (
		<CoinsContext.Provider value={{ coins, isLoading, error, refresh: fetchCoins }}>{children}</CoinsContext.Provider>
	)
}

export const useCoins = () => {
	const ctx = useContext(CoinsContext)
	if (!ctx) throw new Error('useCoins must be used inside CoinsProvider')
	return ctx
}
