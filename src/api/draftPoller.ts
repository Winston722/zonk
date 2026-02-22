/**
 * Polls the Sleeper picks endpoint on a fixed interval and fires a callback
 * whenever the pick count changes (i.e. a new pick was made).
 */

import type { SleeperPick } from '@/types/sleeper'
import { sleeperApi } from './sleeper'

export interface DraftPollerOptions {
  draftId: string
  intervalMs?: number
  onPicksUpdate: (picks: SleeperPick[]) => void
  onError?: (err: Error) => void
}

export class DraftPoller {
  private draftId: string
  private intervalMs: number
  private onPicksUpdate: (picks: SleeperPick[]) => void
  private onError: (err: Error) => void
  private timerId: ReturnType<typeof setInterval> | null = null
  private lastPickCount = -1

  constructor({
    draftId,
    intervalMs = 5000,
    onPicksUpdate,
    onError = console.error,
  }: DraftPollerOptions) {
    this.draftId = draftId
    this.intervalMs = intervalMs
    this.onPicksUpdate = onPicksUpdate
    this.onError = onError
  }

  start(): void {
    if (this.timerId !== null) return
    // Fetch immediately then on interval
    void this.poll()
    this.timerId = setInterval(() => void this.poll(), this.intervalMs)
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  /** Force a fetch outside of the schedule */
  async refresh(): Promise<void> {
    return this.poll()
  }

  private async poll(): Promise<void> {
    try {
      const picks = await sleeperApi.getPicks(this.draftId)
      if (picks.length !== this.lastPickCount) {
        this.lastPickCount = picks.length
        this.onPicksUpdate(picks)
      }
    } catch (err) {
      this.onError(err instanceof Error ? err : new Error(String(err)))
    }
  }
}
