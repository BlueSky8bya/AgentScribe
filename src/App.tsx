// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §9] Phase 1: mount New Work Wizard
import './App.css'
import { NewWorkWizard } from './ui/NewWorkWizard'

function App() {
  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem', textAlign: 'left' }}>
      <NewWorkWizard />
    </main>
  )
}

export default App
