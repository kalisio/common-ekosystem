import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { generateSideBar } from './sidebar.mjs'
import packages from './packages.json'

export const meta = {
  name: 'common-ekosystem',
  description: 'Reusable utility libraries for the Kalisio ecosystem',
  prefix: 'common'
}

const sortedPackagesNavBar = packages.sort().map(pkgName => {
  let fullPkgName = meta.prefix ? `${meta.prefix}-${pkgName}`: pkgName
  return { text: fullPkgName, link: `/packages/${pkgName}/` }
})

const sortedPackageSidebar = Object.fromEntries(
  packages.sort().map(pkgName => [`/packages/${pkgName}/`, generateSideBar(pkgName, meta.prefix)])
)

export default withMermaid(
  defineConfig({
    base: `/${meta.name}/`,
    title: meta.name,
    description: meta.description,
    ignoreDeadLinks: true,
    head: [
      ['link', { href: 'https://cdnjs.cloudflare.com/ajax/libs/line-awesome/1.3.0/line-awesome/css/line-awesome.min.css', rel: 'stylesheet' }],
      ['link', { rel: 'icon', href: 'https://kalisio.github.io/kalisioscope/kalisio/kalisio-icon-light-2048x2048.png' }]
    ],
    themeConfig: {
      logo: 'https://kalisio.github.io/kalisioscope/kalisio/kalisio-icon-light-2048x2048.png',
      socialLinks: [{ icon: 'github', link: `https://github.com/kalisio/${meta.name}` }],
      nav: [
        { text: 'Overview', link: '/overview/about' },
        {
          text: 'Packages',
          items: sortedPackagesNavBar
        }
      ],
      sidebar: {
        '/overview/': [
          { text: 'About', link: '/overview/about' },
          { text: 'Contributing', link: '/overview/contributing' },
          { text: 'Roadmap', link: '/overview/roadmap' },
          { text: 'Changelog', link: '/overview/changelog' },
          { text: 'License', link: '/overview/license' },
          { text: 'Contact', link: '/overview/contact' }
        ],
        ...sortedPackageSidebar
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
