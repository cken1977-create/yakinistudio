'use client'

import { useState } from 'react'
import Link from 'next/link'

const industries = [
  'Personal Chef / Catering',
  'Restaurant / Food Truck',
  'Construction / Contracting',
  'Trucking / Logistics',
  'Nonprofit Organization',
  'Airbnb / Short Term Rental',
  'Retail / E-commerce',
  'Oilfield / Energy Services',
  'Healthcare / Wellness',
  'Other — Describe Below',
]

export default function IndustryIntelligenceTool() {
  const [industry, setIndustry] = useState('')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!input.trim() || !industry) return
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'industry',
          input: 'Industry: ' + industry + '\n\n' + input,
        }),
      })
      const data = await res.json()
      setResult(data.result)
    } catch {
      setResult('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] pt-24">
      <div className="max-w-5xl mx-auto px-6 py-16">

        <Link href="/client"
          className="text-[#C9A84C] text-[10px] tracking-[3px] uppercase flex items-center gap-2 mb-12 hover:opacity-70 transition-opacity">
          ← Back to Dashboard
        </Link>

        <div className="mb-10">
          <div className="text-[#C9A84C] text-[9px] tracking-[4px] uppercase mb-3">
            Yakini Intelligence — 05
          </div>
          <h1 className="text-[#F5EFE3] font-bold text-3xl mb-3">
            Industry Intelligence
          </h1>
          <p className="text-[#F5EFE3]/40 text-sm leading-relaxed max-w-lg">
            Select your industry and describe your situation.
            AI provides specific operational intelligence, benchmarks,
            and actionable guidance built for your vertical.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
                Select Your Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="bg-[#1C1C1C] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors appearance-none"
              >
                <option value="">Select industry...</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
                Describe Your Situation
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your business, current challenges, goals, and what you need help understanding..."
                rows={8}
                className="bg-[#1C1C1C] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors resize-none placeholder:text-[#F5EFE3]/20 font-mono"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim() || !industry}
              className="bg-[#C9A84C] text-[#141414] text-[11px] tracking-[2.5px] uppercase py-4 font-medium hover:bg-[#E2C97E] transition-colors disabled:opacity-40"
            >
              {loading ? 'Analyzing...' : 'Get Industry Intelligence'}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
              Intelligence Report
            </label>
            <div className="bg-[#1C1C1C] border border-[#F5EFE3]/10 px-4 py-3 text-sm text-[#F5EFE3]/70 leading-relaxed min-h-[280px] whitespace-pre-wrap font-mono flex-1">
              {loading ? (
                <span className="text-[#C9A84C]/60 animate-pulse">
                  Generating intelligence report...
                </span>
              ) : result ? result : (
                <span className="text-[#F5EFE3]/20 italic">
                  Your intelligence report will appear here...
                </span>
              )}
            </div>
            {result && (
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] tracking-[2px] uppercase py-3 hover:bg-[#C9A84C]/10 transition-colors"
              >
                Copy Report
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 border border-[#F5EFE3]/08 p-4">
          <p className="text-[#F5EFE3]/25 text-xs leading-relaxed italic">
            This tool provides general business education and frameworks.
            Not legal, tax, or financial advice. Consult licensed professionals
            for your specific situation.
          </p>
        </div>

      </div>
    </div>
  )
}
