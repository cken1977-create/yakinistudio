'use client'

import { useState } from 'react'
import { Lead } from '@/types'
import { OFFER_CHOICES } from '@/lib/pricing'

export function IntakeForm() {
  const [form, setForm] = useState<Partial<Lead>>({})
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm({})
    } catch {
      setStatus('error')
    }
  }

  return (
    <section
      id="contact"
      className="bg-[#1C1C1C] py-32 px-6 border-t border-[#C9A84C]/15"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Left */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
                Start a Project
              </span>
            </div>
            <h2
              className="font-bold text-[#F5EFE3] leading-none tracking-tight mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
            >
              Stop freelancing<br />
              your{' '}
              <em className="text-[#C9A84C] not-italic">future.</em>
            </h2>
            <p className="text-[#F5EFE3]/50 text-base leading-relaxed mb-12">
              The first conversation is a free 30-minute Drag Audit.
              Tell us whether you want a self-serve plan, a kit, or a custom quote.
            </p>

            {/* Info */}
            <div className="flex flex-col gap-0 border border-[#C9A84C]/15">
              {[
                { label: 'Email', value: 'hello@yakini.digital' },
                { label: 'Response Time', value: 'Within 24 hours' },
                { label: 'Drag Audit', value: 'Free — 30 minutes' },
                { label: 'Next step', value: 'Plan, kit, or a custom quote' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-1 px-5 py-4 border-b border-[#C9A84C]/10 last:border-0"
                >
                  <span className="text-[9px] tracking-[3px] uppercase text-[#C9A84C]">
                    {item.label}
                  </span>
                  <span className="text-[#F5EFE3]/70 text-sm">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Name + Company */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
                  Name *
                </label>
                <input
                  name="name"
                  required
                  value={form.name ?? ''}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="bg-[#242424] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#F5EFE3]/20"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
                  Company
                </label>
                <input
                  name="company"
                  value={form.company ?? ''}
                  onChange={handleChange}
                  placeholder="Your company"
                  className="bg-[#242424] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#F5EFE3]/20"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
                Email *
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email ?? ''}
                onChange={handleChange}
                placeholder="your@email.com"
                className="bg-[#242424] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#F5EFE3]/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
                Plan, kit, or custom *
              </label>
              <select
                name="service"
                required
                value={form.service ?? ''}
                onChange={handleChange}
                className="bg-[#242424] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors appearance-none"
              >
                <option value="">Select...</option>
                {OFFER_CHOICES.map((choice) => (
                  <option key={choice.val} value={choice.label}>{choice.label}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
                Tell Us About Your Project *
              </label>
              <textarea
                name="message"
                required
                rows={4}
                value={form.message ?? ''}
                onChange={handleChange}
                placeholder="What are you building? What do you need?"
                className="bg-[#242424] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#F5EFE3]/20 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-[#C9A84C] text-[#141414] text-[11px] tracking-[2.5px] uppercase py-4 font-medium hover:bg-[#E2C97E] transition-colors disabled:opacity-50"
            >
              {status === 'loading'
                ? 'Sending...'
                : 'Send Inquiry'}
            </button>

            {/* Feedback */}
            {status === 'success' && (
              <p className="text-center text-sm text-[#8A9E8C] italic">
                ✓ Inquiry received. We&apos;ll be in touch within 24 hours.
              </p>
            )}
            {status === 'error' && (
              <p className="text-center text-sm text-red-400 italic">
                Something went wrong. Email us at hello@yakini.digital
              </p>
            )}

          </form>
        </div>
      </div>
    </section>
  )
                }
