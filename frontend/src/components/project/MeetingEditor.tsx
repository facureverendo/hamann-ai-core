import { useState } from 'react'
import Modal from '../ui/Modal'
import NeonButton from '../ui/NeonButton'
import { projectService, type Meeting } from '../../services/projectService'

interface MeetingEditorProps {
  projectId: string
  meeting?: Meeting
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function MeetingEditor({ projectId, meeting, isOpen, onClose, onSave }: MeetingEditorProps) {
  const [title, setTitle] = useState(meeting?.title || '')
  const [date, setDate] = useState(meeting?.date || '')
  const [participants, setParticipants] = useState(meeting?.participants || 1)
  const [summary, setSummary] = useState(meeting?.summary || '')
  const [decisionsText, setDecisionsText] = useState(meeting?.decisions?.join('\n') || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        title,
        date,
        participants,
        summary,
        decisions: decisionsText.split('\n').filter(d => d.trim()),
        action_items: []
      }

      if (meeting) {
        await projectService.updateMeeting(projectId, meeting.id, data)
      } else {
        await projectService.createMeeting(projectId, data)
      }

      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving meeting:', err)
      alert('Error saving meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={meeting ? 'Edit Meeting' : 'New Meeting'}>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Participants</label>
            <input
              type="number"
              min="1"
              value={participants}
              onChange={(e) => setParticipants(Number(e.target.value))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
            rows={3}
            placeholder="Brief summary of the meeting..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Decisions (one per line)</label>
          <textarea
            value={decisionsText}
            onChange={(e) => setDecisionsText(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue"
            rows={4}
            placeholder="Decision 1&#10;Decision 2&#10;Decision 3"
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
