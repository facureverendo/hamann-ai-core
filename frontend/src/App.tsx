import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import ProjectsList from './pages/ProjectsList'
import ProjectOverview from './pages/ProjectOverview'
import CreateProject from './pages/CreateProject'
import PRDViewer from './pages/PRDViewer'
import MeetingSummary from './pages/MeetingSummary'
import AITimeline from './pages/AITimeline'
import RiskRadar from './pages/RiskRadar'
import AIAssistant from './pages/AIAssistant'
import Settings from './pages/Settings'
import WorkspaceList from './pages/WorkspaceList'
import WorkspaceDetail from './pages/WorkspaceDetail'
import CreateWorkspace from './pages/CreateWorkspace'
import CreateWorkspaceFeature from './pages/CreateWorkspaceFeature'
import BriefEditor from './pages/BriefEditor'

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-dark-primary overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              
              {/* Workspaces Routes */}
              <Route path="/workspaces" element={<WorkspaceList />} />
              <Route path="/workspaces/new" element={<CreateWorkspace />} />
              <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
              <Route path="/workspaces/:id/features/new" element={<CreateWorkspaceFeature />} />
              
              {/* Projects/Features Routes */}
              <Route path="/projects" element={<ProjectsList />} />
              <Route path="/projects/new" element={<CreateProject />} />
              <Route path="/projects/:id" element={<ProjectOverview />} />
              <Route path="/projects/:id/brief" element={<BriefEditor />} />
              
              {/* PRD and other feature routes */}
              <Route path="/prd/:id" element={<PRDViewer />} />
              <Route path="/meetings/:id" element={<MeetingSummary />} />
              <Route path="/timeline/:id" element={<AITimeline />} />
              <Route path="/risks/:id" element={<RiskRadar />} />
              
              {/* Global routes */}
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
