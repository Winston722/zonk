import { Button } from '@/components/common/Button'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Card, CardHeader, CardTitle } from '@/components/common/Card'
import { useDraftStore } from '@/store/draftStore'
import { useLeagueSetup } from '@/hooks/useLeagueSetup'

export function LeagueStep() {
  const { leagues, user } = useDraftStore()
  const { loading, error, selectLeague } = useLeagueSetup()

  if (!user) return null

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Select a League</CardTitle>
        <span className="text-sm text-gray-500">{user.display_name || user.username}</span>
      </CardHeader>

      {error && <ErrorAlert message={error} />}

      {leagues.length === 0 ? (
        <p className="text-sm text-gray-500">No leagues found for the current season.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {leagues.map((league) => (
            <li key={league.league_id}>
              <button
                className="flex w-full items-center justify-between py-3 text-left hover:bg-gray-50 transition-colors px-2 rounded-lg"
                onClick={() => selectLeague(league.league_id)}
                disabled={loading}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{league.name}</p>
                  <p className="text-xs text-gray-500">
                    {league.total_rosters} teams · {league.season} · {league.status}
                  </p>
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Button variant="ghost" size="sm" onClick={() => useDraftStore.getState().setStep('username')}>
          ← Back
        </Button>
      </div>
    </Card>
  )
}
