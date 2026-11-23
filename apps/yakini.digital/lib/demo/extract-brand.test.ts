import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extractBrand, suggestKitFromText } from './extract-brand'

const HTML = `
<!doctype html>
<html>
<head>
  <title>Mesa Street Tacos | Best food truck in Albuquerque</title>
  <meta property="og:site_name" content="Mesa Street Tacos">
  <meta name="theme-color" content="#9A3412">
  <meta property="og:image" content="/share.jpg">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
</head>
<body><h1>Welcome</h1></body>
</html>`

describe('extractBrand', () => {
  it('pulls the site name, logo, and theme color from a public page', () => {
    const brand = extractBrand(HTML, new URL('https://mesastreet.example/'))
    assert.equal(brand.name, 'Mesa Street Tacos')
    assert.equal(brand.logoUrl, 'https://mesastreet.example/apple-touch-icon.png')
    assert.equal(brand.colors.primary, '#9A3412')
    assert.equal(brand.fetched, true)
    assert.equal(brand.suggestedKit, 'food-truck')
  })
})

describe('suggestKitFromText', () => {
  it('maps obvious industry wording to a kit', () => {
    assert.equal(suggestKitFromText('We are a property management company'), 'landlord')
    assert.equal(suggestKitFromText('Tree service and lawn care'), 'tree-lawn')
    assert.equal(suggestKitFromText('Nothing relevant here'), undefined)
  })
})

describe('business name cleaning', () => {
  it('decodes hex HTML entities and drops a · tagline', () => {
    const html = `<html><head><title>Momma Sally&#x27;s BBQ · your new system, step by step</title></head><body></body></html>`
    const brand = extractBrand(html, new URL('https://mommasallys-demo.vercel.app/'))
    assert.equal(brand.name, "Momma Sally's BBQ")
  })

  it('decodes decimal entities and drops taglines after |, -, or :', () => {
    const pipe = extractBrand(
      `<html><head><title>Adobe Court Apartments | Albuquerque rentals</title></head><body></body></html>`,
      new URL('https://adobecourt.example/'),
    )
    assert.equal(pipe.name, 'Adobe Court Apartments')
    const dash = extractBrand(
      `<html><head><title>Pine &amp; Mesa Realty - Homes for sale in Santa Fe</title></head><body></body></html>`,
      new URL('https://pinemesa.example/'),
    )
    assert.equal(dash.name, 'Pine & Mesa Realty')
    const colon = extractBrand(
      `<html><head><title>North Valley Tree: official site</title></head><body></body></html>`,
      new URL('https://nvtree.example/'),
    )
    assert.equal(colon.name, 'North Valley Tree')
  })
})
