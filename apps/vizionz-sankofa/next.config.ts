import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@yakini/ui', '@yakini/database', '@yakini/config'],
  serverExternalPackages: ['tiktoken', 'pdf-parse', 'mammoth']
}

export default config
