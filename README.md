# Bivol Boxing Lab

A browser-based boxing biomechanics prototype built with React, TypeScript, Vite and MediaPipe Tasks Vision.

## Features

- Live webcam pose tracking
- 33-point MediaPipe body landmark tracking
- Real-time stance / balance / guard / footwork metrics
- Punch-motion velocity estimation
- Punch counting
- Peak velocity tracking
- Bivol-inspired, GGG-inspired, Soviet fundamentals and neutral technical profiles
- Coaching feedback generated from measured movement
- Style-gap dashboard
- Skeleton overlay
- Responsive UI

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

Camera access generally requires `localhost` or HTTPS.

## Important technical note

This is an advanced prototype, not a validated sports-science measurement system. Camera perspective, lighting, occlusion and frame rate affect estimates. The style profiles are coaching frameworks inspired by publicly observable boxing characteristics; they are not representations of advice from the named athletes.

## Next development stages

1. Add MediaPipe Hand Landmarker output to punch/guard analysis.
2. Add temporal filtering and a proper frame-time clock.
3. Add 2D camera calibration and optional reference object for distance scaling.
4. Add punch classifier for jab/cross/hook/uppercut.
5. Add foot trajectory tracking and stance-zone visualization.
6. Add session database and historical progress graphs.
7. Add reference-video annotation/import.
8. Build a validated reference dataset before making athlete-style similarity claims.
9. Add Web Worker processing for higher frame rates.
10. Add optional backend for authenticated sessions and model training.

## Deployment

This Vite project can be deployed to static hosting such as GitHub Pages, Cloudflare Pages or Vercel. For GitHub Pages, configure the repository's Pages workflow/build output according to your chosen deployment method.
