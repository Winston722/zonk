import { useRef, useState } from 'react'
import { Button } from '@/components/common/Button'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Card, CardHeader, CardTitle } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useDraftStore } from '@/store/draftStore'
import { useRankings } from '@/hooks/useRankings'

const EXAMPLE_CSV = `full_name,position,age,years_exp,ppg,availability_score,risk_cv,dcf_value,replacement_value,value_above_replacement
Christian McCaffrey,RB,28,7,22.4,0.91,0.18,145.2,88.1,57.1
CeeDee Lamb,WR,25,4,19.8,0.88,0.21,138.7,82.4,56.3
Tyreek Hill,WR,30,9,18.6,0.85,0.24,131.0,80.2,50.8
Ja'Marr Chase,WR,24,3,18.1,0.90,0.19,128.5,79.6,48.9
Justin Jefferson,WR,25,4,17.9,0.87,0.20,126.3,78.8,47.5`

export function RankingsStep() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const { selectedDraft } = useDraftStore()
  const { loading, error, unmatchedCount, loadFromFile, loadFromText, loadFromUrl } = useRankings()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) loadFromFile(file)
  }

  function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pasteText.trim()) loadFromText(pasteText)
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Load Your Rankings</CardTitle>
        <span className="text-sm text-gray-500">
          {selectedDraft?.metadata?.name || selectedDraft?.draft_id}
        </span>
      </CardHeader>

      <p className="text-sm text-gray-600 mb-6">
        Upload a CSV with your custom player rankings. The app will match players to Sleeper IDs
        for real-time draft tracking. After loading, the Sleeper players database will be cached
        for 24 hours.
      </p>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="lg" />
          <p className="text-sm text-gray-600">
            Fetching Sleeper player database and matching rankings…
          </p>
        </div>
      ) : (
        <>
          {error && <ErrorAlert message={error} />}

          {unmatchedCount > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <strong>{unmatchedCount}</strong> player{unmatchedCount !== 1 ? 's' : ''} couldn't be matched to a Sleeper ID.
              Draft tracking will fall back to name matching for those players.
            </div>
          )}

          <div className="grid gap-4">
            {/* Default rankings */}
            <button
              onClick={() => loadFromUrl(`${import.meta.env.BASE_URL}draft_board.csv`)}
              className="flex items-center justify-between rounded-xl border-2 border-brand-200 bg-brand-50 px-5 py-4 text-left hover:border-brand-400 hover:bg-brand-100 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-brand-900">Use default rankings</p>
                <p className="text-xs text-brand-600 mt-0.5">Load the built-in draft board — no upload needed</p>
              </div>
              <svg className="h-5 w-5 shrink-0 text-brand-500 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400">or upload your own</span>
              </div>
            </div>

            {/* File upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Click to upload CSV</p>
                <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400">or paste CSV</span>
              </div>
            </div>

            {/* Paste mode */}
            {pasteMode ? (
              <form onSubmit={handlePasteSubmit} className="space-y-3">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={EXAMPLE_CSV}
                  rows={8}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={!pasteText.trim()}>Load rankings</Button>
                  <Button variant="ghost" type="button" onClick={() => setPasteMode(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <Button variant="secondary" className="w-full" onClick={() => setPasteMode(true)}>
                Paste CSV text
              </Button>
            )}
          </div>

          {/* Format reference */}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
              Expected CSV format
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">
              {EXAMPLE_CSV}
            </pre>
            <p className="mt-2 text-xs text-gray-500">
              Required: <code>full_name</code>. Expected columns: <code>position</code>, <code>age</code>, <code>years_exp</code>, <code>ppg</code>, <code>availability_score</code>, <code>risk_cv</code>, <code>dcf_value</code>, <code>replacement_value</code>, <code>value_above_replacement</code>.<br />
              Players are sorted by <strong>Value Above Replacement</strong> (highest = rank 1). Column headers are flexible — spaces, underscores, and capitalisation are ignored.
            </p>
          </details>
        </>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100">
        <Button variant="ghost" size="sm" onClick={() => useDraftStore.getState().setStep('draft')}>
          ← Back
        </Button>
      </div>
    </Card>
  )
}
