import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

const ZONK_STORAGE_KEYS = ['zonk_draft_store', 'zonk_sleeper_players_cache']

/**
 * Last-resort catch for render crashes. Because app state persists in
 * localStorage, a corrupted store would otherwise crash on every reload with
 * no way out — the reset button clears Zonk's storage and starts fresh.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Zonk crashed:', error, info.componentStack)
  }

  handleReset = () => {
    try {
      for (const key of ZONK_STORAGE_KEYS) localStorage.removeItem(key)
    } catch {
      // storage unavailable; reload anyway
    }
    window.location.href = window.location.pathname
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <span className="text-4xl">💥</span>
        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        <p className="max-w-md text-sm text-gray-600">
          Zonk hit an unexpected error. Reloading usually fixes it; if it keeps happening,
          reset the app to clear saved state and start over.
        </p>
        <pre className="max-w-lg overflow-x-auto rounded-lg bg-gray-100 p-3 text-left text-xs text-red-700">
          {this.state.error.message}
        </pre>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Reload
          </button>
          <button
            onClick={this.handleReset}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset app
          </button>
        </div>
      </div>
    )
  }
}
