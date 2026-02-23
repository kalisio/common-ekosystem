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
        { text: 'Overview', link: '/overview/about' }
        ,
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
        ]
        ,
        '/packages/check/': [
          { text: 'Usage', link: '/packages/check/index' },
          { text: 'API', items: [
            { text: 'assert', link: '/packages/check/assert' },
            { text: 'has', link: '/packages/check/has' },
            { text: 'is', link: '/packages/check/is' },
            { text: 'matches', link: '/packages/check/matches' }
          ]}
        ],
        '/pacakges/geokit/': getSideBar('geokit'),
        '/packages/graphiks/': getSideBar('graphiks'),
        '/packages/kompare/': getSideBar('kompare')
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
  // TODO
}