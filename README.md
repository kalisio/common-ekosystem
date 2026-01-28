# Common Ekosystem

> A common base of small, reusable utility libraries for the **Kalisio** ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is inside ?

This monorepo contains the following packages:

- **[@kalisio/check](./packages/check)** - Minimalist conditional and assertion utilities
- **[@kalisio/geokit](./packages/geokit)** - A lightweight toolkit for geospatial data processing
- **[@kalisio/graphiks](./packages/graphiks)** - A minimal parametric shape factory for SVG graphics

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8

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
pnpm --filter @kalisio/check lint
```

### Testing

This monorepo uses [Vitest](https://vitest.dev/) for testing with the following configuration:

- **check**: Tests run in **Node.js** environment
- **graphiks**: Tests run in **happy-dom (browser-like)** environment

> [!NOTE]  
> Coverage reports are generated using [v8](https://v8.dev/blog/javascript-code-coverage) provider

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @kalisio/check test
pnpm --filter @kalisio/graphiks test

# Run tests with coverage
pnpm --filter @kalisio/check test --coverage
```

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
