import type { RouteObject } from 'react-router-dom'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

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
]

export default routes
