# Noemalys Tools

A static Next.js site for browser-based utilities. The first tool resizes and compresses batches of JPEG, PNG and WebP images. It supports a local preset, individual downloads and ZIP export.

## Run locally

Use Node.js 22 or later. Run `npm ci` and `npm run dev`, then open `http://localhost:3000/image-resizer/`.

## Deploy on Vercel

Import this repository as its own Vercel project with the Next.js preset. The build runs `npm run build` and exports a static site to `out/`. No environment variables are required. Add `tools.noemalys.com` in the Vercel project settings and use the DNS record Vercel provides.

Images are processed in a Web Worker with OffscreenCanvas. Presets store settings on the current device. The target size is best effort, and results above target are marked individually.
