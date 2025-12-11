import { useState } from 'react'
import Modal from '../ui/Modal'
import NeonButton from '../ui/NeonButton'
import { projectService, type Risk } from '../../services/projectService'

interface RiskEditorProps {
  projectId: string
  risk?: Risk
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function RiskEditor({ projectId, risk, isOpen, onClose, onSave }: RiskEditorProps) {
  const [title, setTitle] = useState(risk?.title || '')
  const [description, setDescription] = useState(risk?.description || '')
  const [severity, setSeverity] = useState(risk?.severity || 'medium')
  const [sector, setSector] = useState(risk?.sector || 'General')
  const [mitigationPlan, setMitigationPlan] = useState(risk?.mitigation_plan || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        title,
        description,
        severity,
        sector,
        mitigation_plan: mitigationPlan
      }

      if (risk) {
        await projectService.updateRisk(projectId, risk.id, data)
      } else {
        await projectService.createRisk(projectId, data)
      }

      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving risk:', err)
      alert('Error saving risk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={risk ? 'Edit Risk' : 'New Risk'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sector</label>
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
              placeholder="e.g., Engineering, Business"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Mitigation Plan</label>
          <textarea
            value={mitigationPlan}
            onChange={(e) => setMitigationPlan(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
            rows={3}
            placeholder="How will this risk be mitigated?"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <NeonButton type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save'}
          </NeonButton>
          <NeonButton type="button" variant="purple" onClick={onClose}>
            Cancel
          </NeonButton>
        </div>
      </form>
    </Modal>
  )
}
