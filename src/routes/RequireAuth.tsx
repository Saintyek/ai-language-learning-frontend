import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '@/api/auth'

interface RequireAuthProps {
  children: ReactNode
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  if (!isAuthenticated()) {
    return <Navigate to={{ pathname: '/', search: '?auth=required' }} replace />
  }

  return children
}

export default RequireAuth
