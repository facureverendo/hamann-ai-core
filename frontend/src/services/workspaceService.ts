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

export interface DocumentVersion {
  filename: string
  uploaded_at: string
  version: number
  size: number
  is_initial: boolean
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
  document_history: DocumentVersion[] | null
  analysis_version: number | null
  last_analysis_at: string | null
  documents_processed: boolean | null
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

export interface FeatureSuggestion {
  id: string
  name: string
  description: string
  rationale: string
  priority: string
  source: string
  status: string
  created_at: string
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

  async reAnalyzeWorkspace(
    workspaceId: string,
    mergeWithExisting: boolean = true
  ): Promise<{
    status: string
    message: string
    analysis: any
    merged: boolean
    analysis_version: number
  }> {
    const response = await apiClient.post(
      `/api/workspaces/${workspaceId}/analyze?merge_with_existing=${mergeWithExisting}`
    )
    return response.data
  },

  // Añadir documentos
  async addDocuments(
    workspaceId: string,
    files: File[],
    notes?: string
  ): Promise<{
    status: string
    files_added: string[]
    total_documents: number
    requires_reanalysis: boolean
    message: string
  }> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    if (notes) {
      formData.append('notes', notes)
    }
    
    const response = await apiClient.post(
      `/api/workspaces/${workspaceId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  // Features del workspace
  async getWorkspaceFeatures(workspaceId: string): Promise<{
    workspace_id: string
    features: Array<{
      id: string
      name: string
      status: string
      is_idea: boolean
      created_at: string
      updated_at: string
      prd_built: boolean
      workspace_id: string
    }>
    grouped: {
      ideas: any[]
      backlog: any[]
      in_progress: any[]
      completed: any[]
      discarded: any[]
    }
    suggestions: FeatureSuggestion[]
  }> {
    const response = await apiClient.get(`/api/workspaces/${workspaceId}/features`)
    return response.data
  },

  async createFeature(
    workspaceId: string,
    name: string,
    status: string = 'in_progress',
    description?: string,
    files?: File[]
  ): Promise<{
    id: string
    workspace_id: string
    name: string
    status: string
    is_idea: boolean
    files_uploaded: number
    files: string[]
    message: string
  }> {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('status', status)
    if (description) {
      formData.append('description', description)
    }
    if (files && files.length > 0) {
      files.forEach((file) => formData.append('files', file))
    }
    
    const response = await apiClient.post(`/api/workspaces/${workspaceId}/features`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Sugerencias de features
  async getFeatureSuggestions(workspaceId: string): Promise<{
    suggestions: FeatureSuggestion[]
    generated_at: string
  }> {
    const response = await apiClient.get(`/api/workspaces/${workspaceId}/feature-suggestions`)
    return response.data
  },

  async updateSuggestionStatus(
    workspaceId: string,
    suggestionId: string,
    status: string
  ): Promise<{
    status: string
    suggestion_id: string
    new_status: string
  }> {
    const formData = new FormData()
    formData.append('status', status)
    
    const response = await apiClient.post(
      `/api/workspaces/${workspaceId}/feature-suggestions/${suggestionId}/status`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
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
