import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Navbar from './components/Navbar'
import AppRoutes from './routes/Routes'
import Footer from './components/Footer'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />
        <AppRoutes />
        <Footer />
      </div>
    </Router>
  )
}

export default App
