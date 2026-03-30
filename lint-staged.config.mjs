export default {
  '*.{js,cjs,mjs}': (files) => {
    const packages = new Set(
      files
        .map(f => f.match(/((?:packages|examples)\/[^/]+)/)?.[1])
        .filter(Boolean)
    )
    console.log(packages)
    return [...packages].map(pkg => `pnpm --filter ./${pkg} lint --fix`)
  }
}