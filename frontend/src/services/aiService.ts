import apiClient from './apiService'

export interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

export interface ChatRequest {
  message: string
  project_id?: string
  context?: string
}

export interface ChatResponse {
  response: string
  suggestions?: string[]
}

export const aiService = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post('/api/ai/chat', request)
    return response.data
  },

  async analyzePRD(projectId: string): Promise<{ analysis: string; insights: string[] }> {
    const response = await apiClient.post(`/api/ai/analyze-prd?project_id=${projectId}`)
    return response.data
  },

  async compareTimelines(projectId: string): Promise<{ comparison: string }> {
    const response = await apiClient.post(`/api/ai/compare-timelines?project_id=${projectId}`)
    return response.data
  },

  async generateTests(projectId: string): Promise<{ tests: string[] }> {
    const response = await apiClient.post(`/api/ai/generate-tests?project_id=${projectId}`)
    return response.data
  },

  async suggestImprovements(projectId: string): Promise<{ suggestions: string[] }> {
    const response = await apiClient.post(`/api/ai/suggest-improvements?project_id=${projectId}`)
    return response.data
  },
}

