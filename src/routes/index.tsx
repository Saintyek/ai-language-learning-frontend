import type { RouteObject } from 'react-router-dom'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Chat from '@/pages/Chat'
import RequireAuth from '@/routes/RequireAuth'

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
    path: '/:langCode/chat',
    element: (
      <RequireAuth>
        <Chat />
      </RequireAuth>
    ),
  },
]

export default routes
