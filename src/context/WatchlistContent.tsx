import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

type WatchlistContextValue = {
	ids: Set<string>
	isOnWatchlist: (id: string) => boolean
	toggle: (id: string) => void
	add: (id: string) => void
	remove: (id: string) => void
	clear: () => void
}

const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined)
const STORAGE_KEY = 'watchlist_ids_v1'

export const WatchlistProvider = ({ children }: { children: ReactNode }) => {
	const [idsState, setIdsState] = useState<Set<string>>(new Set())

	useEffect(() => {
		;(async () => {
			try {
				const raw = await AsyncStorage.getItem(STORAGE_KEY)
				if (raw) setIdsState(new Set(JSON.parse(raw)))
			} catch (e) {
				console.warn('Watchlist load error', e)
			}
		})()
	}, [])

	const persist = async (s: Set<string>) => {
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...s]))
		} catch (e) {
			console.warn('Watchlist save error', e)
		}
	}

	const add = (id: string) =>
		setIdsState(p => {
			const n = new Set(p)
			n.add(id)
			persist(n)
			return n
		})
	const remove = (id: string) =>
		setIdsState(p => {
			const n = new Set(p)
			n.delete(id)
			persist(n)
			return n
		})
	const toggle = (id: string) =>
		setIdsState(p => {
			const n = new Set(p)
			n.has(id) ? n.delete(id) : n.add(id)
			persist(n)
			return n
		})
	const clear = () => {
		setIdsState(new Set())
		AsyncStorage.removeItem(STORAGE_KEY).catch(() => {})
	}

	const value = useMemo(
		() => ({
			ids: idsState,
			isOnWatchlist: (id: string) => idsState.has(id),
			toggle,
			add,
			remove,
			clear,
		}),
		[idsState]
	)

	return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

export const useWatchlist = () => {
	const ctx = useContext(WatchlistContext)
	if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider')
	return ctx
}
