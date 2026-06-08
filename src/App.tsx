// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5] Phase 3: Wizard -> ExpandReview -> Preflight Room
import { useState } from 'react'
import './App.css'
import { NewWorkWizard } from './ui/NewWorkWizard'
import { ExpandReview } from './ui/ExpandReview'
import { PreflightRoom } from './ui/PreflightRoom'
import type { WorkRecord } from './core/schemas/index.js'

type View = 'wizard' | 'review' | 'preflight'

function App() {
  const [view, setView] = useState<View>('wizard')
  const [work, setWork] = useState<WorkRecord | null>(null)

  return (
    <main style={{ maxWidth: 760, margin: '2rem auto', padding: '0 1rem', textAlign: 'left' }}>
      {view === 'wizard' && (
        <NewWorkWizard onComplete={(w) => { setWork(w); setView('review') }} />
      )}
      {view === 'review' && work && (
        <ExpandReview work={work} onConfirm={(w) => { setWork(w); setView('preflight') }} />
      )}
      {view === 'preflight' && work && <PreflightRoom work={work} />}
    </main>
  )
}

export default App
