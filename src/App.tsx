// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 9] Phase 1 + Phase 2: Wizard -> Preflight Room
import { useState } from 'react'
import './App.css'
import { NewWorkWizard } from './ui/NewWorkWizard'
import { PreflightRoom } from './ui/PreflightRoom'
import type { WorkRecord } from './core/schemas/index.js'

function App() {
  const [work, setWork] = useState<WorkRecord | null>(null)
  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem', textAlign: 'left' }}>
      {work ? <PreflightRoom work={work} /> : <NewWorkWizard onComplete={setWork} />}
    </main>
  )
}

export default App
