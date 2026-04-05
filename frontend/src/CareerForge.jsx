import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DSAnalytics from './DSAnalytics'

const USE_BACKEND = true

const AGENTS = [
  { id: 'research', name: 'Scout', icon: '01', color: '#22c55e', label: 'Research', desc: 'Researching organization & role...' },
  { id: 'resume', name: 'Tailor', icon: '02', color: '#3b82f6', label: 'Resume', desc: 'Optimizing your resume...' },
  { id: 'interview', name: 'Socrates', icon: '03', color: '#a855f7', label: 'Interview', desc: 'Preparing interview strategy...' },
  { id: 'strategy', name: 'Maverick', icon: '04', color: '#f59e0b', label: 'Game Plan', desc: 'Building your roadmap...' },
]

function AgentTab({ agent, isActive, isComplete, isDimmed, onClick }) {
  const [pressed, setPressed] = useState(false)

  function handleClick() {
    setPressed(true)
    setTimeout(() => setPressed(false), 200)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left
        ${isActive ? 'bg-white/5 border-l-[3px] agent-tab-active' : 'border-l-[3px] border-transparent hover:bg-white/[0.03]'}
        ${isDimmed ? 'opacity-30 pointer-events-none' : 'opacity-100'}
        ${pressed ? 'scale-[0.97]' : 'scale-100'}`}
      style={{
        borderLeftColor: isActive ? agent.color : 'transparent',
        boxShadow: isActive ? `inset 0 0 30px ${agent.color}10` : 'none',
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold mono relative transition-all duration-300"
        style={{
          backgroundColor: isComplete || isActive ? agent.color + '20' : 'rgba(255,255,255,0.05)',
          color: isComplete || isActive ? agent.color : '#666',
          border: isActive ? `1px solid ${agent.color}40` : '1px solid transparent',
        }}
      >
        {isComplete ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
        ) : agent.icon}
        {isActive && !isComplete && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: agent.color }} />
        )}
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: isComplete || isActive ? agent.color : '#888' }}>{agent.name}</div>
        <div className="text-[11px] text-gray-500">{agent.label}</div>
      </div>
    </button>
  )
}

function AgentOutput({ text }) {
  return (
    <div className="prose prose-invert prose-sm prose-green max-w-none
      prose-headings:text-emerald-300 prose-headings:text-base prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
      prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-1
      prose-li:text-gray-300 prose-li:my-0.5
      prose-strong:text-white
      prose-ul:my-2 prose-ol:my-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}

function MaverickTimeline({ text }) {
  const parts = text.split('## TIMELINE')
  const mainText = parts[0]
  const timelineRaw = parts[1] || ''

  const steps = []
  const lines = timelineRaw.split('\n')
  for (const line of lines) {
    const match = line.match(/^-\s*(STEP \d+|WEEK \d+|MONTH \d+):\s*(.+?)\s*\|\s*(.+)$/i)
    if (match) {
      // Strip ** bold markers from title and desc
      const cleanTitle = match[2].trim().replace(/\*\*/g, '')
      const cleanDesc = match[3].trim().replace(/\*\*/g, '')
      steps.push({ label: match[1], title: cleanTitle, desc: cleanDesc })
    }
  }

  return (
    <div>
      <AgentOutput text={mainText} />
      {steps.length > 0 && (
        <div className="mt-6 border-t border-white/5 pt-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-4 uppercase tracking-wider">Your Roadmap</h3>
          <div className="relative ml-4">
            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-amber-500/40 to-amber-500/5" />
            {steps.map((step, i) => (
              <div key={i} className="relative flex gap-4 mb-6 timeline-step" style={{ animationDelay: `${i * 120}ms` }}>
                <div className="relative z-10 w-4 h-4 rounded-full bg-amber-500/20 border-2 border-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs mono text-amber-400 font-semibold">{step.label}</div>
                  <div className="text-sm font-medium text-white mt-0.5">{step.title}</div>
                  <div className="text-sm text-gray-400 mt-1 leading-relaxed">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResumeUpload({ onExtract, resumeText }) {
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const fileRef = useRef(null)

  async function handleFile(file) {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Send PDF to backend for parsing
      setParsing(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/parse-resume', { method: 'POST', body: formData })
        const result = await response.json()
        if (result.error) {
          console.error('PDF parse error:', result.error)
          alert('Could not parse PDF: ' + result.error)
        } else {
          onExtract(result.text)
        }
      } catch (err) {
        console.error('PDF upload error:', err)
        alert('Failed to upload PDF')
      }
      setParsing(false)
    } else {
      // Text-based files
      const text = await file.text()
      onExtract(text)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="mt-3">
      <label className="block text-xs mono text-gray-500 mb-2 uppercase tracking-wider">Resume (optional)</label>
      {parsing ? (
        <div className="border border-white/10 rounded-lg p-4 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Parsing PDF...</span>
        </div>
      ) : resumeText ? (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-sm text-emerald-400">Resume loaded ({resumeText.length} chars)</span>
          </div>
          <button onClick={() => onExtract('')} className="text-xs text-gray-500 hover:text-white">Remove</button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
            ${dragOver ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}`}
        >
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.rtf,.doc" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" className="mx-auto mb-1">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-xs text-gray-500">Drop resume or click to upload (.pdf, .txt)</p>
          <p className="text-[10px] text-gray-600 mt-1">PDF files are automatically parsed</p>
        </div>
      )}
    </div>
  )
}

export default function CareerForge() {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [background, setBackground] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [running, setRunning] = useState(false)
  const [activeStage, setActiveStage] = useState(null)
  const [viewingStage, setViewingStage] = useState(null)
  const [results, setResults] = useState({})
  const [streamingText, setStreamingText] = useState('')
  const [showDS, setShowDS] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const outputRef = useRef(null)

  const completedStages = Object.keys(results)
  const allComplete = completedStages.length === 4
  const progress = (completedStages.length / 4) * 100

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [streamingText, results])

  function switchTab(stage) {
    if (results[stage] || activeStage === stage) {
      setViewingStage(stage)
      setShowDS(false)
      setContentKey(k => k + 1)
    }
  }

  async function runPipeline() {
    if (!jobTitle || !company || !background) return

    setRunning(true)
    setResults({})
    setStreamingText('')
    setActiveStage('research')
    setViewingStage('research')
    setShowDS(false)

    const fullBackground = resumeText
      ? `${background}\n\nRESUME:\n${resumeText}`
      : background

    if (USE_BACKEND) {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobTitle, company, background: fullBackground }),
        })

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let currentText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'stage_start') {
                currentText = ''
                setStreamingText('')
                setActiveStage(data.stage)
                setViewingStage(data.stage)
                setContentKey(k => k + 1)
              } else if (data.type === 'token') {
                currentText += data.token
                setStreamingText(currentText)
              } else if (data.type === 'stage_complete') {
                setResults(prev => ({ ...prev, [data.stage]: data.result }))
                setStreamingText('')
              } else if (data.type === 'complete') {
                setActiveStage(null)
                setRunning(false)
              }
            } catch (e) { /* partial chunk */ }
          }
        }
      } catch (err) {
        console.error('Pipeline error:', err)
        setRunning(false)
      }
    }
  }

  const currentAgent = AGENTS.find(a => a.id === viewingStage) || AGENTS[0]
  const displayText = viewingStage === activeStage ? streamingText : (results[viewingStage] || '')
  const isStreaming = viewingStage === activeStage && running

  return (
    <div className="min-h-screen text-gray-200">
      {/* Header */}
      <div className="border-b border-white/5 bg-forge-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              {/* Anvil icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 18h16" />
                <path d="M6 14h12l1 4H5l1-4z" />
                <path d="M8 14V10a4 4 0 0 1 8 0v4" />
                <path d="M10 10h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">CareerForge</h1>
              <p className="text-[10px] text-emerald-500/60 mono tracking-widest uppercase">Multi-Agent Career Coach</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs mono text-gray-600">
            <span className={`w-2 h-2 rounded-full ${running ? 'bg-green-500 animate-pulse' : allComplete ? 'bg-green-500' : 'bg-gray-700'}`} />
            {running ? 'AGENTS ACTIVE' : allComplete ? 'COMPLETE' : 'READY'}
          </div>
        </div>
        {/* Progress bar */}
        {(running || allComplete) && (
          <div className="h-0.5 bg-forge-900">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${running ? progress + 12 : progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Input Section */}
        {!running && !allComplete && (
          <div className="mb-8 p-6 rounded-xl bg-forge-900/50 border border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs mono text-gray-500 mb-2 uppercase tracking-wider">Target Role / Program</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="Software Engineer, Radiology Tech, MBA Program..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs mono text-gray-500 mb-2 uppercase tracking-wider">Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Google, Mayo Clinic, UCLA, any org..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
            <div className="mb-1">
              <label className="block text-xs mono text-gray-500 mb-2 uppercase tracking-wider">Your Background</label>
              <textarea
                value={background}
                onChange={e => setBackground(e.target.value)}
                placeholder="Your education, experience, skills, certifications... The more detail, the better the advice."
                rows={3}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
              />
            </div>
            <ResumeUpload onExtract={setResumeText} resumeText={resumeText} />
            <button
              onClick={runPipeline}
              disabled={!jobTitle || !company || !background}
              className="w-full mt-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
                bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500
                disabled:opacity-30 disabled:cursor-not-allowed
                shadow-lg shadow-green-500/10 hover:shadow-green-500/20 active:scale-[0.99]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 18h16" /><path d="M6 14h12l1 4H5l1-4z" /><path d="M8 14V10a4 4 0 0 1 8 0v4" />
              </svg>
              FORGE MY PATH
            </button>
          </div>
        )}

        {/* Main workspace */}
        {(running || allComplete) && (
          <div className="flex gap-6">
            {/* Left sidebar */}
            <div className="w-52 flex-shrink-0 space-y-1.5">
              {AGENTS.map(agent => (
                <AgentTab
                  key={agent.id}
                  agent={agent}
                  isActive={viewingStage === agent.id && !showDS}
                  isComplete={!!results[agent.id]}
                  isDimmed={!results[agent.id] && activeStage !== agent.id}
                  onClick={() => switchTab(agent.id)}
                />
              ))}

              {allComplete && (
                <>
                  <div className="border-t border-white/5 my-3" />
                  <button
                    onClick={() => { setShowDS(true); setContentKey(k => k + 1) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left border-l-[3px]
                      ${showDS ? 'bg-white/5 border-cyan-500 agent-tab-active' : 'border-transparent hover:bg-white/[0.03]'}`}
                    style={{ boxShadow: showDS ? 'inset 0 0 30px rgba(6,182,212,0.05)' : 'none' }}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold mono
                      ${showDS ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-500'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-10" /></svg>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${showDS ? 'text-cyan-400' : 'text-gray-400'}`}>Analytics</div>
                      <div className="text-[11px] text-gray-500">DS Layer</div>
                    </div>
                  </button>
                  <div className="border-t border-white/5 my-3" />
                  <button
                    onClick={() => {
                      setResults({}); setRunning(false); setActiveStage(null)
                      setViewingStage(null); setShowDS(false); setResumeText('')
                    }}
                    className="w-full text-xs mono text-gray-600 hover:text-emerald-400 py-2 px-4 transition-colors flex items-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    NEW ANALYSIS
                  </button>
                </>
              )}
            </div>

            {/* Right panel */}
            <div className="flex-1 min-w-0">
              {!showDS ? (
                <div className="rounded-xl bg-forge-900/50 border border-white/5 overflow-hidden">
                  {/* Panel header */}
                  <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentAgent.color }} />
                      <span className="text-sm font-medium" style={{ color: currentAgent.color }}>{currentAgent.name}</span>
                      <span className="text-xs text-gray-600">/ {currentAgent.label}</span>
                    </div>
                    {isStreaming && (
                      <span className="text-xs mono text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        streaming
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div ref={outputRef} className="p-5 max-h-[65vh] overflow-y-auto">
                    {displayText ? (
                      <div key={contentKey} className="content-enter">
                        {viewingStage === 'strategy' && !isStreaming ? (
                          <MaverickTimeline text={displayText} />
                        ) : (
                          <AgentOutput text={displayText} />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-5 h-5 border-2 border-gray-700 border-t-green-500 rounded-full animate-spin" />
                        <span className="text-sm">{currentAgent.desc}</span>
                      </div>
                    )}
                    {isStreaming && <span className="cursor-blink" />}
                  </div>
                </div>
              ) : (
                <div key={contentKey} className="content-enter">
                  <DSAnalytics
                    jobTitle={jobTitle}
                    company={company}
                    background={resumeText ? `${background}\n\nRESUME:\n${resumeText}` : background}
                    agentResults={results}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
