import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { SectionTitle } from '../components/SectionTitle'
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

      <div className="pt-[44px]">
        <div className="flex items-center justify-between px-3 py-2 min-h-[56px]">
          <h1 className="text-[#151d1e] text-[24px] leading-[1.4]" style={{ fontWeight: 600 }}>
            Upload video
          </h1>

          <button
            onClick={() => navigate({ to: '/' })}
            className="h-[28px] px-2 py-1 rounded-[8px] border border-[#1f4cb3] text-[#1f4cb3] text-[14px] leading-[1.2] bg-transparent hover:bg-[#e8eeff] transition-colors"
            style={{ fontWeight: 400 }}
          >
            Back to Home
          </button>
        </div>

        <div className="px-3 pb-6 flex justify-center">
          <div className="w-full max-w-[480px] bg-white rounded-[12px] border border-[#c1cacb] p-4 flex flex-col gap-4">
            <SectionTitle title="Upload details" subtitle="Submit a hand hygiene recording for AI analysis" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  className="block text-[14px] text-[#515757] mb-1"
                  style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
                >
                  Video file
                </label>
                <label
                  htmlFor="video-file"
                  className="flex flex-col items-center justify-center gap-1 w-full h-[120px] rounded-[8px] border border-dashed border-[#c1cacb] bg-[#f5f7fa] cursor-pointer hover:border-[#14716d] transition-colors text-center px-3"
                >
                  <span className="text-[14px] text-[#151d1e] truncate max-w-full" style={{ fontWeight: 500 }}>
                    {file ? file.name : 'Click to choose a video file'}
                  </span>
                  <span className="text-[12px] text-[rgba(0,0,0,0.5)]">MP4, AVI, MOV, MKV, or WEBM</span>
                </label>
                <input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>

              <div>
                <label
                  className="block text-[14px] text-[#515757] mb-1"
                  style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
                >
                  Unit
                </label>
                <div className="relative">
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full appearance-none bg-white border border-[#515757] rounded-[8px] px-3 py-2 pr-8 text-[14px] text-[#515757] cursor-pointer focus:outline-none focus:border-[#14716d]"
                    style={{ fontFamily: 'Geist, sans-serif', fontWeight: 300 }}
                  >
                    {KNOWN_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#151d1e]"
                    size={16}
                  />
                </div>
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
      </div>
    </div>
  )
}
