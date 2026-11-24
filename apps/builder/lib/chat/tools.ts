import { z } from 'zod'
import { PublicEditOp } from '@yakini/edits'
import type { ToolDef } from '@yakini/ai'

/**
 * Chat-edit tools (spec 8.7), generated from the same schemas the editor validates against, so
 * the model is never offered an argument the server would refuse. Ids for new sections/pages are
 * chosen by the server, so `id`/`newId` are not offered.
 */
const DESCRIPTIONS: Record<string, string> = {
  update_field: 'Set one field of one section. `path` is a JSON pointer inside the section props, like /headline or /items/0/title. Send the whole new list to add, remove or reorder list items. Leave `value` out to clear an optional field.',
  update_business: 'Change business info shown across the site: tagline, phone (+1XXXXXXXXXX), email, address, hours ([{day, open, close}] in 24-hour HH:MM, or {day, closed: true}), serviceArea, social.',
  add_section: 'Insert a new section allowed for this kit after `afterSectionId` (null = right after the header).',
  remove_section: 'Remove a section (the owner can undo).',
  move_section: 'Move a section to a new position on its page (0 is the header).',
  duplicate_section: 'Copy a section right below itself.',
  set_section_variant: 'Switch a section to another style from KIT_RULES.',
  set_section_hidden: 'Hide or show a section.',
  set_image: 'Use a photo that already belongs to this business at an image field.',
  add_page: 'Add a page from the kit page templates.',
  remove_page: 'Remove a page (never the home page).',
  rename_page: 'Rename a page; the menu label follows.',
  move_page: 'Move a page in the menu (the home page stays first).',
  set_seo: 'Set the search title/description for the whole site (pageId null) or one page.',
}

function opTool(option: z.ZodObject): ToolDef {
  const name = String((option.shape.op as z.ZodLiteral).value)
  const drop = Object.fromEntries(['op', 'id', 'newId'].filter((k) => k in option.shape).map((k) => [k, true]))
  const args = option.omit(drop as never)
  const parameters = z.toJSONSchema(args, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>
  delete parameters.$schema
  return { type: 'function', function: { name, description: DESCRIPTIONS[name] ?? name, parameters } }
}

export const REPLY_TOOL: ToolDef = {
  type: 'function',
  function: {
    name: 'reply', description: 'Answer the owner without changing the site.',
    parameters: { type: 'object', properties: { message: { type: 'string', maxLength: 400 } }, required: ['message'], additionalProperties: false },
  },
}
export const ASK_TOOL: ToolDef = {
  type: 'function',
  function: {
    name: 'ask_clarifying_question', description: 'Ask one short question when the request is unclear; offer up to 4 choices.',
    parameters: {
      type: 'object',
      properties: { question: { type: 'string', maxLength: 200 }, choices: { type: 'array', items: { type: 'string', maxLength: 60 }, maxItems: 4 } },
      required: ['question'], additionalProperties: false,
    },
  },
}

export const ReplyArgs = z.object({ message: z.string().trim().min(1).max(400) }).strict()
export const AskArgs = z.object({ question: z.string().trim().min(1).max(200), choices: z.array(z.string().trim().min(1).max(60)).max(4).optional() }).strict()

let cached: ToolDef[] | null = null
export function editTools(): ToolDef[] {
  cached ??= [...(PublicEditOp.options as unknown as z.ZodObject[]).map(opTool), ASK_TOOL, REPLY_TOOL]
  return cached
}
