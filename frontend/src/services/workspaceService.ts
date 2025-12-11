import apiClient from './apiService'

export interface Workspace {
  id: string
  name: string
  description: string
  type: string
  status: string
  progress: number
  created_at: string
  updated_at: string
  features_count: number
}

export interface WorkspaceDetail {
  id: string
  name: string
  description: string
  type: string
  status: string
  progress: number
  created_at: string
  updated_at: string
  features: string[]
  analysis: WorkspaceAnalysis | null
}

export interface ModuleSuggestion {
  name: string
  rationale: string
  priority: string
  estimated_effort: string | null
}

export interface TechStackRecommendation {
  frontend: string[]
  backend: string[]
  database: string[]
  infrastructure: string[]
  rationale: { [key: string]: string }
}

export interface ResourceEstimation {
  team_size_input: number | null
  estimated_timeline: string | null
  deadline_input: string | null
  required_team_size: number | null
  required_team_composition: { [key: string]: any } | null
  breakdown_by_module: Array<{ [key: string]: any }>
  assumptions: string[]
  confidence_level: string | null
}

export interface WorkspaceAnalysis {
  workspace_id: string
  executive_summary: string
  project_scope: { [key: string]: any }
  business_objectives: string[]
  identified_features: Array<{ [key: string]: any }>
  suggested_modules: ModuleSuggestion[]
  tech_stack_recommendation: TechStackRecommendation | null
  architecture_overview: string
  resource_estimation: ResourceEstimation | null
  timeline_estimation: { [key: string]: any } | null
  technical_risks: string[]
  business_risks: string[]
}

export const workspaceService = {
  // CRUD básico
  async listWorkspaces(): Promise<Workspace[]> {
    const response = await apiClient.get('/api/workspaces/')
    return response.data
  },

  async createWorkspace(name: string, description: string, type: string, files: File[]): Promise<{
    id: string
    name: string
    description: string
    status: string
    files_uploaded: number
    files: string[]
    message: string
  }> {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('type', type)
    files.forEach((file) => formData.append('files', file))
    
    const response = await apiClient.post('/api/workspaces/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getWorkspace(workspaceId: string): Promise<WorkspaceDetail> {
    const response = await apiClient.get(`/api/workspaces/${workspaceId}`)
    return response.data
  },

  async deleteWorkspace(workspaceId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/api/workspaces/${workspaceId}`)
    return response.data
  },

  // Procesamiento con AI
  async analyzeWorkspace(workspaceId: string): Promise<{
    status: string
    message: string
    analysis: any
  }> {
    const response = await apiClient.post(`/api/workspaces/${workspaceId}/analyze`)
    return response.data
  },

  // Features del workspace
  async getWorkspaceFeatures(workspaceId: string): Promise<{
    workspace_id: string
    features: any[]
  }> {
    const response = await apiClient.get(`/api/workspaces/${workspaceId}/features`)
    return response.data
  },

  async createFeature(workspaceId: string, name: string, files: File[]): Promise<{
    id: string
    workspace_id: string
    name: string
    status: string
    files_uploaded: number
    files: string[]
    message: string
  }> {
    const formData = new FormData()
    formData.append('name', name)
    files.forEach((file) => formData.append('files', file))
    
    const response = await apiClient.post(`/api/workspaces/${workspaceId}/features`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Casos de uso avanzados (preparados para futuro)
  async suggestTechStack(workspaceId: string): Promise<TechStackRecommendation> {
    const response = await apiClient.post(`/api/workspaces/${workspaceId}/suggest-tech-stack`)
    return response.data
  },

  async estimateResources(workspaceId: string, params: {
    team_size?: number
    deadline?: string
  }): Promise<ResourceEstimation> {
    const response = await apiClient.post(`/api/workspaces/${workspaceId}/estimate-resources`, params)
    return response.data
  },
}
