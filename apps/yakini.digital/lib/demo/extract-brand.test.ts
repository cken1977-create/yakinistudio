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
