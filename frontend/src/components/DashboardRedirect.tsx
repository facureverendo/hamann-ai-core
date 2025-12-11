import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { settingsService } from '../services/settingsService'

/**
 * Componente que redirige desde "/" a la página apropiada
 * cuando solo hay un modo activo
 */
export default function DashboardRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const settings = await settingsService.getSettings()
        
        // Si solo hay un modo activo, redirigir a la página correspondiente
        if (settings.show_software_factory_mode && !settings.show_product_mode) {
          navigate('/workspaces', { replace: true })
        } else if (!settings.show_software_factory_mode && settings.show_product_mode) {
          navigate('/projects', { replace: true })
        } else {
          // Si ambos modos están activos, mostrar el dashboard
          navigate('/dashboard', { replace: true })
        }
      } catch (error) {
        console.error('Error checking settings:', error)
        // En caso de error, mostrar dashboard por defecto
        navigate('/dashboard', { replace: true })
      }
    }

    checkAndRedirect()
  }, [navigate])

  return null
}
