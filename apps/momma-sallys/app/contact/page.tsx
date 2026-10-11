import { redirect } from 'next/navigation'

// No public email or lead inbox yet — contact is phone/text, shown on home.
export default function ContactPage() {
  redirect('/#catering')
}
