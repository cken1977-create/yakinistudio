import type { KitId } from '@/lib/pricing'

export type PreviewStat = { label: string; value: string; hint?: string }
export type PreviewRow = { title: string; meta: string; status: string }
export type PreviewKind = 'list' | 'orders' | 'menu'

export type PreviewPane = {
  id: string
  label: string
  stats: PreviewStat[]
  tableTitle: string
  rows: PreviewRow[]
  kind?: PreviewKind
}

export type KitPreview = {
  nav: PreviewPane[]
  note: string
  tourUrl?: string
  tourLabel?: string
}

const SAMPLE = 'SAMPLE DATA'

export const PREVIEW_BANNER = 'SAMPLE DATA — this is a preview of your kit, not a live account.'

function S(label: string, value: string): PreviewStat {
  return { label, value, hint: SAMPLE }
}

function pane(
  id: string,
  label: string,
  tableTitle: string,
  rows: PreviewRow[],
  stats: PreviewStat[],
  kind: PreviewKind = 'list',
): PreviewPane {
  return { id, label, tableTitle, rows, stats, kind }
}

const PREVIEWS: Record<KitId, KitPreview> = {
  'food-truck': {
    tourUrl: 'https://yakini-foodtruck-demo.vercel.app',
    tourLabel: 'Open the full food truck walkthrough',
    note: 'Tap a tab to move around the kit — orders, the menu, and this week’s stops all use sample data in your brand.',
    nav: [
      pane('today', 'Today', 'Recent orders', [
        { title: 'Two brisket plates, one lemonade', meta: 'Walk-up · 12:14 p.m.', status: 'Ready' },
        { title: 'Family taco pack', meta: 'Pay-ahead · 12:08 p.m.', status: 'In the window' },
        { title: 'Three tacos, agua fresca', meta: 'Walk-up · 11:57 a.m.', status: 'Picked up' },
      ], [S('Today’s sales', '$1,284'), S('Orders', '18'), S('Next stop', 'Sat market, 11–3')], 'orders'),
      pane('orders', 'Orders', 'Open tickets', [
        { title: 'Brisket plate + lemonade', meta: 'Window 1 · just now', status: 'New' },
        { title: 'Four tacos, no onion', meta: 'Pay-ahead · 12:21 p.m.', status: 'In the window' },
        { title: 'Catering tray, Saturday', meta: 'Due Sat 11 a.m.', status: 'Scheduled' },
        { title: 'Quesadilla + agua fresca', meta: 'Walk-up · 12:05 p.m.', status: 'Ready' },
      ], [S('Waiting', '3'), S('Ready', '2'), S('Catering ahead', '1')], 'orders'),
      pane('menu', 'Menu', 'Today’s menu', [
        { title: 'Brisket plate', meta: '$16 · 11 left', status: 'On the board' },
        { title: 'Street tacos (3)', meta: '$11 · selling', status: 'On the board' },
        { title: 'Quesadilla', meta: '$9 · 4 left', status: 'Low' },
        { title: 'Lemonade', meta: '$3 · sold out at the last stop', status: 'Sold out' },
      ], [S('Items live', '3'), S('Sold out', '1'), S('86’d today', 'Lemonade')], 'menu'),
      pane('stops', 'Stops', 'This week’s stops', [
        { title: 'Saturday grower market', meta: '11 a.m.–3 p.m. · Downtown lot', status: 'Confirmed' },
        { title: 'Tuesday lunch service', meta: '11 a.m.–2 p.m. · Civic plaza', status: 'Posted' },
        { title: 'Thursday office park', meta: '11 a.m.–1:30 p.m. · Mesa offices', status: 'Hold' },
      ], [S('Stops this week', '3'), S('Next', 'Saturday'), S('Permit', 'Current')], 'list'),
    ],
  },
  restaurant: {
    tourUrl: 'https://mommasallys-demo.vercel.app',
    tourLabel: 'Open the full restaurant walkthrough',
    note: 'Walk the floor, reservations, menu, and orders. Everything here is sample data in your brand.',
    nav: [
      pane('floor', 'Floor', 'Tables right now', [
        { title: 'Table 4 — patio', meta: 'Garcia, party of 4 · seated 6:15', status: 'Seated' },
        { title: 'Table 9 — window', meta: 'Open · 2 top', status: 'Open' },
        { title: 'Table 12 — main', meta: 'Ellis, party of 6 · due 7:30', status: 'Reserved' },
      ], [S('Covers tonight', '64'), S('Open tables', '7'), S('Wait list', '3')], 'list'),
      pane('reservations', 'Reservations', 'Tonight’s reservations', [
        { title: 'Garcia, party of 4', meta: '6:15 p.m. · Patio', status: 'Seated' },
        { title: 'Nguyen, party of 2', meta: '6:45 p.m. · Window', status: 'Confirmed' },
        { title: 'Ellis, party of 6', meta: '7:30 p.m. · Main', status: 'Confirmed' },
      ], [S('Reservations left', '11'), S('Seated', '8'), S('No-shows', '0')], 'list'),
      pane('menu', 'Menu', 'Floor menu', [
        { title: 'Brisket plate', meta: 'Dinner · $24', status: 'On the menu' },
        { title: 'Green chile stew', meta: 'Dinner · $16', status: 'On the menu' },
        { title: 'Peach cobbler', meta: 'Dessert · $8', status: 'Low' },
      ], [S('Live items', '18'), S('86’d', '0'), S('Specials', '2')], 'menu'),
      pane('orders', 'Orders', 'Kitchen tickets', [
        { title: 'Table 4 — two stews, cobbler', meta: 'Fired 6:22 p.m.', status: 'Firing' },
        { title: 'Takeout — brisket plate', meta: 'Pay-ahead · 6:18 p.m.', status: 'Ready' },
        { title: 'Table 2 — salads', meta: 'Fired 6:10 p.m.', status: 'Picked up' },
      ], [S('Tickets open', '5'), S('Ready', '2'), S('Avg ticket', '14 min')], 'orders'),
    ],
  },
  landlord: {
    tourUrl: 'https://yakini-landlord-demo.vercel.app',
    tourLabel: 'Open the full landlord walkthrough',
    note: 'Click through units, rent, work orders, and tenants. Sample data only, shown in your brand.',
    nav: [
      pane('units', 'Units', 'Unit board', [
        { title: 'Unit 4B — 2 bed', meta: 'Occupied · lease through July', status: 'Occupied' },
        { title: 'Unit 1A — 1 bed', meta: 'Occupied · work order open', status: 'Occupied' },
        { title: 'Unit 2C — 2 bed', meta: 'Notice given · showing Friday', status: 'Notice' },
      ], [S('Occupied', '9 of 10'), S('Vacant soon', '1'), S('Inspections due', '2')], 'list'),
      pane('rent', 'Rent', 'This month’s rent', [
        { title: 'Unit 4B — posted $1,250', meta: 'Paid May 1', status: 'Paid' },
        { title: 'Unit 1A — posted $980', meta: 'Paid May 3', status: 'Paid' },
        { title: 'Unit 6D — posted $1,150', meta: 'Still due', status: 'Due' },
      ], [S('Rent still due', '$2,150'), S('Collected', '$9,840'), S('Late', '1')], 'list'),
      pane('work', 'Work orders', 'Open work orders', [
        { title: 'Unit 4B — dripping faucet', meta: 'Reported yesterday', status: 'Scheduled' },
        { title: 'Unit 1A — dryer not heating', meta: 'Reported Monday', status: 'Parts ordered' },
        { title: 'Common hall — light out', meta: 'Reported today', status: 'New' },
      ], [S('Open work orders', '3'), S('Vendors out', '1'), S('New today', '1')], 'orders'),
      pane('tenants', 'Tenants', 'Resident directory', [
        { title: 'Maya Chen — 4B', meta: 'Lease ends July 31 · portal on', status: 'Current' },
        { title: 'Luis Ortega — 1A', meta: 'Open work order · dryer', status: 'Current' },
        { title: 'Priya Shah — 2C', meta: 'Notice given · June 30', status: 'Moving' },
      ], [S('Residents', '9'), S('Portal invites', '9'), S('Notices', '1')], 'list'),
    ],
  },
  'real-estate': {
    tourUrl: 'https://yakini-realestate-demo.vercel.app',
    tourLabel: 'Open the full real estate walkthrough',
    note: 'Switch between listings, showings, leads, and clients. This is sample data in your brand.',
    nav: [
      pane('listings', 'Listings', 'Active listings', [
        { title: '1842 Maple Ave — 3 bed', meta: '$425,000 · 8 days on market', status: 'Active' },
        { title: '22 Mesa Court — townhome', meta: '$310,000 · offer pending', status: 'Pending' },
        { title: '90 Rio Grande — condo', meta: '$289,000 · open house Sunday', status: 'Active' },
      ], [S('Active listings', '6'), S('Pending', '1'), S('New this week', '2')], 'list'),
      pane('showings', 'Showings', 'Upcoming showings', [
        { title: '1842 Maple Ave — 3 bed', meta: 'Tomorrow, 4:00 p.m.', status: 'Confirmed' },
        { title: '22 Mesa Court — townhome', meta: 'Thursday, 11:30 a.m.', status: 'Pending' },
        { title: '90 Rio Grande — condo', meta: 'Friday, 5:15 p.m.', status: 'Confirmed' },
      ], [S('Showings this week', '9'), S('Confirmed', '7'), S('Feedback due', '2')], 'list'),
      pane('leads', 'Leads', 'New inquiries', [
        { title: 'Jordan Hale — Maple Ave', meta: 'Form last night · first-time buyer', status: 'New' },
        { title: 'Ana Ruiz — Mesa Court', meta: 'Text this morning', status: 'Contacted' },
        { title: 'Chris Bell — buyer consult', meta: 'Referral · Thursday call', status: 'Booked' },
      ], [S('New leads', '4'), S('To call', '2'), S('Booked', '1')], 'orders'),
      pane('clients', 'Clients', 'Active clients', [
        { title: 'The Nguyen family', meta: 'Buying · pre-approved to $400k', status: 'Active' },
        { title: 'Sam Ortiz', meta: 'Selling Maple Ave', status: 'Listed' },
        { title: 'Rivera Trust', meta: 'Buying and selling', status: 'Active' },
      ], [S('Buyers', '5'), S('Sellers', '3'), S('Closes this month', '1')], 'list'),
    ],
  },
  'tree-lawn': {
    note: 'Walk today’s jobs, crews, estimates, and the week’s schedule. Sample data only, in your brand.',
    nav: [
      pane('jobs', 'Jobs', 'Today’s jobs', [
        { title: 'Oak trim, 14 Pine St', meta: 'Crew A · 8:00 a.m.', status: 'On site' },
        { title: 'Spring clean-up, 3 lots', meta: 'Crew B · 9:30 a.m.', status: 'En route' },
        { title: 'Stump grind, 88 Adobe', meta: 'Crew A · 1:00 p.m.', status: 'Scheduled' },
      ], [S('Jobs today', '5'), S('Done', '1'), S('Weather', 'Clear')], 'orders'),
      pane('crews', 'Crews', 'Crew board', [
        { title: 'Crew A — Mesa', meta: 'Oak trim now · stump grind at 1', status: 'On site' },
        { title: 'Crew B — North valley', meta: 'Spring clean-up, 3 lots', status: 'En route' },
        { title: 'Crew C — off today', meta: 'Back tomorrow', status: 'Off' },
      ], [S('Crews out', '2'), S('Available tomorrow', '3'), S('Trucks out', '2')], 'list'),
      pane('estimates', 'Estimates', 'Estimates waiting', [
        { title: 'Large ash, 220 Rio', meta: 'Sent Monday · not opened', status: 'Sent' },
        { title: 'Hedge row, office park', meta: 'Opened yesterday', status: 'Opened' },
        { title: 'Storm cleanup, 9 Cedar', meta: 'Approved this morning', status: 'Approved' },
      ], [S('Estimates waiting', '6'), S('Approved today', '1'), S('Unopened', '2')], 'list'),
      pane('schedule', 'Schedule', 'This week', [
        { title: 'Tuesday — two trim jobs', meta: 'Crew A and B', status: 'Booked' },
        { title: 'Wednesday — estimates only', meta: 'Office + one climber', status: 'Light' },
        { title: 'Friday — stump day', meta: 'Crew A · three stops', status: 'Booked' },
      ], [S('Jobs this week', '14'), S('Open slots', '3'), S('Next free window', 'Thu p.m.')], 'list'),
    ],
  },
  nonprofit: {
    tourUrl: 'https://vizionz-sankofa-demo.vercel.app',
    tourLabel: 'Open the full nonprofit walkthrough',
    note: 'Look through programs, donors, volunteers, and events. Sample data, in your brand.',
    nav: [
      pane('programs', 'Programs', 'Active programs', [
        { title: 'Saturday meal service', meta: '6 volunteer spots left', status: 'Open' },
        { title: 'Youth mentoring', meta: '18 matched pairs', status: 'Running' },
        { title: 'Family intake', meta: '4 appointments this week', status: 'Open' },
      ], [S('Programs', '4'), S('Families served', '62'), S('Open slots', '6')], 'list'),
      pane('donors', 'Donors', 'Recent gifts and sign-ups', [
        { title: 'Monthly gift — $50', meta: 'Jordan P. · yesterday', status: 'Thanked' },
        { title: 'Spring drive donation', meta: 'Anonymous · Monday', status: 'Recorded' },
        { title: 'Workplace match — $250', meta: 'Pending employer', status: 'Pending' },
      ], [S('Gifts this month', '$8,420'), S('New donors', '11'), S('Thanks due', '2')], 'list'),
      pane('volunteers', 'Volunteers', 'Volunteer roster', [
        { title: 'Alex Kim', meta: 'Saturday meals · confirmed', status: 'Confirmed' },
        { title: 'Priya Nair', meta: 'Mentoring · needs a sub Friday', status: 'Need cover' },
        { title: 'Luis Mora', meta: 'Intake desk · trained', status: 'Active' },
      ], [S('Active volunteers', '27'), S('Shifts this week', '14'), S('Gaps', '1')], 'list'),
      pane('events', 'Events', 'Upcoming events', [
        { title: 'Saturday meal service', meta: 'This Saturday, 11 a.m.', status: 'Staffed' },
        { title: 'Spring drive kickoff', meta: 'May 12 · community hall', status: 'Planning' },
        { title: 'Board meeting', meta: 'May 20, 6 p.m.', status: 'Booked' },
      ], [S('Upcoming events', '3'), S('Need volunteers', '1'), S('This week', '1')], 'list'),
    ],
  },
  'training-school': {
    tourUrl: 'https://abc-prep-demo.vercel.app',
    tourLabel: 'Open the full training-school walkthrough',
    note: 'Click students, classes, tuition, and the week’s schedule. Sample data in your brand.',
    nav: [
      pane('students', 'Students', 'Active students', [
        { title: 'Jordan Hale — Cohort B', meta: 'Intro to electrical · 82% attendance', status: 'Active' },
        { title: 'Sam Ortiz — Welding lab', meta: 'Tuition due Friday', status: 'Due' },
        { title: 'Maya Chen — Safety refresh', meta: 'Completes Friday', status: 'Active' },
      ], [S('Active students', '42'), S('New this month', '6'), S('At risk', '2')], 'list'),
      pane('classes', 'Classes', 'This week’s classes', [
        { title: 'Intro to electrical — Cohort B', meta: 'Mon / Wed · 18 enrolled', status: 'In session' },
        { title: 'Welding lab', meta: 'Tue / Thu · 12 enrolled', status: 'Open seats' },
        { title: 'Safety refresh', meta: 'Friday morning · 22 enrolled', status: 'Scheduled' },
      ], [S('Classes this week', '8'), S('Open seats', '4'), S('Instructors', '5')], 'list'),
      pane('tuition', 'Tuition', 'Tuition board', [
        { title: 'Sam Ortiz — $450', meta: 'Due Friday', status: 'Due' },
        { title: 'Cohort B — 16 paid', meta: 'Term 2 invoices', status: 'Current' },
        { title: 'Payment plan — 3 students', meta: 'Next draft Monday', status: 'Scheduled' },
      ], [S('Tuition due', '$3,600'), S('Collected this week', '$2,100'), S('Plans', '3')], 'list'),
      pane('schedule', 'Schedule', 'Week at a glance', [
        { title: 'Monday — Cohort B lecture', meta: 'Room 2 · 9 a.m.', status: 'Set' },
        { title: 'Tuesday — Welding lab', meta: 'Shop · 8 a.m.', status: 'Set' },
        { title: 'Friday — Safety refresh', meta: 'Hall · 9 a.m.', status: 'Set' },
      ], [S('Sessions', '8'), S('Room conflicts', '0'), S('Subs needed', '0')], 'list'),
    ],
  },
  trucking: {
    tourUrl: 'https://yakini-transport-demo.vercel.app',
    tourLabel: 'Open the full trucking walkthrough',
    note: 'Follow loads, trucks, drivers, and settlements. Sample data, shown in your brand.',
    nav: [
      pane('loads', 'Loads', 'Active loads', [
        { title: 'Albuquerque → Denver', meta: 'Truck 12 · ETA 4:40 p.m.', status: 'En route' },
        { title: 'El Paso → Phoenix', meta: 'Truck 7 · pickup 2:00 p.m.', status: 'At shipper' },
        { title: 'Santa Fe → Dallas', meta: 'Truck 3 · tomorrow 6:00 a.m.', status: 'Dispatched' },
      ], [S('Loads in motion', '4'), S('Deliveries today', '2'), S('Waiting on POD', '1')], 'orders'),
      pane('trucks', 'Trucks', 'Fleet board', [
        { title: 'Truck 12', meta: 'Denver run · inspection current', status: 'On the road' },
        { title: 'Truck 7', meta: 'Phoenix pickup', status: 'At shipper' },
        { title: 'Truck 5', meta: 'Yard · available', status: 'Available' },
      ], [S('Trucks available', '1'), S('On the road', '3'), S('Shop', '0')], 'list'),
      pane('drivers', 'Drivers', 'Driver board', [
        { title: 'Chris Alvarez', meta: 'Truck 12 · hours OK', status: 'Driving' },
        { title: 'Nina Brooks', meta: 'Truck 7 · on duty', status: 'On duty' },
        { title: 'Omar Singh', meta: 'Home time through tonight', status: 'Off' },
      ], [S('On duty', '3'), S('Available tomorrow', '2'), S('HOS alerts', '0')], 'list'),
      pane('pay', 'Settlements', 'Recent settlements', [
        { title: 'Week 18 — Chris Alvarez', meta: '$1,842 · ready to send', status: 'Ready' },
        { title: 'Week 18 — Nina Brooks', meta: '$1,610 · review', status: 'Review' },
        { title: 'Week 17 — Omar Singh', meta: 'Paid Monday', status: 'Paid' },
      ], [S('To review', '1'), S('Ready', '1'), S('Paid last week', '3')], 'list'),
    ],
  },
  oilfield: {
    tourUrl: 'https://yakini-oilfield-demo.vercel.app',
    tourLabel: 'Open the full oilfield walkthrough',
    note: 'Tickets, crews, equipment, and sites — click a tab to look around. Sample data in your brand.',
    nav: [
      pane('tickets', 'Tickets', 'Field tickets', [
        { title: 'Well site 14 — pump check', meta: 'Crew A · this morning', status: 'On site' },
        { title: 'Lease road repair', meta: 'Crew B · scheduled 1 p.m.', status: 'Queued' },
        { title: 'Tank battery inspect', meta: 'Crew A · tomorrow', status: 'Planned' },
      ], [S('Open tickets', '7'), S('Closed yesterday', '4'), S('Awaiting sign-off', '2')], 'orders'),
      pane('crews', 'Crews', 'Crew status', [
        { title: 'Crew A', meta: 'Site 14 · pump check', status: 'On site' },
        { title: 'Crew B', meta: 'Lease road at 1 p.m.', status: 'Staging' },
        { title: 'Crew C', meta: 'Travel day', status: 'Travel' },
      ], [S('Crews in the field', '2'), S('Available tomorrow', '1'), S('Overtime risk', '0')], 'list'),
      pane('equipment', 'Equipment', 'Equipment board', [
        { title: 'Pump unit 4', meta: 'Site 14 · running', status: 'In use' },
        { title: 'Vac truck 2', meta: 'Yard · ready', status: 'Ready' },
        { title: 'Light plant 1', meta: 'Shop — starter', status: 'Down' },
      ], [S('Equipment down', '1'), S('In the field', '6'), S('In shop', '1')], 'list'),
      pane('sites', 'Sites', 'Active sites', [
        { title: 'Well site 14', meta: 'Pump check in progress', status: 'Active' },
        { title: 'Lease road, north fence', meta: 'Repair today', status: 'Scheduled' },
        { title: 'Tank battery C', meta: 'Inspect tomorrow', status: 'Planned' },
      ], [S('Active sites', '3'), S('Permits current', 'Yes'), S('Handoffs', '1')], 'list'),
    ],
  },
  specialized: {
    note: 'A working operations desk for jobs, crew, invoices, and clients. Sample data in your brand.',
    nav: [
      pane('jobs', 'Jobs', 'This week’s work', [
        { title: 'Site walk-through, North yard', meta: 'Tomorrow, 9:00 a.m.', status: 'Confirmed' },
        { title: 'Equipment install, Building C', meta: 'Wednesday · all day', status: 'Scheduled' },
        { title: 'Follow-up visit, Mesa client', meta: 'Friday, 2:00 p.m.', status: 'To confirm' },
      ], [S('Jobs this week', '8'), S('Confirmed', '5'), S('To confirm', '1')], 'orders'),
      pane('crew', 'Crew', 'Crew board', [
        { title: 'Lead — Dana West', meta: 'North yard tomorrow', status: 'Booked' },
        { title: 'Tech — Evan Cole', meta: 'Building C Wednesday', status: 'Booked' },
        { title: 'Apprentice — open Friday', meta: 'Available', status: 'Open' },
      ], [S('Booked tomorrow', '2'), S('Open Friday', '1'), S('Sub needed', '0')], 'list'),
      pane('invoices', 'Invoices', 'Open invoices', [
        { title: 'North yard deposit', meta: '$1,200 · sent Monday', status: 'Sent' },
        { title: 'Building C progress', meta: '$2,400 · due Friday', status: 'Due' },
        { title: 'Mesa client closeout', meta: '$2,810 · paid', status: 'Paid' },
      ], [S('Invoices open', '$6,410'), S('Due this week', '1'), S('Paid', '1')], 'list'),
      pane('clients', 'Clients', 'Client list', [
        { title: 'North yard LLC', meta: 'Walk-through tomorrow', status: 'Active' },
        { title: 'Building C owner', meta: 'Install Wednesday', status: 'Active' },
        { title: 'Mesa client', meta: 'Follow-up Friday', status: 'Active' },
      ], [S('Active clients', '11'), S('New this month', '2'), S('Follow-ups', '3')], 'list'),
    ],
  },
  cannabis: {
    note: 'Cannabis kits are quoted individually. This is a sample desk only, not a live account.',
    nav: [
      pane('overview', 'Overview', 'What we would confirm on a quote', [
        { title: 'Licensing and operating requirements', meta: 'Reviewed with you', status: 'Quote' },
        { title: 'Intake and customer records', meta: 'Scoped to your operation', status: 'Quote' },
        { title: 'Dashboard and staff logins', meta: 'Set after the written quote', status: 'Quote' },
      ], [S('Quoted individually', 'Yes'), S('Published monthly price', 'Quote only'), S('Next step', 'Talk with us')], 'list'),
      pane('intake', 'Intake', 'Sample intake flow', [
        { title: 'New buyer record', meta: 'License check · sample', status: 'Sample' },
        { title: 'Daily intake log', meta: 'Three entries · sample', status: 'Sample' },
      ], [S('Sample only', 'Yes'), S('Live intake', 'After setup'), S('Next step', 'Written quote')], 'list'),
      pane('compliance', 'Compliance', 'Sample compliance items', [
        { title: 'License calendar', meta: 'Reminders after go-live', status: 'Quote' },
        { title: 'Daily checks', meta: 'Scoped on the quote', status: 'Quote' },
      ], [S('Sample only', 'Yes'), S('Live checks', 'After setup'), S('Next step', 'Written quote')], 'list'),
      pane('clients', 'Clients', 'Sample accounts', [
        { title: 'Dispensary account (sample)', meta: 'Not a live customer', status: 'Sample' },
      ], [S('Sample only', 'Yes'), S('Live clients', 'After setup'), S('Next step', 'Written quote')], 'list'),
    ],
  },
  'home-healthcare': {
    note: 'Home healthcare is quote-only and is not sold until this kit is built. This preview is sample data only.',
    nav: [
      pane('overview', 'Overview', 'What a finished kit would cover', [
        { title: 'Visit schedules and staff logins', meta: 'Once the kit is built', status: 'Not sold yet' },
        { title: 'Family updates and records', meta: 'Once the kit is built', status: 'Not sold yet' },
        { title: 'Billing follow-up', meta: 'Once the kit is built', status: 'Not sold yet' },
      ], [S('Kit status', 'Not sold yet'), S('Pricing', 'Quote only'), S('Next step', 'Talk with us')], 'list'),
      pane('care', 'Care', 'Sample care board', [
        { title: 'Morning visits (sample)', meta: 'Shown so you can look around', status: 'Sample' },
      ], [S('Sample only', 'Yes'), S('Live visits', 'Once built'), S('Next step', 'Talk with us')], 'list'),
      pane('staff', 'Staff', 'Sample staff board', [
        { title: 'Care team (sample)', meta: 'Not a live roster', status: 'Sample' },
      ], [S('Sample only', 'Yes'), S('Live roster', 'Once built'), S('Next step', 'Talk with us')], 'list'),
      pane('visits', 'Visits', 'Sample visit list', [
        { title: 'Today’s visits (sample)', meta: 'Not a live schedule', status: 'Sample' },
      ], [S('Sample only', 'Yes'), S('Live schedule', 'Once built'), S('Next step', 'Talk with us')], 'list'),
    ],
  },
  reentry: {
    note: 'Reentry is quote-only and is not sold until this kit is built. This preview is sample data only.',
    nav: [
      pane('overview', 'Overview', 'What a finished kit would cover', [
        { title: 'Program enrollment', meta: 'Once the kit is built', status: 'Not sold yet' },
        { title: 'Check-ins and follow-up', meta: 'Once the kit is built', status: 'Not sold yet' },
        { title: 'Partner referrals', meta: 'Once the kit is built', status: 'Not sold yet' },
      ], [S('Kit status', 'Not sold yet'), S('Pricing', 'Quote only'), S('Next step', 'Talk with us')], 'list'),
      pane('programs', 'Programs', 'Sample programs', [
        { title: 'Program board (sample)', meta: 'Not a live caseload', status: 'Sample' },
      ], [S('Sample only', 'Yes'), S('Live programs', 'Once built'), S('Next step', 'Talk with us')], 'list'),
      pane('people', 'People', 'Sample roster', [
        { title: 'Participant list (sample)', meta: 'Not live records', status: 'Sample' },
      ], [S('Sample only', 'Yes'), S('Live records', 'Once built'), S('Next step', 'Talk with us')], 'list'),
      pane('partners', 'Partners', 'Sample partners', [
        { title: 'Referral partners (sample)', meta: 'Not a live directory', status: 'Sample' },
      ], [S('Sample only', 'Yes'), S('Live directory', 'Once built'), S('Next step', 'Talk with us')], 'list'),
    ],
  },
}

export function previewFor(kitId: KitId | undefined): KitPreview {
  return PREVIEWS[kitId || 'food-truck']
}

export type AddonCard = { id: string; title: string; detail: string }

export function addonCards(items: string[]): AddonCard[] {
  const cards: AddonCard[] = []
  if (items.includes('website-simple') || items.includes('website-custom')) {
    cards.push({
      id: 'website',
      title: 'Public website',
      detail: items.includes('website-custom')
        ? 'A custom public site is quoted separately and shown here as a placeholder.'
        : 'A template website, in your brand, up to 5 pages. You pick the type; we build from that template.',
    })
  }
  if (items.includes('ordering')) {
    cards.push({
      id: 'ordering',
      title: 'Pay-ahead orders',
      detail: 'Sample: 3 pay-ahead orders waiting at the window, paid on your own payment account.',
    })
  }
  if (items.includes('receptionist')) {
    cards.push({
      id: 'receptionist',
      title: 'Phone receptionist',
      detail: 'Sample: 4 missed-call texts sent back this morning, with two transfers to you.',
    })
  }
  if (items.includes('course-portal')) {
    cards.push({
      id: 'course',
      title: 'Course portal',
      detail: 'Sample: 18 students with lessons in progress. A practice tutorial, when one exists, is included.',
    })
  }
  if (items.includes('ecommerce')) {
    cards.push({
      id: 'store',
      title: 'Catalog and checkout',
      detail: 'Sample: 12 items in a small catalog, checkout on your payment account.',
    })
  }
  if (items.includes('business-setup')) {
    cards.push({
      id: 'setup',
      title: 'Business Setup',
      detail: '$495 plus state filing fees. Yakini covers the first year of the domain and activation fees.',
    })
  }
  if (items.includes('qr-menu')) {
    cards.push({
      id: 'qr',
      title: 'QR codes',
      detail: 'Sample: print-ready codes linking to your menu, booking, or ordering page.',
    })
  }
  return cards
}
