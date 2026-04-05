import React, { useState } from 'react'

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

  if (!data && !loading) {
    return (
      <div className="rounded-xl bg-[#111118] border border-white/5 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
            <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-10" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Data Science Analysis</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Salary modeling, market trend analysis, and skills gap scoring powered by structured data extraction.
        </p>
        <button
          onClick={runAnalysis}
          className="px-8 py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 transition-all shadow-lg shadow-cyan-500/10"
        >
          RUN ANALYSIS
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-[#111118] border border-white/5 p-12 text-center">
        <div className="w-10 h-10 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Running quantitative analysis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-[#111118] border border-red-500/20 p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={runAnalysis} className="text-sm text-gray-400 hover:text-white">Retry</button>
      </div>
    )
  }

  const { salary, marketTrend, skillsGap } = data
  const maxPosting = Math.max(...(marketTrend?.postings || [1]))

  return (
    <div className="space-y-4">
      {/* Salary Model */}
      <div className="rounded-xl bg-[#111118] border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <span className="text-emerald-400 text-xs">$</span>
          </div>
          <h3 className="text-sm font-semibold text-white">Salary Model</h3>
          <span className="text-xs text-gray-600 mono ml-auto">{salary?.location}</span>
        </div>

        <div className="flex items-end gap-3 mb-3">
          {[
            { label: 'P25', value: salary?.p25, color: '#6b7280' },
            { label: 'P50', value: salary?.p50, color: '#22c55e' },
            { label: 'P75', value: salary?.p75, color: '#6b7280' },
          ].map(band => (
            <div key={band.label} className="flex-1 text-center">
              <div
                className="rounded-t-md mx-auto transition-all"
                style={{
                  height: `${(band.value / (salary?.p75 || 1)) * 80}px`,
                  backgroundColor: band.color + '30',
                  border: `1px solid ${band.color}50`,
                  width: '100%',
                  maxWidth: 80,
                }}
              />
              <p className="text-xs mono mt-2" style={{ color: band.color }}>{band.label}</p>
              <p className="text-lg font-bold text-white">${(band.value / 1000).toFixed(0)}k</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">{salary?.insight}</p>
      </div>

      {/* Market Trend */}
      <div className="rounded-xl bg-[#111118] border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
              <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-10" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white">Market Trend</h3>
          <span className={`text-xs mono ml-auto ${(marketTrend?.yoyGrowth || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(marketTrend?.yoyGrowth || 0) >= 0 ? '+' : ''}{marketTrend?.yoyGrowth}% YoY
          </span>
        </div>

        <div className="flex items-end gap-2 h-24 mb-2">
          {(marketTrend?.postings || []).map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t-sm bg-blue-500/30 border border-blue-500/20 transition-all"
                style={{ height: `${(val / maxPosting) * 80}px` }}
              />
              <span className="text-[9px] mono text-gray-600 mt-1">
                {(marketTrend?.months?.[i] || '').slice(0, 3)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          {(marketTrend?.topCities || []).map(city => (
            <span key={city} className="text-[10px] mono px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {city}
            </span>
          ))}
        </div>
      </div>

      {/* Skills Gap */}
      <div className="rounded-xl bg-[#111118] border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white">Skills Gap Analysis</h3>
        </div>

        {/* Match Score Circle */}
        <div className="flex items-center gap-6 mb-4">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#1a1a2e" strokeWidth="3"
              />
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={skillsGap?.matchScore >= 70 ? '#22c55e' : skillsGap?.matchScore >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${skillsGap?.matchScore}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{skillsGap?.matchScore}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300 mb-2">{skillsGap?.verdict}</p>
            {(skillsGap?.criticalGaps || []).length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {skillsGap.criticalGaps.map(gap => (
                  <span key={gap} className="text-[10px] mono px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {gap}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Skills List */}
        <div className="space-y-1.5">
          {(skillsGap?.required || []).map(skill => (
            <div key={skill.skill} className="flex items-center gap-2 text-xs">
              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px]
                ${skill.has ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {skill.has ? '\u2713' : '\u2717'}
              </span>
              <span className="text-gray-300 flex-1">{skill.skill}</span>
              <span className={`mono text-[10px] px-1.5 py-0.5 rounded
                ${skill.importance === 'critical' ? 'bg-red-500/10 text-red-400' :
                  skill.importance === 'important' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-gray-500/10 text-gray-500'}`}>
                {skill.importance}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
