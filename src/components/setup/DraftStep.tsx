import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Card, CardHeader, CardTitle } from '@/components/common/Card'
import { useDraftStore } from '@/store/draftStore'
import { useLeagueSetup } from '@/hooks/useLeagueSetup'

const STATUS_LABELS: Record<string, string> = {
  pre_draft: 'Not started',
  drafting: 'Live',
  paused: 'Paused',
  complete: 'Complete',
}

export function DraftStep() {
  const { drafts, selectedLeague } = useDraftStore()
  const { loading, error, selectDraft, loadDraftById } = useLeagueSetup()
  const [manualId, setManualId] = useState('')
  const [showManual, setShowManual] = useState(false)

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manualId.trim()) loadDraftById(manualId.trim())
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Select a Draft</CardTitle>
        <span className="text-sm text-gray-500">{selectedLeague?.name}</span>
      </CardHeader>

      {error && <ErrorAlert message={error} />}

      {drafts.length === 0 ? (
        <p className="text-sm text-gray-500">No drafts found for this league.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {drafts.map((draft) => {
            const statusLabel = STATUS_LABELS[draft.status] ?? draft.status
            const isLive = draft.status === 'drafting'
            return (
              <li key={draft.draft_id}>
                <button
                  className="flex w-full items-center justify-between py-3 px-2 text-left hover:bg-gray-50 transition-colors rounded-lg"
                  onClick={() => selectDraft(draft.draft_id)}
                  disabled={loading}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {draft.metadata?.name || `${draft.season} ${draft.type} Draft`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {draft.settings.teams} teams · {draft.settings.rounds} rounds ·{' '}
                      <span className={isLive ? 'text-green-600 font-semibold' : ''}>
                        {statusLabel}
                      </span>
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Manual draft ID fallback */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        {showManual ? (
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <p className="text-xs text-gray-500">
              Find your draft ID in the Sleeper URL:{' '}
              <code className="rounded bg-gray-100 px-1">sleeper.com/draft/nfl/<strong>123456789</strong></code>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Draft ID (e.g. 1234567890)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                autoFocus
              />
              <Button type="submit" loading={loading} disabled={!manualId.trim()}>
                Load
              </Button>
            </div>
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowManual(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => useDraftStore.getState().setStep('league')}>
              ← Back
            </Button>
            <button
              onClick={() => setShowManual(true)}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Draft not listed? Enter ID manually
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
