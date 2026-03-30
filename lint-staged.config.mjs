export default {
  '*.{js,cjs,mjs}': (files) => {
    const packages = new Set(
      files
        .map(f => f.match(/packages\/([^/]+)/)?.[1])
        .filter(Boolean)
    )
    return [...packages].map(pkg => `pnpm lint:${pkg}`)
  }
}