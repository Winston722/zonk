import { useEffect, useMemo, useRef, useState } from 'react'
import { useDraftStore } from '@/store/draftStore'
import { nextPickForSlot, roundForPick, slotForPick, type DraftOrderInfo } from '@/utils/draftMath'

const BASE_TITLE = 'Zonk — Sleeper Draft Tracker'

function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Banner showing whose pick it is and how far away the user's next pick is.
 * Fires a browser notification (if permitted) when the user goes on the clock.
 */
export function OnTheClock() {
  const { selectedDraft, user, rawPicks, managerNames } = useDraftStore()
  const [notifPermission, setNotifPermission] = useState(
    supportsNotifications() ? Notification.permission : 'denied',
  )
  const wasOnClockRef = useRef(false)

  const info: DraftOrderInfo | null = selectedDraft
    ? {
        teams: selectedDraft.settings.teams,
        rounds: selectedDraft.settings.rounds,
        type: selectedDraft.type,
        reversalRound: selectedDraft.settings.reversal_round,
      }
    : null

  const totalPicks = info ? info.teams * info.rounds : 0
  const currentPick = rawPicks.length + 1
  const draftOver =
    !selectedDraft || selectedDraft.status === 'complete' || currentPick > totalPicks

  const slotToUser = useMemo(() => {
    const map = new Map<number, string>()
    for (const [userId, slot] of Object.entries(selectedDraft?.draft_order ?? {})) {
      map.set(slot, userId)
    }
    return map
  }, [selectedDraft?.draft_order])

  const currentSlot = info && !draftOver ? slotForPick(currentPick, info) : null
  const currentManagerId = currentSlot !== null ? slotToUser.get(currentSlot) : undefined
  const currentManagerName = currentManagerId
    ? managerNames[currentManagerId] ?? currentManagerId
    : currentSlot !== null
    ? `Slot ${currentSlot}`
    : null

  const mySlot =
    user && selectedDraft?.draft_order ? selectedDraft.draft_order[user.user_id] : undefined
  const myNextPick =
    info && !draftOver && mySlot !== undefined
      ? nextPickForSlot(currentPick, mySlot, info)
      : null
  const picksAway = myNextPick !== null ? myNextPick - currentPick : null
  const onClock = picksAway === 0

  // Notify + flash the tab title when the user goes on the clock
  useEffect(() => {
    if (onClock && !wasOnClockRef.current) {
      document.title = "🚨 You're on the clock! — Zonk"
      if (supportsNotifications() && Notification.permission === 'granted') {
        try {
          new Notification("You're on the clock!", {
            body: `Pick ${currentPick} is yours. Go get your guy.`,
          })
        } catch {
          // some browsers (mobile) throw on direct construction; ignore
        }
      }
    } else if (!onClock) {
      document.title =
        picksAway !== null && picksAway <= 5 && !draftOver
          ? `(${picksAway} away) ${BASE_TITLE}`
          : BASE_TITLE
    }
    wasOnClockRef.current = onClock
    return () => {
      document.title = BASE_TITLE
    }
  }, [onClock, picksAway, currentPick, draftOver])

  if (!selectedDraft || draftOver || selectedDraft.type === 'auction') return null

  function requestNotifications() {
    if (!supportsNotifications()) return
    void Notification.requestPermission().then(setNotifPermission)
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-3 shadow-sm ${
        onClock
          ? 'border-red-300 bg-red-50'
          : picksAway !== null && picksAway <= 2
          ? 'border-amber-300 bg-amber-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3 text-sm">
        {onClock ? (
          <span className="font-bold text-red-700">🚨 You're on the clock — pick {currentPick}!</span>
        ) : (
          <>
            <span className="text-gray-600">
              On the clock:{' '}
              <strong className="text-gray-900">{currentManagerName ?? '—'}</strong>{' '}
              <span className="text-gray-400">
                (pick {currentPick} · round {info ? roundForPick(currentPick, info) : '—'})
              </span>
            </span>
            {picksAway !== null && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  picksAway <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {picksAway === 1 ? 'You pick next!' : `${picksAway} picks until your turn`}
              </span>
            )}
          </>
        )}
      </div>

      {supportsNotifications() && notifPermission === 'default' && (
        <button
          onClick={requestNotifications}
          className="text-xs text-brand-600 underline hover:text-brand-800"
        >
          🔔 Notify me when I'm on the clock
        </button>
      )}
    </div>
  )
}
