import type { SiteKitId } from '@yakini/pricing'

/**
 * The industries an owner can pick on /new. Each one points at the kit that fits it best. When
 * that kit isn't built yet the site uses the general `service` layout, and the industry name is
 * still passed to the writer so the words fit the business. As kits are built, their industries
 * move onto them with no other change.
 *
 * `photo` is a `service` kit sample key used as the hero picture, only where the picture really
 * shows that kind of work. Everything else starts with no stock photo.
 */
export type Industry = { id: string; label: string; group: IndustryGroup; kit: SiteKitId; photo?: ServicePhotoKey }

export type ServicePhotoKey = 'ac-repair' | 'service-van' | 'panel-testing' | 'kitchen-clean' | 'pipe-fitting' | 'tablet-signoff'

export const INDUSTRY_GROUPS = [
  'Food and drink',
  'Home services and trades',
  'Landscaping and outdoors',
  'Professional services',
  'Health and wellness',
  'Beauty and personal care',
  'Fitness and recreation',
  'Real estate and property',
  'Education and training',
  'Community, faith and nonprofit',
  'Transportation and logistics',
  'Energy and industrial',
  'Automotive',
  'Retail and shops',
  'Events, arts and media',
  'Pets and animals',
  'Other',
] as const
export type IndustryGroup = (typeof INDUSTRY_GROUPS)[number]

type Row = [id: string, label: string, kit?: SiteKitId, photo?: ServicePhotoKey]

const ROWS: Record<IndustryGroup, Row[]> = {
  'Food and drink': [
    ['restaurant', 'Restaurant', 'restaurant'], ['cafe', 'Café or coffee shop', 'restaurant'], ['bakery', 'Bakery', 'restaurant'],
    ['bar', 'Bar or brewery', 'restaurant'], ['winery', 'Winery or distillery', 'restaurant'], ['food-truck', 'Food truck', 'food-truck'],
    ['caterer', 'Caterer', 'food-truck'], ['pop-up', 'Pop-up or market stand', 'food-truck'], ['dessert', 'Ice cream or dessert shop', 'restaurant'],
    ['juice', 'Juice or smoothie bar', 'restaurant'], ['personal-chef', 'Personal chef or meal prep', 'service'], ['specialty-food', 'Specialty food maker', 'service'],
  ],
  'Home services and trades': [
    ['hvac', 'Heating and air conditioning', 'service', 'ac-repair'], ['plumber', 'Plumber', 'service', 'pipe-fitting'],
    ['electrician', 'Electrician', 'service', 'panel-testing'], ['cleaning', 'House cleaning', 'service', 'kitchen-clean'],
    ['commercial-cleaning', 'Commercial cleaning or janitorial', 'service', 'kitchen-clean'], ['handyman', 'Handyman', 'service', 'service-van'],
    ['contractor', 'General contractor', 'service', 'tablet-signoff'], ['remodeling', 'Remodeling', 'service', 'tablet-signoff'],
    ['roofing', 'Roofing', 'service', 'service-van'], ['painting', 'Painting', 'service', 'service-van'], ['flooring', 'Flooring', 'service', 'service-van'],
    ['carpet-cleaning', 'Carpet cleaning', 'service', 'service-van'], ['pest-control', 'Pest control', 'service', 'service-van'],
    ['appliance-repair', 'Appliance repair', 'service', 'service-van'], ['garage-doors', 'Garage doors', 'service', 'service-van'],
    ['locksmith', 'Locksmith', 'service', 'service-van'], ['windows', 'Windows and glass', 'service', 'service-van'],
    ['solar', 'Solar installation', 'service', 'panel-testing'], ['security-systems', 'Security systems', 'service', 'panel-testing'],
    ['moving', 'Moving company', 'service', 'service-van'], ['junk-removal', 'Junk removal', 'service', 'service-van'],
    ['pressure-washing', 'Pressure washing', 'service', 'service-van'], ['pool', 'Pool service', 'service', 'service-van'],
    ['concrete', 'Concrete and masonry', 'service', 'service-van'], ['welding', 'Welding and fabrication', 'specialized'],
  ],
  'Landscaping and outdoors': [
    ['lawn-care', 'Lawn care', 'tree-lawn'], ['landscaping', 'Landscaping', 'tree-lawn'], ['tree-service', 'Tree service', 'tree-lawn'],
    ['snow-removal', 'Snow removal', 'tree-lawn'], ['irrigation', 'Irrigation', 'tree-lawn'], ['fencing', 'Fencing', 'service', 'service-van'],
  ],
  'Professional services': [
    ['accountant', 'Accounting or bookkeeping'], ['tax-prep', 'Tax preparation'], ['law-firm', 'Law firm or attorney'],
    ['insurance', 'Insurance agency'], ['financial-advisor', 'Financial advisor'], ['consulting', 'Consulting'],
    ['holding-company', 'Holding company or investments'], ['marketing-agency', 'Marketing or design agency'], ['it-services', 'IT services or tech support'],
    ['staffing', 'Staffing or recruiting'], ['notary', 'Notary or document services'], ['architect', 'Architecture or engineering'],
    ['printing', 'Printing and signs'], ['translation', 'Translation or interpreting'], ['virtual-assistant', 'Virtual assistant or admin services'],
    ['business-coach', 'Business or life coach'], ['credit-repair', 'Credit counseling'], ['private-investigator', 'Private investigator'],
  ],
  'Health and wellness': [
    ['home-healthcare', 'Home health care', 'home-healthcare'], ['senior-care', 'Senior or in-home care', 'home-healthcare'],
    ['clinic', 'Medical clinic'], ['dentist', 'Dentist'], ['chiropractor', 'Chiropractor'], ['physical-therapy', 'Physical therapy'],
    ['counseling', 'Counseling or therapy'], ['massage', 'Massage therapy'], ['acupuncture', 'Acupuncture'], ['optometry', 'Eye care'],
    ['pharmacy', 'Pharmacy'], ['nutrition', 'Nutrition or dietitian'], ['doula', 'Doula or midwife'], ['medical-transport', 'Medical transportation', 'trucking'],
  ],
  'Beauty and personal care': [
    ['barber', 'Barbershop'], ['hair-salon', 'Hair salon'], ['nail-salon', 'Nail salon'], ['braiding', 'Hair braiding'],
    ['spa', 'Day spa'], ['lashes-brows', 'Lashes and brows'], ['esthetician', 'Skin care'], ['makeup', 'Makeup artist'],
    ['tattoo', 'Tattoo or piercing studio'], ['tailor', 'Tailor or alterations'],
  ],
  'Fitness and recreation': [
    ['gym', 'Gym'], ['personal-trainer', 'Personal trainer'], ['yoga', 'Yoga or pilates studio'], ['martial-arts', 'Martial arts'],
    ['dance-studio', 'Dance studio', 'training-school'], ['sports-league', 'Sports league or club'], ['outdoor-guide', 'Outdoor guide or tours'],
  ],
  'Real estate and property': [
    ['real-estate-agent', 'Real estate agent', 'real-estate'], ['brokerage', 'Real estate brokerage', 'real-estate'],
    ['landlord', 'Landlord or rentals', 'landlord'], ['property-management', 'Property management', 'landlord'],
    ['short-term-rental', 'Vacation or short-term rental', 'landlord'], ['home-inspector', 'Home inspection', 'service', 'tablet-signoff'],
    ['appraiser', 'Appraisal'], ['mortgage', 'Mortgage broker'], ['title-company', 'Title or escrow'], ['storage', 'Self storage', 'landlord'],
  ],
  'Education and training': [
    ['training-school', 'Training school', 'training-school'], ['trade-school', 'Trade or vocational school', 'training-school'],
    ['cdl-school', 'Truck driving school', 'training-school'], ['tutoring', 'Tutoring', 'training-school'],
    ['music-lessons', 'Music lessons', 'training-school'], ['driving-school', 'Driving school', 'training-school'],
    ['childcare', 'Child care or daycare'], ['preschool', 'Preschool'], ['private-school', 'Private school', 'training-school'],
    ['cpr-training', 'Safety or CPR training', 'training-school'], ['online-course', 'Online courses', 'training-school'],
  ],
  'Community, faith and nonprofit': [
    ['nonprofit', 'Nonprofit', 'nonprofit'], ['charity', 'Charity or foundation', 'nonprofit'], ['church', 'Church or ministry', 'nonprofit'],
    ['community-org', 'Community organization', 'nonprofit'], ['youth-program', 'Youth program', 'nonprofit'],
    ['reentry', 'Reentry services', 'reentry'], ['food-bank', 'Food bank or pantry', 'nonprofit'], ['association', 'Association or club', 'nonprofit'],
  ],
  'Transportation and logistics': [
    ['trucking', 'Trucking', 'trucking'], ['owner-operator', 'Owner-operator', 'trucking'], ['freight', 'Freight or logistics', 'trucking'],
    ['courier', 'Courier or delivery', 'trucking'], ['towing', 'Towing', 'trucking'], ['limo', 'Limo or car service', 'trucking'],
    ['hotshot', 'Hotshot hauling', 'trucking'],
  ],
  'Energy and industrial': [
    ['oilfield', 'Oilfield services', 'oilfield'], ['well-service', 'Well service', 'oilfield'], ['pipeline', 'Pipeline work', 'oilfield'],
    ['environmental', 'Environmental services', 'specialized'], ['heavy-equipment', 'Heavy equipment', 'specialized'],
    ['manufacturing', 'Manufacturing', 'specialized'], ['drone', 'Drone services', 'specialized'], ['inspection', 'Industrial inspection', 'specialized'],
  ],
  Automotive: [
    ['auto-repair', 'Auto repair'], ['auto-detailing', 'Auto detailing'], ['body-shop', 'Body shop'], ['tires', 'Tire shop'],
    ['car-dealer', 'Car dealer'], ['mobile-mechanic', 'Mobile mechanic', 'service', 'service-van'], ['car-wash', 'Car wash'],
  ],
  'Retail and shops': [
    ['boutique', 'Clothing boutique'], ['gift-shop', 'Gift shop'], ['florist', 'Florist'], ['jewelry', 'Jewelry'],
    ['furniture', 'Furniture'], ['hardware', 'Hardware store'], ['thrift', 'Thrift or resale'], ['cannabis', 'Cannabis dispensary', 'cannabis'],
    ['smoke-shop', 'Smoke shop'], ['online-store', 'Online store'], ['handmade', 'Handmade goods'], ['beauty-supply', 'Beauty supply'],
  ],
  'Events, arts and media': [
    ['photographer', 'Photographer'], ['videographer', 'Videographer'], ['dj', 'DJ'], ['event-planner', 'Event planner'],
    ['event-venue', 'Event venue'], ['party-rentals', 'Party rentals'], ['musician', 'Musician or band'], ['artist', 'Artist or gallery'],
    ['recording-studio', 'Recording studio'], ['podcast', 'Podcast or media'], ['wedding', 'Wedding services'],
  ],
  'Pets and animals': [
    ['pet-grooming', 'Pet grooming'], ['dog-training', 'Dog training'], ['pet-sitting', 'Pet sitting or dog walking'],
    ['veterinarian', 'Veterinarian'], ['boarding', 'Pet boarding'], ['farm', 'Farm or ranch'],
  ],
  Other: [
    ['other', 'Something else'],
  ],
}

export const INDUSTRIES: readonly Industry[] = (Object.entries(ROWS) as [IndustryGroup, Row[]][]).flatMap(([group, rows]) =>
  rows.map(([id, label, kit = 'service', photo]) => ({ id, label, group, kit, ...(photo ? { photo } : {}) })),
)

const BY_ID = new Map(INDUSTRIES.map((i) => [i.id, i]))

export function industryById(id: string | undefined | null): Industry | undefined {
  return id ? BY_ID.get(id) : undefined
}
