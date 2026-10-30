# Remediations of Security Review Findings

Review date and time: 2026-09-25T09:25:06Z (UTC; 14:55 IST)

## Remediations

### Remediation of Finding 1: A third-party widget script runs with full page privileges on the trading page

- [ ] This remediation implements the security review's recommendation for this finding.
- [x] This remediation addresses the finding in a way that differs from the security review's recommendation.

Remediation commits:
- [e314f0b](https://github.com/StabilityNexus/Fate-EVM-Frontend/commit/e314f0b262cad575e272a72edd187b4ee9015974)

Description: The CoinGecko widget now runs in a sandboxed frame (`sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`, built with `srcDoc`), so its script cannot reach the app page, its storage or the wallet. The coin id is limited to `a-z0-9-` before it goes into the frame markup, and an in-memory `sessionStorage` stand-in is provided because the sandboxed frame has none. The CSP meta was not added by decision (Oct 12). The site is a static export, so a CSP can only be a meta tag without nonces; Next's inline scripts and the theme script would need `'unsafe-inline'`, and user-set custom RPCs need `connect-src https: wss:`. With the widget isolated in a sandboxed frame, such a policy would add little.

## Non-remediated findings

None.
