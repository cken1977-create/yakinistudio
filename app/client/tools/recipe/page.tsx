'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RecipeCostingTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!input.trim()) return
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'recipe', input }),
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
            Yakini Intelligence — 02
          </div>
          <h1 className="text-[#F5EFE3] font-bold text-3xl mb-3">
            Recipe Costing
          </h1>
          <p className="text-[#F5EFE3]/40 text-sm leading-relaxed max-w-lg">
            Enter your recipe ingredients and quantities. AI calculates
            true cost per serving, suggested menu price, and profit margin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
              Recipe Details
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Cajun Lobster Pasta: 1 whole lobster $18, 8oz pasta $1.20, heavy cream 4oz $0.80, butter $0.40, cajun spices $0.30, serves 2..."
              rows={10}
              className="bg-[#1C1C1C] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors resize-none placeholder:text-[#F5EFE3]/20 font-mono"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="bg-[#C9A84C] text-[#141414] text-[11px] tracking-[2.5px] uppercase py-4 font-medium hover:bg-[#E2C97E] transition-colors disabled:opacity-40"
            >
              {loading ? 'Calculating...' : 'Calculate Costs'}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
              Cost Analysis
            </label>
            <div className="bg-[#1C1C1C] border border-[#F5EFE3]/10 px-4 py-3 text-sm text-[#F5EFE3]/70 leading-relaxed min-h-[280px] whitespace-pre-wrap font-mono flex-1">
              {loading ? (
                <span className="text-[#C9A84C]/60 animate-pulse">
                  Calculating your costs...
                </span>
              ) : result ? result : (
                <span className="text-[#F5EFE3]/20 italic">
                  Your cost analysis will appear here...
                </span>
              )}
            </div>
            {result && (
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] tracking-[2px] uppercase py-3 hover:bg-[#C9A84C]/10 transition-colors"
              >
                Copy Analysis
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
