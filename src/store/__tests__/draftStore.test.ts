import { beforeEach, describe, expect, it } from 'vitest'
import { useDraftStore } from '../draftStore'
import { mkDraft, mkRanked, mkUser } from '@/test/fixtures'

const KEY = 'zonk_draft_store'

async function rehydrateWith(raw: string) {
  localStorage.setItem(KEY, raw)
  await useDraftStore.persist.rehydrate()
}

describe('draftStore rehydration', () => {
  beforeEach(() => {
    useDraftStore.getState().reset()
    localStorage.clear()
  })

  it('survives corrupted (non-JSON) storage', async () => {
    await expect(rehydrateWith('this is not json {{{')).resolves.not.toThrow()
    const s = useDraftStore.getState()
    expect(s.step).toBe('username')
    expect(s.rankings).toEqual([])
  })

  it('survives a persisted primitive instead of an object', async () => {
    await rehydrateWith(JSON.stringify({ state: 'garbage-string', version: 1 }))
    const s = useDraftStore.getState()
    expect(s.step).toBe('username')
    expect(s.rankings).toEqual([])
  })

  it('sanitizes wrong-typed fields from older or corrupted versions', async () => {
    await rehydrateWith(
      JSON.stringify({
        state: {
          step: 'not-a-real-step',
          rankings: 'not-an-array',
          rawPicks: { nope: true },
          user: 'not-an-object',
          selectedDraft: { missing_draft_id: true },
        },
        version: 1,
      }),
    )
    const s = useDraftStore.getState()
    expect(s.step).toBe('username')
    expect(s.rankings).toEqual([])
    expect(s.rawPicks).toEqual([])
    expect(s.user).toBeNull()
    expect(s.selectedDraft).toBeNull()
    expect(s.managerNames).toEqual({})
  })

  it('does not restore into tracking without a draft and rankings', async () => {
    await rehydrateWith(
      JSON.stringify({ state: { step: 'tracking', rankings: [] }, version: 1 }),
    )
    expect(useDraftStore.getState().step).toBe('username')
  })

  it('drops back from the draft step (draft list is never persisted)', async () => {
    await rehydrateWith(
      JSON.stringify({ state: { step: 'draft', user: mkUser() }, version: 1 }),
    )
    expect(useDraftStore.getState().step).toBe('league')
  })

  it('restores a legitimate mid-draft session intact', async () => {
    await rehydrateWith(
      JSON.stringify({
        state: {
          step: 'tracking',
          user: mkUser(),
          selectedDraft: mkDraft(),
          rankings: [mkRanked({ name: 'Bijan Robinson' })],
          positionFilter: 'RB',
          showDrafted: true,
        },
        version: 1,
      }),
    )
    const s = useDraftStore.getState()
    expect(s.step).toBe('tracking')
    expect(s.selectedDraft?.draft_id).toBe('draft123')
    expect(s.rankings).toHaveLength(1)
    expect(s.positionFilter).toBe('RB')
    expect(s.showDrafted).toBe(true)
  })

  it('accepts state persisted by the previous app version (version 0)', async () => {
    await rehydrateWith(
      JSON.stringify({
        state: {
          step: 'tracking',
          user: mkUser(),
          selectedDraft: mkDraft(),
          rankings: [mkRanked({ name: 'Bijan Robinson' })],
        },
        version: 0,
      }),
    )
    const s = useDraftStore.getState()
    expect(s.step).toBe('tracking')
    expect(s.rankings).toHaveLength(1)
  })
})
