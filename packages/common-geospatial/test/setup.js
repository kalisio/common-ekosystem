import { setup as setupCore } from '@kalisio/common-core/setup'
import { setup } from '../src/setup.js'

setupCore({
  locales: { default: 'en', fallback: 'fr' }
})

setup()
