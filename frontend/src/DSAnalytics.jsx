import React, { useState, useEffect } from 'react'

function SalaryChart({ salary }) {
  if (!salary) return null
  const min = salary.p25
  const max = salary.p75
  const mid = salary.p50
  const range = max - min || 1

  return (
    <div className="rounded-xl bg-forge-900/80 border border-emerald-500/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <span className="text-emerald-400 text-sm font-bold">$</span>
          </div>
          <h3 className="text-sm font-semibold text-white">Salary Range</h3>
        </div>
        <span className="text-xs text-gray-500 mono">{salary.location}</span>
      </div>

      {/* Horizontal range bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mono text-gray-500 mb-1">
          <span>${(min / 1000).toFixed(0)}k</span>
          <span className="text-emerald-400 font-bold text-sm">${(mid / 1000).toFixed(0)}k</span>
          <span>${(max / 1000).toFixed(0)}k</span>
        </div>
        <div className="relative h-6 bg-forge-950 rounded-full overflow-hidden border border-white/5">
          <div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-emerald-600/30 via-emerald-500/50 to-emerald-600/30"
            style={{ left: '5%', right: '5%' }} />
          {/* P50 marker */}
          <div className="absolute top-0 bottom-0 w-1 bg-emerald-400 rounded"
            style={{ left: `${5 + ((mid - min) / range) * 90}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>25th percentile</span>
          <span>75th percentile</span>
        </div>
      </div>
      <p className="text-xs text-gray-400">{salary.insight}</p>
    </div>
  )
}

function TrendChart({ marketTrend }) {
  if (!marketTrend) return null
  const postings = marketTrend.postings || []
  const maxVal = Math.max(...postings, 1)
  const months = marketTrend.months || []

  // SVG line chart
  const w = 280, h = 80, pad = 10
  const points = postings.map((v, i) => ({
    x: pad + (i / (postings.length - 1)) * (w - pad * 2),
    y: h - pad - (v / maxVal) * (h - pad * 2),
  }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = linePath + ` L${points[points.length - 1]?.x || 0},${h - pad} L${pad},${h - pad} Z`

  return (
    <div className="rounded-xl bg-forge-900/80 border border-emerald-500/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-10" /></svg>
          </div>
          <h3 className="text-sm font-semibold text-white">Market Trend</h3>
        </div>
        <span className={`text-xs mono font-bold ${(marketTrend.yoyGrowth || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {(marketTrend.yoyGrowth || 0) >= 0 ? '+' : ''}{marketTrend.yoyGrowth}% YoY
        </span>
      </div>

      {/* SVG area chart */}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20 mb-2">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaFill)" />
        <path d={linePath} fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0d1a10" stroke="#14b8a6" strokeWidth="1.5" />
        ))}
      </svg>

      <div className="flex justify-between text-[9px] mono text-gray-600">
        {months.map((m, i) => <span key={i}>{m.slice(0, 3)}</span>)}
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {(marketTrend.topCities || []).map(city => (
          <span key={city} className="text-[10px] mono px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/15">
            {city}
          </span>
        ))}
      </div>
    </div>
  )
}

function SkillsChart({ skillsGap }) {
  if (!skillsGap) return null
  const haveSkills = (skillsGap.required || []).filter(s => s.has)
  const needSkills = (skillsGap.required || []).filter(s => !s.has)

  return (
    <div className="rounded-xl bg-forge-900/80 border border-emerald-500/10 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        </div>
        <h3 className="text-sm font-semibold text-white">Skills Gap Analysis</h3>
      </div>

      <div className="flex items-center gap-6 mb-4">
        {/* Match score ring */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#1a2e1e" strokeWidth="3" />
            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={skillsGap.matchScore >= 70 ? '#22c55e' : skillsGap.matchScore >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeDasharray={`${skillsGap.matchScore}, 100`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{skillsGap.matchScore}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-300 mb-2">{skillsGap.verdict}</p>
          {(skillsGap.criticalGaps || []).length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {skillsGap.criticalGaps.map(gap => (
                <span key={gap} className="text-[10px] mono px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/15">
                  {gap}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two columns: Have / Need */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 mono mb-2 font-semibold">You Have</div>
          <div className="space-y-1">
            {haveSkills.map(skill => (
              <div key={skill.skill} className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 rounded flex items-center justify-center text-[10px] bg-emerald-500/20 text-emerald-400">{'\u2713'}</span>
                <span className="text-gray-300">{skill.skill}</span>
              </div>
            ))}
            {haveSkills.length === 0 && <p className="text-xs text-gray-600">None detected</p>}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-amber-400 mono mb-2 font-semibold">You Need</div>
          <div className="space-y-1">
            {needSkills.map(skill => (
              <div key={skill.skill} className="flex items-center gap-2 text-xs">
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px]
                  ${skill.importance === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {skill.importance === 'critical' ? '!' : '\u2022'}
                </span>
                <span className="text-gray-300">{skill.skill}</span>
                {skill.importance === 'critical' && (
                  <span className="text-[9px] mono text-red-400">critical</span>
                )}
              </div>
            ))}
            {needSkills.length === 0 && <p className="text-xs text-gray-600">All matched!</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DSAnalytics({ jobTitle, company, background, agentResults }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const agentSummary = Object.entries(agentResults)
        .map(([stage, result]) => `[${stage}]: ${result.slice(0, 500)}`)
        .join('\n\n')

      const response = await fetch('/api/ds-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, background, agentSummary }),
      })
      const result = await response.json()
      if (result.error) throw new Error(result.error)
      setData(result)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  // Auto-run on mount
  useEffect(() => {
    if (!data && !loading) runAnalysis()
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl bg-forge-900/50 border border-white/5 p-12 text-center">
        <div className="w-10 h-10 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Running quantitative analysis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-forge-900/50 border border-red-500/20 p-8 text-center">
        <p className="text-red-400 mb-4 text-sm">{error}</p>
        <button onClick={runAnalysis} className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-all">
          Retry Analysis
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-10" /></svg>
        <h2 className="text-sm font-semibold text-white">Data Science Analysis</h2>
        <span className="text-[10px] mono text-gray-600">Salary Model + Market Trends + Skills Gap</span>
      </div>
      <SalaryChart salary={data.salary} />
      <TrendChart marketTrend={data.marketTrend} />
      <SkillsChart skillsGap={data.skillsGap} />
    </div>
  )
}
