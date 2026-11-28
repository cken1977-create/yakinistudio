import type { ImageAspect } from '@yakini/ai'
import { IMPERSONATION_NAMES, normalizeName } from '@yakini/abuse'
import type { StylePreset } from '@yakini/site-schema'

/**
 * Shot list (design D4): the photos a site needs, described for the image model so a site's images
 * look like one shoot. Built from the business's own facts, its kit and its look; no AI call.
 *
 * Rules every prompt carries: no identifiable faces (hands, and people from behind or at a distance
 * are fine), no text or signage, no logos, no real brand names, and nothing the business didn't say
 * it sells: named products come only from the owner's own menu or services, never from the kit.
 */
export type ShotSlot = 'hero-wide' | 'hero-tall' | `feature-${1 | 2 | 3}` | `gallery-${1 | 2 | 3 | 4 | 5 | 6}`
export type Shot = { slot: ShotSlot; aspect: ImageAspect; size: '1k' | '2k'; subject: string; prompt: string }
export type ShotFacts = { kitId: string; preset: StylePreset; industry?: string; description?: string; offerings?: readonly string[] }

/** One grade-and-light recipe per look, appended to every shot so a site's photos match. */
export const PRESET_STYLE: Record<StylePreset, string> = {
  classic: 'natural light, true-to-life colour, clean and simple composition',
  signature: 'cinematic low-key lighting, deep shadows, warm glowing highlights, shallow depth of field',
  editorial: 'soft window daylight, muted palette, magazine composition with generous negative space',
  poster: 'bold saturated colour, crisp hard light, high contrast, punchy street-photography energy',
  craft: 'warm golden-hour light, gentle film grain, rustic natural textures, handmade feel',
  clean: 'bright even daylight, cool neutral tones, crisp and minimal, uncluttered',
}

export const SHOT_RULES = 'A real photograph. No text, letters, numbers or signage anywhere. No logos or brand names. No identifiable faces: hands, or people from behind or at a distance only.'

/** Places, moments and details for each kit. None names a product: products come from the owner. */
const KIT_SCENES: Record<string, readonly string[]> = {
  'food-truck': ['a food truck service window glowing at dusk under string lights', 'hands passing a paper tray of street food through a truck window', 'a hot flat-top griddle with food sizzling, close up', 'a small crowd seen from behind gathered at a food truck at night', 'a picnic table with street food and drinks in warm evening light', 'fresh chopped ingredients in steel prep containers', 'the side of a food truck parked at a park with trees', 'a cook\'s hands plating street food, close up'],
  restaurant: ['a warmly lit dining room with set tables and no diners\' faces visible', 'a plated dish on a dark table, close up', 'a bar counter with glasses and soft lights', 'a chef\'s hands finishing a plate in the kitchen', 'a corner table by a window at dusk', 'an open kitchen pass with plates ready to go', 'drinks being poured at the bar, hands only', 'a table set for a small celebration'],
  landlord: ['a bright, tidy apartment living room with large windows', 'a modern kitchen with clean counters in daylight', 'the outside of a well-kept small apartment building', 'a hand turning a key in a front door', 'a cozy bedroom with soft morning light', 'a neat shared laundry room', 'a green courtyard between buildings', 'a front porch with plants'],
  'real-estate': ['a welcoming house exterior at golden hour', 'a sunlit open-plan living room', 'a modern kitchen island with pendant lights', 'a quiet neighbourhood street lined with trees', 'a backyard patio at dusk', 'hands holding house keys over a table', 'a staged dining room with natural light', 'a home office corner with a window'],
  'tree-lawn': ['a freshly mowed lawn with clean stripes in morning light', 'a tree being pruned, gloved hands and tools, seen from behind', 'a neat garden bed with fresh mulch', 'a work truck with tools in a driveway', 'a tidy backyard after leaf cleanup', 'close up of hedge trimming', 'a tall tree against a blue sky', 'stacked cut logs and wood chips'],
  nonprofit: ['volunteers seen from behind sorting donations', 'hands packing food boxes on a table', 'a community gathering seen from a distance in a park', 'a bright community room set up for a meeting', 'hands planting a seedling in a community garden', 'stacked boxes of supplies ready to go', 'a welcoming front door of a community center', 'people from behind walking together at a neighbourhood event'],
  'training-school': ['a bright classroom with empty desks and a whiteboard', 'hands working on a hands-on training exercise', 'students from behind listening in a workshop', 'tools and safety gear laid out on a bench', 'a lab station ready for practice', 'an instructor\'s hands demonstrating a technique', 'a quiet study corner with books', 'a certificate on a desk with a pen'],
  trucking: ['a semi truck on an open highway at sunrise', 'a loading dock with pallets in daylight', 'a truck cab interior with the road ahead, no people', 'a line of trucks parked at a yard at dusk', 'hands securing a load strap on a flatbed', 'a long road through wide open country', 'a clean, modern truck parked in the sun', 'a warehouse with stacked freight'],
  oilfield: ['an oilfield pump jack against a big sky at sunset', 'heavy equipment on a work site in daylight', 'gloved hands with tools on a pipe fitting', 'service trucks lined up at a field yard', 'pipes and valves at an industrial site, close up', 'a crew seen from a distance working on site', 'a safety helmet and gloves on a tailgate', 'a dirt road through an oilfield at dawn'],
  service: ['tools of the trade neatly laid out on a workbench', 'gloved hands at work, close up', 'a tidy work van in a driveway', 'a clean, finished job in a bright room', 'a professional seen from behind at work', 'a welcoming office front desk with no people', 'close up of quality materials', 'a calm, organised workspace'],
}

const SLOTS: { slot: ShotSlot; aspect: ImageAspect; size: '1k' | '2k' }[] = [
  { slot: 'hero-wide', aspect: '16:9', size: '2k' }, { slot: 'hero-tall', aspect: '4:5', size: '2k' },
  { slot: 'feature-1', aspect: '3:2', size: '1k' }, { slot: 'feature-2', aspect: '3:2', size: '1k' }, { slot: 'feature-3', aspect: '3:2', size: '1k' },
  { slot: 'gallery-1', aspect: '1:1', size: '1k' }, { slot: 'gallery-2', aspect: '4:5', size: '1k' }, { slot: 'gallery-3', aspect: '3:2', size: '1k' },
  { slot: 'gallery-4', aspect: '1:1', size: '1k' }, { slot: 'gallery-5', aspect: '4:5', size: '1k' }, { slot: 'gallery-6', aspect: '3:2', size: '1k' },
]

/** An owner's product name, cleaned: no digits or symbols, no real brand names, short. */
export function cleanOffering(s: string): string | null {
  const t = s.replace(/\[\[[^\]]*\]\]/g, '').replace(/[™®©]/g, '').replace(/[^A-Za-zÀ-ɏ' -]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (t.length < 3 || t.length > 48) return null
  const n = normalizeName(t)
  if (IMPERSONATION_NAMES.some((b) => n.includes(` ${b} `))) return null
  return t.toLowerCase()
}

export function buildShotList(f: ShotFacts): Shot[] {
  const style = PRESET_STYLE[f.preset]
  const offerings = [...new Set((f.offerings ?? []).map(cleanOffering).filter((x): x is string => !!x))].slice(0, 8)
  const generalScenes = KIT_SCENES.service
  const scenes = KIT_SCENES[f.kitId] ?? generalScenes
  // The general kit for a named industry: the industry's own workspace, never another trade's tools.
  const industry = f.kitId === 'service' && f.industry ? f.industry.replace(/[^A-Za-z ,&'-]+/g, ' ').trim().slice(0, 60).toLowerCase() : ''
  const sceneFor = (i: number) => (industry ? `${scenes[i % scenes.length]}, for a ${industry} business` : scenes[i % scenes.length])
  return SLOTS.map((s, i) => {
    // Heroes and features alternate the owner's own products with the kit's places; galleries mix both.
    const useOffering = offerings.length > 0 && (s.slot.startsWith('feature') || s.slot === 'hero-tall' || (s.slot.startsWith('gallery') && i % 2 === 1))
    const subject = useOffering ? `${offerings[i % offerings.length]}, beautifully presented, close up` : sceneFor(i)
    return { ...s, subject, prompt: `${subject}. ${style}. ${SHOT_RULES}` }
  })
}
