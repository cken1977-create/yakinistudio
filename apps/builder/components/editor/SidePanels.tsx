'use client'
import { kitDefinition } from '@yakini/kits'
import { SECTION_LABELS } from '@/lib/editor/fields'
import { panel, useEditor } from './context'

/** The Kit tab (spec 10.2): what this kit includes, and the walkable kit preview on the demo. */
export function KitPanel() {
  const { doc } = useEditor()
  const kit = kitDefinition(doc.kitId)
  if (!kit) return null
  return (
    <div className="space-y-4 p-5">
      <h2 className={panel.h2}>Your {kit.name.toLowerCase()} kit</h2>
      <p className="text-paper/85">These pages and sections come with your kit. Add any of them from the Pages and Edit tabs.</p>
      <div>
        <h3 className="text-sm font-semibold">Pages</h3>
        <ul className="mt-1 list-disc pl-5 text-paper/85">{kit.pageTemplates.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold">Sections</h3>
        <p className="mt-1 text-paper/85">{kit.allowedSections.filter((t) => t !== 'header' && t !== 'footer').map((t) => SECTION_LABELS[t]).join(', ')}.</p>
      </div>
      <a href="https://yakini.digital/demo" target="_blank" rel="noopener" className={panel.btn}>Walk through the kit</a>
    </div>
  )
}

/** The Help tab. Destiny answers here (step 7); until then, the written tutorial. */
export function HelpPanel({ onAskChat }: { onAskChat: (q: string) => void }) {
  const { siteId } = useEditor()
  void onAskChat
  return (
    <div className="space-y-4 p-5">
      <h2 className={panel.h2}>Help</h2>
      <p className="text-paper/85">Step-by-step help for everything in the editor.</p>
      <a href={`/sites/${siteId}/tutorial`} className={panel.btn}>Open the tutorial</a>
    </div>
  )
}
