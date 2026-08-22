import { renderHook, act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRankings } from '../useRankings'
import { useDraftStore } from '@/store/draftStore'

vi.mock('@/api/sleeper', () => ({
  sleeperApi: { getAllPlayers: vi.fn() },
}))

import { sleeperApi } from '@/api/sleeper'

const CSV = 'full_name,position,vorp\nBijan Robinson,RB,45\nMystery Man,WR,30'

const PLAYERS = {
  '1003': {
    player_id: '1003',
    first_name: 'Bijan',
    last_name: 'Robinson',
    full_name: 'Bijan Robinson',
    position: 'RB',
    team: 'ATL',
    status: null,
    age: 24,
    years_exp: 2,
    injury_status: null,
  },
}

describe('useRankings.loadFromText (first-use flow)', () => {
  beforeEach(() => {
    useDraftStore.getState().reset()
    localStorage.clear()
    vi.mocked(sleeperApi.getAllPlayers).mockReset().mockResolvedValue(PLAYERS)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses, matches, counts unmatched, and advances to tracking', async () => {
    const { result } = renderHook(() => useRankings())
    await act(() => result.current.loadFromText(CSV))

    const store = useDraftStore.getState()
    expect(store.step).toBe('tracking')
    expect(store.rankings).toHaveLength(2)
    expect(store.rankings[0].sleeperId).toBe('1003')
    await waitFor(() => expect(result.current.unmatchedCount).toBe(1))
  })

  it('still works when localStorage is full (cache write fails)', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })

    const { result } = renderHook(() => useRankings())
    await act(() => result.current.loadFromText(CSV))

    expect(useDraftStore.getState().step).toBe('tracking')
    expect(useDraftStore.getState().rankings).toHaveLength(2)
    setItem.mockRestore()
  })

  it('uses the cached player DB without refetching', async () => {
    localStorage.setItem(
      'zonk_sleeper_players_cache',
      JSON.stringify({ timestamp: Date.now(), data: PLAYERS }),
    )
    const { result } = renderHook(() => useRankings())
    await act(() => result.current.loadFromText(CSV))

    expect(sleeperApi.getAllPlayers).not.toHaveBeenCalled()
    expect(useDraftStore.getState().rankings[0].sleeperId).toBe('1003')
  })

  it('ignores a corrupted player cache and refetches', async () => {
    localStorage.setItem('zonk_sleeper_players_cache', '{corrupt json!!')
    const { result } = renderHook(() => useRankings())
    await act(() => result.current.loadFromText(CSV))

    expect(sleeperApi.getAllPlayers).toHaveBeenCalledTimes(1)
    expect(useDraftStore.getState().step).toBe('tracking')
  })

  it('surfaces an API failure as an error message, not a crash', async () => {
    vi.mocked(sleeperApi.getAllPlayers).mockRejectedValue(new Error('Sleeper API error 503'))
    const { result } = renderHook(() => useRankings())
    await act(() => result.current.loadFromText(CSV))

    await waitFor(() => expect(result.current.error).toMatch(/503/))
    expect(useDraftStore.getState().step).toBe('username') // stays put
  })

  it('surfaces a bad CSV as an error message', async () => {
    const { result } = renderHook(() => useRankings())
    await act(() => result.current.loadFromText('total nonsense'))

    await waitFor(() => expect(result.current.error).toMatch(/No players found/))
  })
})
