import type { BrandConfig } from '@yakini/config'
import { EXAMPLE_CONFIG } from '@yakini/config'

// The template defaults to the example config (Chef Jada).
// When this file is copied into apps/[client-name]/config/brand.ts,
// it gets fully customized for that client.
export const config: BrandConfig = EXAMPLE_CONFIG
