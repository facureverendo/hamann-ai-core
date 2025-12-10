import apiClient from './apiService'

export interface PRDSection {
  id: string
  title: string
  content: string
  expanded: boolean
}

export interface PRDDetail {
  id: string
  title: string
  sections: PRDSection[]
  version: string
  updated_at: string
}

export interface PRDVersion {
  version: string
  date: string
  author: string
}

export const prdService = {
  async getPRD(projectId: string): Promise<PRDDetail> {
    const response = await apiClient.get(`/api/prd/${projectId}`)
    return response.data
  },

  async getVersions(projectId: string): Promise<{ versions: PRDVersion[] }> {
    const response = await apiClient.get(`/api/prd/${projectId}/versions`)
    return response.data
  },

  async compareVersions(
    projectId: string,
    v1: string,
    v2: string
  ): Promise<{ changes: Array<{ section: string; type: string; diff: string }> }> {
    const response = await apiClient.get(`/api/prd/${projectId}/compare`, {
      params: { v1, v2 },
    })
    return response.data
  },
}

