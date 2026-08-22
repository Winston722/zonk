import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { OnTheClock } from '@/components/draft/OnTheClock'
import { useDraftStore } from '@/store/draftStore'
import { mkDraft, mkPick, mkUser } from '@/test/fixtures'

describe('OnTheClock', () => {
  beforeEach(() => {
    useDraftStore.getState().reset()
  })

  it('announces when the user is on the clock', () => {
    useDraftStore.setState({ user: mkUser(), selectedDraft: mkDraft(), rawPicks: [] })
    render(<OnTheClock />)
    // 0 picks made → pick 1 belongs to slot 1 (user_me)
    expect(screen.getByText(/You're on the clock — pick 1!/)).toBeInTheDocument()
  })

  it('counts down picks until the user is up', () => {
    useDraftStore.setState({
      user: mkUser(),
      selectedDraft: mkDraft(),
      rawPicks: [mkPick({ pick_no: 1 })], // pick 2 next; slot 1 next picks at 8
      managerNames: { user_b: 'Team B' },
    })
    render(<OnTheClock />)
    expect(screen.getByText(/6 picks until your turn/)).toBeInTheDocument()
    expect(screen.getByText('Team B')).toBeInTheDocument()
  })

  it('renders nothing for auctions', () => {
    useDraftStore.setState({ user: mkUser(), selectedDraft: mkDraft({ type: 'auction' }) })
    const { container } = render(<OnTheClock />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the draft is complete', () => {
    useDraftStore.setState({ user: mkUser(), selectedDraft: mkDraft({ status: 'complete' }) })
    const { container } = render(<OnTheClock />)
    expect(container).toBeEmptyDOMElement()
  })

  it('handles a missing draft_order without crashing (mock drafts)', () => {
    useDraftStore.setState({
      user: mkUser(),
      selectedDraft: mkDraft({ draft_order: null }),
      rawPicks: [],
    })
    render(<OnTheClock />)
    // Can't identify managers, but still shows whose slot is up
    expect(screen.getByText(/Slot 1/)).toBeInTheDocument()
  })

  it('handles zero-team settings without dividing by zero', () => {
    useDraftStore.setState({
      user: mkUser(),
      selectedDraft: mkDraft({
        settings: { ...mkDraft().settings, teams: 0, rounds: 0 },
      }),
    })
    const { container } = render(<OnTheClock />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders without a signed-in user (shared link viewers)', () => {
    useDraftStore.setState({ user: null, selectedDraft: mkDraft(), rawPicks: [] })
    render(<OnTheClock />)
    expect(screen.getByText(/On the clock:/)).toBeInTheDocument()
    expect(screen.queryByText(/until your turn/)).not.toBeInTheDocument()
  })
})
