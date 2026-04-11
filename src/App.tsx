import React, { useEffect } from 'react'
import { Toast } from '@douyinfe/semi-ui'
import { BrowserRouter as Router, matchPath, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import AppRoutes from './routes/Routes'
import Footer from './components/Footer'

const AUTH_REQUIRED_TOAST_KEY = 'authRequiredToast'

const AppLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const hideFooter = Boolean(matchPath('/languages/:langCode/chat', location.pathname))

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)

    if (searchParams.get('auth') !== 'required') {
      return
    }

    if (sessionStorage.getItem(AUTH_REQUIRED_TOAST_KEY) !== '1') {
      sessionStorage.setItem(AUTH_REQUIRED_TOAST_KEY, '1')
      Toast.warning({
        content: '请先登录',
        duration: 2,
      })
    }

    searchParams.delete('auth')
    const nextSearch = searchParams.toString()
    const timer = window.setTimeout(() => {
      sessionStorage.removeItem(AUTH_REQUIRED_TOAST_KEY)
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true }
      )
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [location.pathname, location.search, navigate])

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
