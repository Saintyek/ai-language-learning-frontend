import React from 'react'
import { BrowserRouter as Router, matchPath, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import AppRoutes from './routes/Routes'
import Footer from './components/Footer'

const AppLayout = () => {
  const location = useLocation()
  const hideFooter = Boolean(matchPath('/languages/:langCode/chat', location.pathname))

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className={hideFooter ? 'app-layout-with-fixed-navbar pt-20' : ''}>
        <AppRoutes />
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

export default App
