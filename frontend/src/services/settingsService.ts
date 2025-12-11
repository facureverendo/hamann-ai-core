import apiClient from './apiService'

export interface AppSettings {
  show_software_factory_mode: boolean
  show_product_mode: boolean
  default_mode: string
}

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const response = await apiClient.get('/api/settings/')
    return response.data
  },

  async updateSettings(settings: AppSettings): Promise<{
    status: string
    message: string
    settings: AppSettings
  }> {
    const response = await apiClient.put('/api/settings/', settings)
    return response.data
  },
}
