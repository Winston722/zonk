import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Card, CardHeader, CardTitle } from '@/components/common/Card'
import { useLeagueSetup } from '@/hooks/useLeagueSetup'

export function UsernameStep() {
  const [username, setUsername] = useState('')
  const { loading, error, lookupUser } = useLeagueSetup()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (username.trim()) lookupUser(username.trim())
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Connect to Sleeper</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Sleeper username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourSleeperUsername"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoComplete="off"
            autoFocus
          />
        </div>
        {error && <ErrorAlert message={error} />}
        <Button type="submit" loading={loading} disabled={!username.trim()} className="w-full">
          Find my leagues
        </Button>
      </form>
    </Card>
  )
}
