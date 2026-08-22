import { render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

function Bomb(): never {
  throw new Error('kaboom')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs caught render errors loudly; keep test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children normally', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('all good')).toBeInTheDocument()
  })

  it('catches a render crash and shows the recovery screen', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('kaboom')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset app' })).toBeInTheDocument()
  })

  it('reset clears Zonk storage', () => {
    localStorage.setItem('zonk_draft_store', '{"corrupt":')
    localStorage.setItem('zonk_sleeper_players_cache', '{}')
    localStorage.setItem('unrelated_key', 'keep me')

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reset app' }))

    expect(localStorage.getItem('zonk_draft_store')).toBeNull()
    expect(localStorage.getItem('zonk_sleeper_players_cache')).toBeNull()
    expect(localStorage.getItem('unrelated_key')).toBe('keep me')
  })
})
