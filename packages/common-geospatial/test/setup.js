import { Locales } from '@kalisio/common-core/runtime'
import { setup as setupCore } from '@kalisio/common-core/setup'
import { setup } from '../src/setup.js'

const locales = new Locales({ default: 'en', fallback: 'fr' })

setupCore({ locales })
setup({ locales })
