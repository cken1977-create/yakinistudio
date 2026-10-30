import { CoursePage, courseMetadata, detailSlugs } from '@/components/academy-home/CoursePage'

export const dynamicParams = false
export const generateStaticParams = () => detailSlugs('es')

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return courseMetadata('es', (await params).slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <CoursePage lang="es" slug={(await params).slug} />
}
