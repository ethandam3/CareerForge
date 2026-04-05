import React, { useState, useRef, useEffect } from 'react'
import DSAnalytics from './DSAnalytics'

// Set to true when the FastAPI backend is running
const USE_BACKEND = true

const AGENTS = [
  { id: 'research', name: 'Scout', icon: '01', color: '#22c55e', label: 'Company Intel', desc: 'Researching company, culture & role...' },
  { id: 'resume', name: 'Tailor', icon: '02', color: '#3b82f6', label: 'Resume Optimization', desc: 'Rewriting bullets & keywords...' },
  { id: 'interview', name: 'Socrates', icon: '03', color: '#a855f7', label: 'Interview Prep', desc: 'Predicting questions & building frameworks...' },
  { id: 'strategy', name: 'Maverick', icon: '04', color: '#f59e0b', label: 'Game Plan', desc: 'Building application & negotiation strategy...' },
]

function AgentTab({ agent, isActive, isComplete, isDimmed, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 w-full text-left
        ${isActive ? 'bg-white/5 border border-white/10' : 'border border-transparent hover:bg-white/[0.03]'}
        ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold mono relative
          ${isComplete ? 'bg-opacity-20' : isActive ? 'bg-opacity-10' : 'bg-white/5'}`}
        style={{
          backgroundColor: isComplete || isActive ? agent.color + '20' : undefined,
          color: isComplete || isActive ? agent.color : '#666',
          border: isActive ? `1px solid ${agent.color}40` : '1px solid transparent',
        }}
      >
        {isComplete ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          agent.icon
        )}
        {isActive && !isComplete && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: agent.color }} />
        )}
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: isComplete || isActive ? agent.color : '#888' }}>
          {agent.name}
        </div>
        <div className="text-xs text-gray-500">{agent.label}</div>
      </div>
    </button>
  )
}

function MarkdownRenderer({ text }) {
  // Simple markdown rendering for bold, headers, lists
  const lines = text.split('\n')
  return (
    <div className="space-y-2 text-sm leading-relaxed text-gray-300">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('## ')) return <h3 key={i} className="text-base font-semibold text-white mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('### ')) return <h4 key={i} className="text-sm font-semibold text-gray-200 mt-2">{line.slice(4)}</h4>
        if (line.match(/^\d+\.\s\*\*/)) {
          const parts = line.replace(/\*\*(.*?)\*\*/g, '|||$1|||').split('|||')
          return (
            <div key={i} className="pl-4 py-0.5">
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white">{p}</strong> : <span key={j}>{p}</span>)}
            </div>
          )
        }
        if (line.startsWith('- **') || line.startsWith('* **')) {
          const parts = line.slice(2).replace(/\*\*(.*?)\*\*/g, '|||$1|||').split('|||')
          return (
            <div key={i} className="pl-4 py-0.5 flex">
              <span className="text-gray-600 mr-2">-</span>
              <span>
                {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white">{p}</strong> : <span key={j}>{p}</span>)}
              </span>
            </div>
          )
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <div key={i} className="pl-4 py-0.5 flex"><span className="text-gray-600 mr-2">-</span><span>{line.slice(2)}</span></div>
        }
        if (line.match(/^\*\*(.*?)\*\*/)) {
          const parts = line.replace(/\*\*(.*?)\*\*/g, '|||$1|||').split('|||')
          return (
            <p key={i}>
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white">{p}</strong> : <span key={j}>{p}</span>)}
            </p>
          )
        }
        if (line.trim() === '') return <div key={i} className="h-2" />
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}

export default function CareerForge() {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [background, setBackground] = useState('')
  const [running, setRunning] = useState(false)
  const [activeStage, setActiveStage] = useState(null)
  const [viewingStage, setViewingStage] = useState(null)
  const [results, setResults] = useState({})
  const [streamingText, setStreamingText] = useState('')
  const [showDS, setShowDS] = useState(false)
  const outputRef = useRef(null)

  const completedStages = Object.keys(results)
  const allComplete = completedStages.length === 4

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [streamingText, results])

  async function runPipeline() {
    if (!jobTitle || !company || !background) return

    setRunning(true)
    setResults({})
    setStreamingText('')
    setActiveStage('research')
    setViewingStage('research')
    setShowDS(false)

    if (USE_BACKEND) {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobTitle, company, background }),
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
            } catch (e) { /* skip parse errors from partial chunks */ }
          }
        }
      } catch (err) {
        console.error('Pipeline error:', err)
        setRunning(false)
      }
    } else {
      // Fallback demo mode — simulates the pipeline locally
      for (const agent of AGENTS) {
        setActiveStage(agent.id)
        setViewingStage(agent.id)
        setStreamingText('')

        const demoText = `## ${agent.name} Analysis\n\n` +
          `Analyzing **${company}** for the **${jobTitle}** position...\n\n` +
          `### Key Findings\n\n` +
          `1. **Finding One** — Detailed analysis based on ${agent.label.toLowerCase()}\n` +
          `2. **Finding Two** — Strategic insight for the candidate\n` +
          `3. **Finding Three** — Actionable recommendation\n\n` +
          `*This is demo mode. Set USE_BACKEND = true and start the API server for real analysis.*`

        // Simulate streaming
        for (let i = 0; i < demoText.length; i += 3) {
          setStreamingText(demoText.slice(0, i + 3))
          await new Promise(r => setTimeout(r, 10))
        }

        setResults(prev => ({ ...prev, [agent.id]: demoText }))
        setStreamingText('')
        await new Promise(r => setTimeout(r, 300))
      }
      setActiveStage(null)
      setRunning(false)
    }
  }

  const currentAgent = AGENTS.find(a => a.id === viewingStage) || AGENTS[0]
  const displayText = viewingStage === activeStage ? streamingText : (results[viewingStage] || '')
  const isStreaming = viewingStage === activeStage && running

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0c0c14]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">CareerForge</h1>
              <p className="text-[10px] text-gray-500 mono tracking-widest uppercase">Multi-Agent Job Coach</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs mono text-gray-600">
            <span className={`w-2 h-2 rounded-full ${running ? 'bg-green-500 animate-pulse' : allComplete ? 'bg-green-500' : 'bg-gray-700'}`} />
            {running ? 'AGENTS ACTIVE' : allComplete ? 'PIPELINE COMPLETE' : 'READY'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Input Section */}
        {!running && !allComplete && (
          <div className="mb-8 p-6 rounded-xl bg-[#111118] border border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs mono text-gray-500 mb-2 uppercase tracking-wider">Target Role</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs mono text-gray-500 mb-2 uppercase tracking-wider">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Stripe"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs mono text-gray-500 mb-2 uppercase tracking-wider">Your Background</label>
                <input
                  type="text"
                  value={background}
                  onChange={e => setBackground(e.target.value)}
                  placeholder="CS student, Python/React, 2 internships..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={runPipeline}
              disabled={!jobTitle || !company || !background}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-300
                bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500
                disabled:opacity-30 disabled:cursor-not-allowed
                shadow-lg shadow-green-500/10 hover:shadow-green-500/20"
            >
              DEPLOY AGENTS
            </button>
          </div>
        )}

        {/* Main workspace */}
        {(running || allComplete) && (
          <div className="flex gap-6">
            {/* Left sidebar — agent tabs */}
            <div className="w-56 flex-shrink-0 space-y-2">
              {AGENTS.map(agent => (
                <AgentTab
                  key={agent.id}
                  agent={agent}
                  isActive={activeStage === agent.id}
                  isComplete={!!results[agent.id]}
                  isDimmed={!results[agent.id] && activeStage !== agent.id}
                  onClick={() => (results[agent.id] || activeStage === agent.id) && setViewingStage(agent.id)}
                />
              ))}

              {allComplete && (
                <>
                  <div className="border-t border-white/5 my-3" />
                  <button
                    onClick={() => setShowDS(!showDS)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left
                      ${showDS ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]'}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold mono
                      ${showDS ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-500'}`}>
                      DS
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${showDS ? 'text-cyan-400' : 'text-gray-400'}`}>Analytics</div>
                      <div className="text-xs text-gray-500">DS Layer</div>
                    </div>
                  </button>
                  <div className="border-t border-white/5 my-3" />
                  <button
                    onClick={() => {
                      setResults({})
                      setRunning(false)
                      setActiveStage(null)
                      setViewingStage(null)
                      setShowDS(false)
                    }}
                    className="w-full text-xs mono text-gray-600 hover:text-gray-400 py-2 transition-colors"
                  >
                    [ NEW ANALYSIS ]
                  </button>
                </>
              )}
            </div>

            {/* Right panel — output */}
            <div className="flex-1 min-w-0">
              {!showDS ? (
                <div className="rounded-xl bg-[#111118] border border-white/5 overflow-hidden">
                  {/* Panel header */}
                  <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentAgent.color }} />
                      <span className="text-sm font-medium" style={{ color: currentAgent.color }}>
                        {currentAgent.name}
                      </span>
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
                  <div ref={outputRef} className="p-5 max-h-[60vh] overflow-y-auto">
                    {displayText ? (
                      <MarkdownRenderer text={displayText} />
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
                <DSAnalytics
                  jobTitle={jobTitle}
                  company={company}
                  background={background}
                  agentResults={results}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
