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

export interface Deliverable {
  id: string
  name: string
  description?: string
  due_date: string
  progress: number
  status: string
  created_at: string
  updated_at: string
  source: string
}

export interface TeamMember {
  id: string
  name: string
  role?: string
  assigned_tasks_count: number
  total_story_points: number
  workload_percentage: number
  status: string
  created_at: string
  updated_at: string
}

export interface PRDDecision {
  id: string
  description: string
  section_affected?: string
  timestamp: string
  change_type: string
  details?: string
}

export interface WeeklySummary {
  id: string
  week_start: string
  week_end: string
  completion_percentage: number
  summary: string
  highlights: string[]
  blockers: string[]
  next_steps: string[]
  created_at: string
  updated_at: string
  is_manual_edit: boolean
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

  // Deliverables API
  async getDeliverables(projectId: string): Promise<{ deliverables: Deliverable[] }> {
    const response = await apiClient.get(`/api/projects/${projectId}/deliverables`)
    return response.data
  },

  async createDeliverable(projectId: string, data: {
    name: string
    description?: string
    due_date: string
    progress?: number
    status?: string
  }): Promise<Deliverable> {
    const response = await apiClient.post(`/api/projects/${projectId}/deliverables`, data)
    return response.data
  },

  async updateDeliverable(projectId: string, deliverableId: string, data: Partial<Deliverable>): Promise<void> {
    const response = await apiClient.put(`/api/projects/${projectId}/deliverables/${deliverableId}`, data)
    return response.data
  },

  async deleteDeliverable(projectId: string, deliverableId: string): Promise<void> {
    const response = await apiClient.delete(`/api/projects/${projectId}/deliverables/${deliverableId}`)
    return response.data
  },

  // Team Members API
  async getTeamMembers(projectId: string): Promise<{ team_members: TeamMember[] }> {
    const response = await apiClient.get(`/api/projects/${projectId}/team-members`)
    return response.data
  },

  async createTeamMember(projectId: string, data: { name: string; role?: string }): Promise<TeamMember> {
    const response = await apiClient.post(`/api/projects/${projectId}/team-members`, data)
    return response.data
  },

  async updateTeamMember(projectId: string, memberId: string, data: Partial<TeamMember>): Promise<void> {
    const response = await apiClient.put(`/api/projects/${projectId}/team-members/${memberId}`, data)
    return response.data
  },

  async deleteTeamMember(projectId: string, memberId: string): Promise<void> {
    const response = await apiClient.delete(`/api/projects/${projectId}/team-members/${memberId}`)
    return response.data
  },

  async syncTeamFromBacklog(projectId: string): Promise<{ team_members: TeamMember[] }> {
    const response = await apiClient.post(`/api/projects/${projectId}/team-members/sync-from-backlog`)
    return response.data
  },

  // PRD Decisions API
  async getPRDDecisions(projectId: string, limit: number = 10): Promise<{ decisions: PRDDecision[] }> {
    const response = await apiClient.get(`/api/projects/${projectId}/prd-decisions`, {
      params: { limit }
    })
    return response.data
  },

  // Weekly Summary API
  async getWeeklySummary(projectId: string): Promise<WeeklySummary> {
    const response = await apiClient.get(`/api/projects/${projectId}/weekly-summary`)
    return response.data
  },

  async regenerateWeeklySummary(projectId: string): Promise<WeeklySummary> {
    const response = await apiClient.post(`/api/projects/${projectId}/weekly-summary/regenerate`)
    return response.data.summary
  },

  async updateWeeklySummary(projectId: string, summaryText: string): Promise<void> {
    const response = await apiClient.put(`/api/projects/${projectId}/weekly-summary`, { summary_text: summaryText })
    return response.data
  },

  // Updated Risks API (using insights endpoint)
  async createRisk(projectId: string, data: {
    title: string
    description: string
    severity: string
    sector: string
    mitigation_plan?: string
    probability?: number
    impact?: string
  }): Promise<Risk> {
    const response = await apiClient.post(`/api/projects/${projectId}/risks`, data)
    return response.data
  },

  async updateRisk(projectId: string, riskId: string, data: Partial<Risk>): Promise<void> {
    const response = await apiClient.put(`/api/projects/${projectId}/risks/${riskId}`, data)
    return response.data
  },

  async deleteRisk(projectId: string, riskId: string): Promise<void> {
    const response = await apiClient.delete(`/api/projects/${projectId}/risks/${riskId}`)
    return response.data
  },

  // Meetings API (using insights endpoint)
  async createMeeting(projectId: string, data: {
    title: string
    date: string
    participants: number
    summary?: string
    decisions?: string[]
    action_items?: Array<{ task: string; owner: string; done: boolean }>
  }): Promise<Meeting> {
    const response = await apiClient.post(`/api/projects/${projectId}/meetings`, data)
    return response.data
  },

  async updateMeeting(projectId: string, meetingId: string, data: Partial<Meeting>): Promise<void> {
    const response = await apiClient.put(`/api/projects/${projectId}/meetings/${meetingId}`, data)
    return response.data
  },

  async deleteMeeting(projectId: string, meetingId: string): Promise<void> {
    const response = await apiClient.delete(`/api/projects/${projectId}/meetings/${meetingId}`)
    return response.data
  },

  // ========================
  // VERSIONING API
  // ========================

  async addSources(projectId: string, files: File[], notes?: string): Promise<{
    new_version: number
    files_added: number
    files: string[]
    notes: string
    message: string
  }> {
    const formData = new FormData()
    if (notes) {
      formData.append('version_notes', notes)
    }
    files.forEach((file) => formData.append('files', file))
    
    const response = await apiClient.post(`/api/projects/${projectId}/sources`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async reprocessProject(projectId: string): Promise<{
    version: number
    prd_path: string
    gaps_detected: number
    answers_preserved: number
    is_complete: boolean
    sections_count: number
    message: string
  }> {
    const response = await apiClient.post(`/api/projects/${projectId}/reprocess`)
    return response.data
  },

  async getVersionHistory(projectId: string): Promise<{
    current_version: number
    total_versions: number
    versions: Array<{
      version: number
      created_at: string
      files_added: string[]
      notes: string
      gaps_detected: number
      questions_generated: number
      status: string
    }>
    history: Array<{
      version: number
      action: string
      timestamp: string
      notes?: string
      files_added?: string[]
    }>
  }> {
    const response = await apiClient.get(`/api/projects/${projectId}/versions`)
    return response.data
  },

  async getPRDVersion(projectId: string, version: number): Promise<{
    version: number
    content: string
    metadata: {
      version: number
      created_at: string
      files_added: string[]
      notes: string
      status: string
    }
  }> {
    const response = await apiClient.get(`/api/projects/${projectId}/prd/v/${version}`)
    return response.data
  },

  async compareVersions(projectId: string, version1: number, version2: number): Promise<{
    version1: number
    version2: number
    summary: string
    sections_added: number
    sections_removed: number
    sections_modified: number
    sections_unchanged: number
    added: Array<{
      section: string
      title: string
      content: string
    }>
    removed: Array<{
      section: string
      title: string
    }>
    modified: Array<{
      section: string
      title: string
      similarity: number
      changes: Array<{
        type: 'added' | 'removed' | 'context'
        content: string
      }>
    }>
    gaps_comparison: {
      version1: number
      version2: number
      gaps_v1: number
      gaps_v2: number
      new_gaps: string[]
      resolved_gaps: string[]
      common_gaps: string[]
    }
  }> {
    const response = await apiClient.post(`/api/projects/${projectId}/versions/compare`, {
      version1,
      version2
    })
    return response.data
  },
}

