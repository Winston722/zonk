import { useDraftStore } from '@/store/draftStore'
import { UsernameStep } from '@/components/setup/UsernameStep'
import { LeagueStep } from '@/components/setup/LeagueStep'
import { DraftStep } from '@/components/setup/DraftStep'
import { RankingsStep } from '@/components/setup/RankingsStep'
import { TrackingView } from '@/components/draft/TrackingView'

function StepIndicator() {
  const { step } = useDraftStore()
  const steps = [
    { id: 'username', label: 'Connect' },
    { id: 'league', label: 'League' },
    { id: 'draft', label: 'Draft' },
    { id: 'rankings', label: 'Rankings' },
    { id: 'tracking', label: 'Track' },
  ]
  const currentIdx = steps.findIndex((s) => s.id === step)

  if (step === 'tracking') return null

  return (
    <nav className="flex items-center gap-1" aria-label="Setup progress">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
              idx === currentIdx
                ? 'bg-brand-600 text-white'
                : idx < currentIdx
                ? 'bg-brand-100 text-brand-700'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {s.label}
          </span>
          {idx < steps.length - 1 && (
            <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      ))}
    </nav>
  )
}

export default function App() {
  const { step } = useDraftStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight text-gray-900">
              <span className="text-brand-600">Z</span>onk
            </span>
            <span className="text-xs text-gray-400 hidden sm:block">Sleeper Draft Tracker</span>
          </div>
          <StepIndicator />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {step === 'username' && <UsernameStep />}
        {step === 'league' && <LeagueStep />}
        {step === 'draft' && <DraftStep />}
        {step === 'rankings' && <RankingsStep />}
        {step === 'tracking' && <TrackingView />}
      </main>
    </div>
  )
}
