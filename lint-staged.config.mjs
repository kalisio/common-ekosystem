import path from 'node:path'

export default {
  '*.{js,cjs,mjs}': (files) => {
    const packages = new Set(
      files
        .map(f => path.relative(process.cwd(), f).match(/^((?:packages|examples)\/[^/]+)\//)?.[1])
        .filter(Boolean)
    )
    if (packages.size === 0) return []
    const filters = [...packages].map(pkg => `--filter ./${pkg}`).join(' ')
    return `pnpm ${filters} lint`
  }
}