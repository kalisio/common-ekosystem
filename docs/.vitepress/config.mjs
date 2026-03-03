import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    base: '/common-ekosystem/',
    title: 'common-ekosystem',
    description: 'A common base of small, reusable utility libraries for the Kalisio ecosystem',
    ignoreDeadLinks: true,
    head: [
      ['link', { href: 'https://cdnjs.cloudflare.com/ajax/libs/line-awesome/1.3.0/line-awesome/css/line-awesome.min.css', rel: 'stylesheet' }],
      ['link', { rel: 'icon', href: 'https://kalisio.github.io/kalisioscope/kalisio/kalisio-icon-2048x2048.png' }]
    ],
    themeConfig: {
      logo: 'https://kalisio.github.io/kalisioscope/kalisio/kalisio-icon-2048x2048.png',
      socialLinks: [{ icon: 'github', link: 'https://github.com/kalisio/common-ekosystem' }],
      nav: [
        { text: 'Overview', link: '/overview/about' },
        {
          text: 'Packages',
          items: [
            { text: 'check', link: '/packages/check/' },
            { text: 'geokit', link: '/packages/geokit/' },
            { text: 'graphiks', link: '/packages/graphiks/' },
            { text: 'kompare', link: '/packages/kompare/' }
          ]
        }
      ],
      sidebar: {
        '/overview/': [
          { text: 'About', link: '/overview/about' },
          { text: 'Contributing', link: '/overview/contributing' },
          { text: 'License', link: '/overview/license' },
          { text: 'Contact', link: '/overview/contact' }
        ],
        '/packages/check/': [
          { text: 'Usage', link: '/packages/check/index' },
          { text: 'API', items: [
            { text: 'asserts', link: '/packages/check/asserts' },
            { text: 'conforms', link: '/packages/check/conforms' },
            { text: 'has', link: '/packages/check/has' },
            { text: 'is', link: '/packages/check/is' },
            { text: 'matches', link: '/packages/check/matches' }
          ]}
        ],
        '/packages/kompare/': [
          { text: 'Usage', link: '/packages/kompare/index' },
          { text: 'API', items: [
            { text: 'json', link: '/packages/kompare/json' },
            { text: 'text', link: '/packages/kompare/text' },
            { text: 'xml', link: '/packages/kompare/xml' },
            { text: 'yaml', link: '/packages/kompare/yaml' }
          ]}
        ],
        '/packages/geokit/': getSideBar('geokit'),
        '/packages/graphiks/': getSideBar('graphiks')
      },
      footer: {
        copyright: 'MIT Licensed | Copyright © 2026 Kalisio'
      }
    },
    vite: {
      optimizeDeps: {
        include: ['keycloak-js', 'lodash', 'dayjs', 'mermaid', 'cytoscape', 'cytoscape-cose-bilkent'],
      },
      ssr: {
        noExternal: ['vitepress-theme-kalisio', 'dayjs', 'mermaid', 'cytoscape', 'cytoscape-cose-bilkent']
      }
    }
  })
)

function getSideBar (pkg) {
  const pkgDir = path.resolve(process.cwd(), `docs/packages/${pkg}`)
  
  if (!fs.existsSync(pkgDir)) {
    return []
  }

  const files = fs.readdirSync(pkgDir)
  
  const items = files
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .map(file => {
      const name = file.replace('.md', '')
      return { text: name, link: `/packages/${pkg}/${name}` }
    })
    .sort((a, b) => a.text.localeCompare(b.text)) 

  return [
    { text: 'Usage', link: `/packages/${pkg}/index` },
    ...items
  ]
}