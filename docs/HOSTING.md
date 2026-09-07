# Hosting and monetization path

Researched September 7, 2026. Prices exclude domain registration, taxes, payment processing and any separate database/auth service. Verify plan terms before purchase.

| Host | Starting point | Fit for this game |
|---|---|---|
| Cloudflare Workers static assets | Static asset requests free/unlimited; Workers backend free allowance, paid from $5/month plus usage | Recommended commercial path: static game first, account/inventory/payment API later. Avoid invoking a Worker for every image request. |
| GitHub Pages | Free public-repository demo | Excellent contribution preview. Not a commerce host: policy excludes sites primarily facilitating commercial transactions. |
| Netlify | Free 300 monthly credits; Personal $9/month with 1,000 credits | Easy Git deployments and functions. Free projects pause at the credit limit; budget for traffic and deployments. |
| Vercel | Hobby free for non-commercial use; paid commercial plan | Good tooling, but the game does not require its server rendering stack; check paid plan costs before monetization. |

Official references: [Cloudflare pricing](https://developers.cloudflare.com/workers/platform/pricing/), [static-asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [Netlify plans](https://www.netlify.com/pricing/), [Vercel plans](https://vercel.com/pricing).

## Current deployment

Pages serves a free playable demo from `/theandril-hearth-and-card/`. The build uses `VITE_BASE_PATH`; `assetUrl` covers dynamic image/Three.js URLs, while Vite rewrites CSS and HTML paths. For a host at the domain root, run `pnpm build` without that environment variable and publish `dist`. No service account or billing plan is needed to build locally.

The optimized game and all card art ship as static files. Browsers download images as needed rather than the entire catalog on first load. Original art provenance is distributed separately as release assets. No backend secrets belong in Vite environment variables: bundled values are public.

## Before real-money purchases

Keep the browser game as presentation and local/offline play. Add authenticated accounts and a server-owned entitlement/inventory ledger for purchased content. The server must verify payment webhooks, handle retries idempotently, record grants/refunds and enforce balances. Never trust imported JSON, a localStorage balance, a price sent by the client or a checkout success URL as proof of payment.

A sensible first paid product is a clearly described expansion or downloadable edition. Cosmetics and fixed-content packs are easier to explain and operate than paid randomized rewards. Choosing a payment provider, tax handling, refund rules and any jurisdiction-specific requirements belongs to the commerce implementation, not this static demo.

Downloadable builds can later package the same frontend with a desktop wrapper and an offline save adapter. Paid editions still need their own delivery/licensing policy. Open-source code and paid hosting/content can coexist; see the separate code/content licenses.

No Cloudflare/Netlify/Vercel account, paid plan, payment system or commercial inventory has been created by this increment.
