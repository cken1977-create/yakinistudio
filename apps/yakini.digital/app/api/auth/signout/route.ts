import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.redirect(
    new URL('/client/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://yakini.digital')
  )
  
  response.cookies.delete('yakini_client')
  
  return response
}
