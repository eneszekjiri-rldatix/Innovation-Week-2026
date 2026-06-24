import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TopBar } from '../components/TopBar'
import { uploadVideo } from '../api/client'

export const Route = createFileRoute('/_main/upload')({
  component: UploadVideoPage,
})

const KNOWN_UNITS = ['Intensive Care Unit', 'Acute Medical Ward', 'HDU']

function UploadVideoPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [unit, setUnit] = useState(KNOWN_UNITS[0])
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setStatus('uploading')
    setError(null)
    try {
      const response = await uploadVideo(file, unit)
      navigate({ to: '/audits/$datetime', params: { datetime: response.audit_id } })
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Geist, sans-serif' }}>
      <TopBar />

      <div className="pt-[44px] px-3 py-4 max-w-[480px]">
        <h1 className="text-[#151d1e] text-[24px] leading-[1.4] mb-4" style={{ fontWeight: 600 }}>
          Upload video
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[14px] text-[#515757] mb-1">Video file</label>
            <input
              type="file"
              accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[14px] text-[#515757] mb-1">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-white border border-[#515757] rounded-[8px] px-3 py-2 text-[14px] text-[#515757]"
            >
              {KNOWN_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-[14px] text-[#cc2121]">{error}</p>}

          <button
            type="submit"
            disabled={!file || status === 'uploading'}
            className="h-[36px] px-3 rounded-[8px] bg-[#14716d] text-white text-[14px] disabled:opacity-50"
          >
            {status === 'uploading' ? 'Analyzing…' : 'Upload and analyze'}
          </button>
        </form>
      </div>
    </div>
  )
}
