import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CompanyDetail from './pages/CompanyDetail'
import PartnerWorkspace from './pages/PartnerWorkspace'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/companies/:companyId" element={<CompanyDetail />} />
        <Route path="/companies/:companyId/partners/:partnerId" element={<PartnerWorkspace />} />
      </Routes>
    </div>
  )
}

export default App
