import { CoursePage, courseMetadata, detailSlugs } from '@/components/academy-home/CoursePage'

export const dynamicParams = false
export const generateStaticParams = () => detailSlugs('en')

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return courseMetadata('en', (await params).slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <CoursePage lang="en" slug={(await params).slug} />
}
