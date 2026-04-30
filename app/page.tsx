import { Hero } from '@/components/sections/Hero'
import { Services } from '@/components/sections/Services'
import { Pricing } from '@/components/sections/Pricing'
import { IntakeForm } from '@/components/sections/IntakeForm'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Pricing />
      <IntakeForm />
    </>
  )
}
