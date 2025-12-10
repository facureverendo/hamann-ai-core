import { useState, useEffect } from 'react'
import { projectService } from '../services/projectService'
import type { ProjectDetail } from '../services/projectService'

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    if (!projectId) return
    try {
      setLoading(true)
      const data = await projectService.getProject(projectId)
      setProject(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  return { project, loading, error, reload: loadProject }
}

