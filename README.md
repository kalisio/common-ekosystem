# common-ekosystem

> A common base of small, reusable utility libraries for the **Kalisio** ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What's inside ?

This monorepo contains the following packages:

- **[@kalisio/check](./packages/check)** - Minimalist conditional and assertion utilities
- **[@kalisio/geokit](./packages/geokit)** - A lightweight toolkit for geospatial data processing
- **[@kalisio/graphiks](./packages/graphiks)** - A minimal parametric shape factory for SVG graphics

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10

### Installation

```bash
# Clone the repository
git clone https://github.com/kalisio/common-ekosystem.git
cd common-ekosystem

# Install dependencies
pnpm install
```

## Development

### Linting

```bash
# Lint all packages
pnpm lint

# Lint a specific package
pnpm lint:check
pnpm lint:geokit
pnpm lint:graphiks
```

> [!NOTE]
> **common-ekosystem** follows the [standardJS](https://standardjs.com/) style guide for linting and code consistency.
> By default, **standard** is called with the `--fix` option to automatically fix style issues before committing.

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm test:check
pnpm test:geokit
pnpm test:graphiks

# Run a single test file
pnpm vitest run --project geokit parse.test.js
```

> [!NOTE]
> **common-ekosystem** uses [Vitest](https://vitest.dev/) for testing with the following configuration:
> - **check**: Tests run in **Node.js** environment
> - **graphiks**: Tests run in **happy-dom (browser-like)** environment

> [!NOTE]
> Coverage reports are generated using [v8](https://v8.dev/blog/javascript-code-coverage) provider.
> By default, **vitest** is called with the `--coverage` option to automatically compute the coverage

### Building

```bash
# Build all packages
pnpm -r build

# Build a specific package
pnpm --filter @kalisio/check build
```

## Contributing

Found a bug ? Missing a Feature ? Want to contribute ? check out our [contribution guidelines](./CONTRIBUTING.md) for details

## License

Licensed under the [MIT license](LICENSE).

Copyright (c) 2026-present [Kalisio](https://kalisio.com)

[![Kalisio](https://kalisio.github.io/kalisioscope/kalisio/kalisio-logo-black-256x84.png)](https://kalisio.com)
