import { describe, expect, it } from 'vitest'
import { normaliseName, parseCsvRankings } from '../csvParser'

describe('parseCsvRankings', () => {
  it('parses rows and sorts by value above replacement descending', async () => {
    const csv = [
      'full_name,position,value_above_replacement',
      'Low Guy,RB,10',
      'High Guy,WR,50',
      'Mid Guy,QB,30',
    ].join('\n')

    const players = await parseCsvRankings(csv)
    expect(players.map((p) => p.name)).toEqual(['High Guy', 'Mid Guy', 'Low Guy'])
    expect(players.map((p) => p.rank)).toEqual([1, 2, 3])
  })

  it('preserves row order when no VAR column exists', async () => {
    const csv = ['name,position', 'First,RB', 'Second,WR'].join('\n')
    const players = await parseCsvRankings(csv)
    expect(players.map((p) => p.name)).toEqual(['First', 'Second'])
  })

  it('accepts column aliases regardless of case and punctuation', async () => {
    const csv = ['Player Name,POS,VORP,Years of Experience', 'Josh Allen,qb,42.5,7'].join('\n')
    const [p] = await parseCsvRankings(csv)
    expect(p.name).toBe('Josh Allen')
    expect(p.position).toBe('QB')
    expect(p.var).toBe(42.5)
    expect(p.yearsExp).toBe(7)
  })

  it('strips a BOM from the first header', async () => {
    const csv = '﻿full_name,position\nBijan Robinson,RB'
    const [p] = await parseCsvRankings(csv)
    expect(p.name).toBe('Bijan Robinson')
  })

  it('skips rows without a name', async () => {
    const csv = ['full_name,position', 'Real Player,RB', ',WR'].join('\n')
    const players = await parseCsvRankings(csv)
    expect(players).toHaveLength(1)
  })

  it('throws a helpful error when no players parse', async () => {
    await expect(parseCsvRankings('<html><body>oops</body></html>')).rejects.toThrow(
      /No players found/,
    )
  })
})

describe('normaliseName', () => {
  it('lower-cases and strips punctuation', () => {
    expect(normaliseName("Ja'Marr Chase")).toBe('jamarr chase')
  })

  it('strips suffixes', () => {
    expect(normaliseName('Marvin Harrison Jr.')).toBe('marvin harrison')
    expect(normaliseName('Kenneth Walker III')).toBe('kenneth walker')
  })

  it('collapses whitespace', () => {
    expect(normaliseName('  A.J.   Brown ')).toBe('aj brown')
  })
})
