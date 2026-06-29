# n8n-nodes-browserless-api

This is an n8n community node for [Browserless](https://browserless.io) — a headless browser API service for web scraping, screenshots, PDF generation, and browser automation.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) | [Operations](#operations) | [Credentials](#credentials) | [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- **Get Content** — Retrieve the fully rendered HTML of a page, including JavaScript-rendered content
- **Scrape** — Extract structured data from a page using CSS selectors
- **Smart Scrape** — Scrape a page with automatic fallbacks for blocked or JS-heavy sites
- **Screenshot** — Capture a screenshot as PNG, JPEG, or WebP
- **PDF** — Generate a PDF document from a web page
- **Search** — Search the web and return results
- **Map URLs** — Discover URLs on a site or within its sitemap
- **Run Function** — Execute custom JavaScript/Puppeteer code server-side
- **Export** — Fetch a URL and stream it in its native content type
- **Unblock** — Bypass CAPTCHAs and bot detection to access a page
- **Performance Audit** — Run Lighthouse audits for performance, SEO, and accessibility
- **Crawl** — Crawl a website and extract content from every page

## Agentic browsing (MCP)

This node wraps Browserless's REST APIs. For an **interactive web agent** — a persistent browser session that navigates, clicks, types, solves captchas, and completes multi-step tasks — use n8n's built-in **MCP Client Tool** node pointed at the hosted Browserless MCP server:

- **Endpoint (HTTP Streamable):** `https://mcp.browserless.io/mcp`
- **Auth:** Header `Authorization: Bearer <your-token>`

That surfaces `browserless_agent` plus all the current MCP tools (smart-scrape, search, crawl, map, function, performance, export, skills) to your AI Agent node, without this REST node having to host the agent loop.

## Credentials

You need a Browserless API token to use this node:

1. Sign up at [browserless.io](https://browserless.io)
2. Get your API token from the dashboard
3. In n8n, create new **Browserless API** credentials
4. Enter your API token and base URL (default: `https://production-sfo.browserless.io`)

For self-hosted Browserless instances, change the base URL to your instance address.

## Resources

- [Browserless Documentation](https://docs.browserless.io)
- [Browserless REST API Reference](https://docs.browserless.io/rest-apis/intro)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/#community-nodes)
