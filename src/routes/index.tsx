import type { RouteObject } from 'react-router-dom'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import LanguageSelection from '@/pages/LanguageSelection'
import Chat from '@/pages/Chat'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/languages',
    element: <LanguageSelection />,
  },
  {
    path: '/languages/:langCode/chat',
    element: <Chat />,
  },
]

export default routes
