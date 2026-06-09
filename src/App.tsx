// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5] Phase 3: Wizard -> ExpandReview -> Preflight Room
import { useState } from 'react'
import './App.css'
import { NewWorkWizard } from './ui/NewWorkWizard'
import { ExpandReview } from './ui/ExpandReview'
import { PreflightRoom } from './ui/PreflightRoom'
import { EpisodeWriter } from './ui/EpisodeWriter'
import type { WorkRecord } from './core/schemas/index.js'
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md section 9B.2] carry AI cost to review
import type { CostLedgerEntry } from './core/expand/remoteTypes.js'

type View = 'wizard' | 'review' | 'preflight' | 'write'

function App() {
  const [view, setView] = useState<View>('wizard')
  const [work, setWork] = useState<WorkRecord | null>(null)
  const [cost, setCost] = useState<CostLedgerEntry | null>(null)

  return (
    <main style={{ maxWidth: 760, margin: '2rem auto', padding: '0 1rem', textAlign: 'left' }}>
      {view === 'wizard' && (
        <NewWorkWizard onComplete={(w, c) => { setWork(w); setCost(c); setView('review') }} />
      )}
      {view === 'review' && work && (
        <ExpandReview work={work} cost={cost} onConfirm={(w) => { setWork(w); setView('preflight') }} />
      )}
      {view === 'preflight' && work && (
        <>
          <PreflightRoom work={work} />
          {/* [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 12] go to episode writer */}
          <button onClick={() => setView('write')}>회차 본문 생성하기 →</button>
        </>
      )}
      {view === 'write' && work && <EpisodeWriter work={work} />}
    </main>
  )
}

export default App
