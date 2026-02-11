import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    base: '/common-ekosystem/',
    title: 'common-ekosystem',
    description: '',
    ignoreDeadLinks: true,
    head: [
      ['link', { href: 'https://cdnjs.cloudflare.com/ajax/libs/line-awesome/1.3.0/line-awesome/css/line-awesome.min.css', rel: 'stylesheet' }],
      ['link', { rel: 'icon', href: 'https://kalisio.github.io/kalisioscope/kalisio/kalisio-icon-2048x2048.png' }]
    ],
    themeConfig: {
      logo: 'https://kalisio.github.io/kalisioscope/kalisio/kalisio-icon-2048x2048.png',
      socialLinks: [{ icon: 'github', link: 'https://github.com/kalisio/common-ekosystem' }],
      nav: [
        { text: 'About', link: '/about/introduction' }
        ,
        {
          text: 'Packages',
          items: [
            { text: 'check', link: '/packages/check/' },
            { text: 'geokit', link: '/packages/geokit/' },
            { text: 'graphiks', link: '/packages/graphiks/' }
          ]
        }
      ],
      sidebar: {
        '/about/': [
          { text: 'About', link: '/about/introduction' },
          { text: 'Contributing', link: '/about/contributing' },
          { text: 'License', link: '/about/license' },
          { text: 'Contact', link: '/about/contact' }
        ]
        ,
        '/check/': getSideBar('check'),
        '/geokit/': getSideBar('geokit'),
        '/graphiks/': getSideBar('graphiks')
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