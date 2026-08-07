<p align="center">
  <a href="https://github.com/poltter-group/poltter">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="Poltter logo">
    </picture>
  </a>
</p>
<p align="center">The open source AI coding agent.</p>
<p align="center">
  <a href="https://github.com/poltter-group/poltter"><img alt="GitHub" src="https://img.shields.io/github/stars/poltter-group/poltter?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/poltter-ai"><img alt="npm" src="https://img.shields.io/npm/v/poltter-ai?style=flat-square" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
</p>

[![Poltter Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://github.com/poltter-group/poltter)

---

### Installation

```bash
# Install from source
git clone https://github.com/poltter-group/poltter.git
cd poltter
bun install
bun run build

# Package managers
npm i -g poltter-ai@latest        # or bun/pnpm/yarn
```

> [!TIP]
> Remove versions older than 0.1.x before installing.

### Desktop App (BETA)

Poltter is also available as a desktop application. Download directly from the [releases page](https://github.com/poltter-group/poltter/releases).

| Platform              | Download                           |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `poltter-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `poltter-desktop-mac-x64.dmg`     |
| Windows               | `poltter-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm`, or `.AppImage`     |

```bash
# macOS (Homebrew)
brew install --cask poltter-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/poltter-desktop
```

#### Installation Directory

The install script respects the following priority order for the installation path:

1. `$POLTTER_INSTALL_DIR` - Custom installation directory
2. `$XDG_BIN_DIR` - XDG Base Directory Specification compliant path
3. `$HOME/bin` - Standard user binary directory (if it exists or can be created)
4. `$HOME/.poltter/bin` - Default fallback

```bash
# Examples
POLTTER_INSTALL_DIR=/usr/local/bin
XDG_BIN_DIR=$HOME/.local/bin
```

### Agents

Poltter includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

### Documentation

For more info on how to configure Poltter, check the docs in the `docs/` directory.

### Contributing

If you're interested in contributing to Poltter, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Building on Poltter

If you are working on a project that's related to Poltter and is using "poltter" as part of its name, for example "poltter-dashboard" or "poltter-mobile", please add a note to your README to clarify that it is not built by the Poltter team and is not affiliated with us in any way.

---

**Join our community** [GitHub](https://github.com/poltter-group/poltter)
