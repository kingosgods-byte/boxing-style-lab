# Brawler Labs 2.0

A rebuilt browser-first boxing biomechanics lab with a stable core for multi-tracker pose analysis, boxing event detection, biomechanics, a coach council, fighter style references, and an engineering health layer.

## Architecture

- `src/tracking` — tracker contracts, MediaPipe, fusion
- `src/biomechanics` — geometry and movement metrics
- `src/boxing` — boxing-specific event detection
- `src/intelligence` — multi-agent coaching contracts
- `src/fighters` — fighter style-reference data with provenance
- `src/engineering` — runtime/build health contracts and future repair service boundary

## Self-repair design

The browser client must never contain a GitHub write token or unrestricted code-edit credential. The intended production loop is:

`diagnostics → repair proposal → isolated verification → review → deploy → health check → rollback`

The client exposes diagnostic signals; a separate trusted repair service/agent can later act on them.

## Development

```bash
npm install
npm run dev
npm run build
```

The GitHub Pages base path remains `/boxing-style-lab/`.
