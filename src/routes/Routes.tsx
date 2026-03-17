import { useRoutes } from 'react-router-dom'
import routes from './index.tsx'

const AppRoutes = () => {
  const element = useRoutes(routes)
  return element
}

export default AppRoutes
