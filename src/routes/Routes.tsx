import { useRoutes } from 'react-router-dom'
import routes from '@/routes/index.tsx'

const AppRoutes = () => {
  const element = useRoutes(routes)
  return element
}

export default AppRoutes
