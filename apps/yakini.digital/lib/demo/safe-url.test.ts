import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isBlockedIp, isBlockedIpv4, isSafePublicLogoUrl, sanitizePublicHttpUrl } from './safe-url.ts'

describe('sanitizePublicHttpUrl', () => {
  it('accepts a normal public https URL and adds https when missing', () => {
    const a = sanitizePublicHttpUrl('https://www.example.com/menu')
    assert.equal(a.ok, true)
    if (a.ok) assert.equal(a.url.hostname, 'www.example.com')

    const b = sanitizePublicHttpUrl('joespizza.com')
    assert.equal(b.ok, true)
    if (b.ok) {
      assert.equal(b.url.protocol, 'https:')
      assert.equal(b.url.hostname, 'joespizza.com')
    }
  })

  it('blocks credentials, odd ports, and non-http schemes', () => {
    assert.equal(sanitizePublicHttpUrl('https://user:pass@example.com').ok, false)
    assert.equal(sanitizePublicHttpUrl('https://example.com:8080').ok, false)
    assert.equal(sanitizePublicHttpUrl('file:///etc/passwd').ok, false)
    assert.equal(sanitizePublicHttpUrl('javascript:alert(1)').ok, false)
    assert.equal(sanitizePublicHttpUrl('ftp://example.com').ok, false)
  })

  it('blocks localhost, internal hosts, and single-label names', () => {
    for (const raw of [
      'http://localhost',
      'https://localhost/admin',
      'http://127.0.0.1',
      'https://[::1]/',
      'http://metadata.google.internal/',
      'https://site.local',
      'https://intranet',
      'http://kubernetes.default.svc',
    ]) {
      const result = sanitizePublicHttpUrl(raw)
      assert.equal(result.ok, false, raw)
    }
  })

  it('blocks private and metadata IPv4 literals, including decimal and hex forms', () => {
    for (const raw of [
      'http://10.0.0.4',
      'http://192.168.1.1',
      'http://172.16.0.1',
      'http://169.254.169.254/latest/meta-data',
      'http://0.0.0.0',
      'http://2130706433',
      'http://0x7f000001',
    ]) {
      const result = sanitizePublicHttpUrl(raw)
      assert.equal(result.ok, false, raw)
    }
  })

  it('blocks an empty or garbage value', () => {
    assert.equal(sanitizePublicHttpUrl('').ok, false)
    assert.equal(sanitizePublicHttpUrl('   ').ok, false)
    assert.equal(sanitizePublicHttpUrl('https://').ok, false)
  })
})

describe('isBlockedIp', () => {
  it('flags loopback, private, link-local, and IPv6 unique-local addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.9', '172.31.255.1', '169.254.169.254', '::1', 'fc00::1', 'fd12:3456::1', 'fe80::1', '::ffff:127.0.0.1']) {
      assert.equal(isBlockedIp(ip), true, ip)
    }
  })

  it('allows ordinary public IPv4 addresses', () => {
    assert.equal(isBlockedIpv4('1.1.1.1'), false)
    assert.equal(isBlockedIp('8.8.8.8'), false)
    assert.equal(isBlockedIp('93.184.216.34'), false)
  })
})

describe('isSafePublicLogoUrl', () => {
  const page = new URL('https://shop.example.com/about')
  it('resolves relative icons on the same public site', () => {
    assert.equal(isSafePublicLogoUrl('/logo.png', page), true)
    assert.equal(isSafePublicLogoUrl('https://cdn.example.com/logo.svg', page), true)
  })
  it('rejects private or non-http logo targets', () => {
    assert.equal(isSafePublicLogoUrl('http://127.0.0.1/logo.png', page), false)
    assert.equal(isSafePublicLogoUrl('data:image/png;base64,aaa', page), false)
    assert.equal(isSafePublicLogoUrl('javascript:alert(1)', page), false)
  })
})
