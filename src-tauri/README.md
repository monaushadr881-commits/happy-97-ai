# HAPPY X — Tauri Desktop Shell

Scaffold registered by R61 Universal Deployment Runtime.

## Status

- `tauri.conf.json` present.
- **Not built in this environment.** Producing `.msi` / `.dmg` / `.AppImage` / `.deb`
  binaries requires:
  - Rust toolchain (`rustup`, `cargo`)
  - Platform-specific host OS (Windows for MSI, macOS for DMG, Linux for AppImage/DEB)
  - Signing certificates (Developer ID for macOS, EV code-signing for Windows)

The build engine (`src/lib/deployment-runtime`) records desktop platforms as
`blocked` with the exact missing dependency until a proper CI host is wired.

## Local build (developer machine)

```bash
cargo install tauri-cli --version "^2"
bun install
cargo tauri build
```
