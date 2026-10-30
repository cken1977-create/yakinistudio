// Yakini Academy languages. To add a language: add it here, then add its copy to
// lib/academy/home-copy.ts and lib/academy/catalog.ts (TypeScript flags anything missing),
// and add the matching route folder under app/(academy)/.
export const ACADEMY_LOCALES = [
  { code: 'en', label: 'English', short: 'EN', home: '/academy', courses: '/academy/courses', freeClass: '/class', privacy: '/privacy' },
  { code: 'es', label: 'Español', short: 'ES', home: '/academia', courses: '/academia/cursos', freeClass: '/clase', privacy: '/privacy?lang=es' },
] as const

export type AcademyLocale = (typeof ACADEMY_LOCALES)[number]['code']
export const localeInfo = (code: AcademyLocale) => ACADEMY_LOCALES.find((l) => l.code === code)!
