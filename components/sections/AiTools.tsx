'use client'

import { useState } from 'react'

type Tool = 'menu' | 'recipe' | 'pricing'

export function AiTools() {
  const [activeTool, setActiveTool] = useState<Tool>('menu')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const tools = [
    {
      id: 'menu' as Tool,
      label: 'Menu Builder',
      description: 'Describe your cuisine and style — AI builds a full menu with descriptions',
      placeholder: 'e.g. Mediterranean-American, upscale casual, seafood focus, 8–10 dishes...',
    },
    {
      id: 'recipe' as Tool,
      label: 'Recipe Costing',
      description: 'Enter a recipe — AI calculates cost per serving and suggested retail price',
      placeholder: 'e.g. Cajun Lobster Pasta: 1 whole lobster ($18), 8oz pasta ($1.20), cream sauce ingredients ($3.50), serves 2...',
    },
    {
      id: 'pricing' as Tool,
      label: 'Pricing Strategy',
      description: 'Describe your service — AI recommends pricing based on market and positioning',
      placeholder: 'e.g. Personal chef in Houston TX, 4-course private dinners for 2–8 guests, Mediterranean cuisine, 5 years experience...',
    },
  ]

  const activeToolData = tools.find(t => t.id === activeTool)!

  async function handleSubmit() {
    if (!input.trim()) return
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: activeTool, input }),
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
    <section className="bg-[#1C1C1C] py-32 px-6 border-t border-[#C9A84C]/15">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
              Yakini Intelligence
            </span>
          </div>
          <h2 className="font-bold text-[#F5EFE3] leading-none tracking-tight mb-4"
            style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            AI tools built for<br />
            <em className="text-[#C9A84C] not-italic">culinary operators.</em>
          </h2>
          <p className="text-[#F5EFE3]/50 text-base leading-relaxed max-w-xl">
            Menu building, recipe costing, and pricing strategy —
            powered by AI. Free to try. Built into every Pro Build and above.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setInput(''); setResult('') }}
              className={`p-6 text-left transition-colors border ${
                activeTool === tool.id
                  ? 'bg-[#242424] border-[#C9A84C]/40 border-t-2 border-t-[#C9A84C]'
                  : 'bg-[#141414] border-[#C9A84C]/10 hover:bg-[#1C1C1C]'
              }`}
            >
              <div className="text-[9px] tracking-[3px] uppercase text-[#C9A84C] mb-2">
                {tool.id === 'menu' ? '01' : tool.id === 'recipe' ? '02' : '03'}
              </div>
              <div className="text-[#F5EFE3] font-bold text-base mb-2">
                {tool.label}
              </div>
              <div className="text-[#F5EFE3]/40 text-xs leading-relaxed">
                {tool.description}
              </div>
            </button>
          ))}
        </div>

        {/* Tool Interface */}
        <div className="bg-[#141414] border border-[#C9A84C]/10 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Input */}
            <div className="flex flex-col gap-4">
              <label className="text-[9px] tracking-[3px] uppercase text-[#C9A84C]">
                {activeToolData.label} — Input
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeToolData.placeholder}
                rows={8}
                className="bg-[#1C1C1C] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors resize-none placeholder:text-[#F5EFE3]/20 font-mono"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                className="bg-[#C9A84C] text-[#141414] text-[11px] tracking-[2.5px] uppercase py-4 font-medium hover:bg-[#E2C97E] transition-colors disabled:opacity-40"
              >
                {loading ? 'Generating...' : `Run ${activeToolData.label}`}
              </button>
            </div>

            {/* Output */}
            <div className="flex flex-col gap-4">
              <label className="text-[9px] tracking-[3px] uppercase text-[#C9A84C]">
                AI Output
              </label>
              <div className="bg-[#1C1C1C] border border-[#F5EFE3]/10 px-4 py-3 text-sm text-[#F5EFE3]/70 leading-relaxed min-h-[200px] whitespace-pre-wrap font-mono">
                {loading ? (
                  <span className="text-[#C9A84C]/60 animate-pulse">
                    Generating your {activeToolData.label.toLowerCase()}...
                  </span>
                ) : result ? (
                  result
                ) : (
                  <span className="text-[#F5EFE3]/20 italic">
                    Your output will appear here...
                  </span>
                )}
              </div>
              {result && (
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] tracking-[2px] uppercase py-3 hover:bg-[#C9A84C]/10 transition-colors"
                >
                  Copy Output
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-[#F5EFE3]/20 text-xs mt-6 italic">
          Yakini Intelligence is included in all Pro Build, Operations, and Retention tier projects.
          Powered by Claude AI — Anthropic.
        </p>
      </div>
    </section>
  )
                }
