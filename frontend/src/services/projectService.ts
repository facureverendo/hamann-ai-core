import apiClient from './apiService'

export interface Project {
  id: string
  name: string
  status: string
  progress: number
  created_at: string
  updated_at: string
  description?: string
}

export interface ProjectDetail {
  id: string
  name: string
  status: string
  progress: number
  created_at: string
  updated_at: string
  description?: string
}

export interface BacklogItem {
  issue_type: string
  summary: string
  description: string
  priority: string
  story_points: number
}

export interface Risk {
  id: string
  title: string
  severity: string
  sector: string
  description: string
}

export interface Timeline {
  milestones: Array<{
    id: string
    name: string
    date: string
    status: string
  }>
  deliverables: Array<{
    id: string
    name: string
    due_date: string
    progress: number
  }>
  delay_zones: Array<{
    start: string
    end: string
    severity: string
  }>
}

export interface Meeting {
  id: string
  title: string
  date: string
  participants: number
  decisions: string[]
  action_items: Array<{
    task: string
    owner: string
    done: boolean
  }>
}

export const projectService = {
  async listProjects(): Promise<Project[]> {
    const response = await apiClient.get('/api/projects/')
    return response.data
  },

  async getProject(id: string): Promise<ProjectDetail> {
    const response = await apiClient.get(`/api/projects/${id}`)
    return response.data
  },


  async getBacklog(projectId: string): Promise<{ items: BacklogItem[] }> {
    const response = await apiClient.get(`/api/projects/${projectId}/backlog`)
    return response.data
  },

  async getRisks(projectId: string): Promise<{ risks: Risk[] }> {
    const response = await apiClient.get(`/api/projects/${projectId}/risks`)
    return response.data
  },

  async getTimeline(projectId: string): Promise<Timeline> {
    const response = await apiClient.get(`/api/projects/${projectId}/timeline`)
    return response.data
  },

  async getMeetings(projectId: string): Promise<{ meetings: Meeting[] }> {
    const response = await apiClient.get(`/api/projects/${projectId}/meetings`)
    return response.data
  },

  async createProject(name: string, files: File[]): Promise<{ id: string; name: string; status: string }> {
    const formData = new FormData()
    formData.append('name', name)
    files.forEach((file) => formData.append('files', file))
    
    const response = await apiClient.post('/api/projects/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getProjectStatus(projectId: string): Promise<any> {
    const response = await apiClient.get(`/api/projects/${projectId}/status`)
    return response.data
  },

  async executeAction(projectId: string, action: string, data?: any): Promise<any> {
    const response = await apiClient.post(`/api/projects/${projectId}/${action}`, data || {})
    return response.data
  },

  async getQuestions(projectId: string): Promise<{ questions: any[] }> {
    const response = await apiClient.get(`/api/projects/${projectId}/questions`)
    return response.data
  },

  async getContext(projectId: string): Promise<{ context: string; length: number; language_code: string }> {
    const response = await apiClient.get(`/api/projects/${projectId}/context`)
    return response.data
  },

  async getGaps(projectId: string): Promise<any> {
    // Try to get gaps from analysis file
    // For now, we'll need to add an endpoint or read from the analysis
    const response = await apiClient.get(`/api/projects/${projectId}/gaps`)
    return response.data
  },

  // Interactive Questions API
  async getInteractiveSession(projectId: string, maxQuestions: number = 15): Promise<any> {
    const response = await apiClient.get(`/api/projects/${projectId}/interactive-questions/session`, {
      params: { max_questions: maxQuestions }
    })
    return response.data
  },

  async saveAnswer(projectId: string, answerData: {
    section_key: string
    answer: string
    skipped: boolean
    question?: string
    section_title?: string
  }): Promise<void> {
    const response = await apiClient.post(`/api/projects/${projectId}/interactive-questions/answer`, answerData)
    return response.data
  },

  async regenerateQuestions(projectId: string, maxQuestions: number = 15): Promise<any> {
    const response = await apiClient.post(`/api/projects/${projectId}/interactive-questions/regenerate`, null, {
      params: { max_questions: maxQuestions }
    })
    return response.data
  },

  async finalizeSession(projectId: string): Promise<void> {
    const response = await apiClient.post(`/api/projects/${projectId}/interactive-questions/finalize`)
    return response.data
  },
}

