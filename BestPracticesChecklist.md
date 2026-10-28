# AOSSIE Best Practices Checklist

> Criteria adapted from the [OpenSSF Best Practices Badge](https://github.com/coreinfrastructure/best-practices-badge)
> (MIT / CC BY 3.0) by OpenSSF contributors. Modified for AOSSIE multi-repo template use.
>
> **Purpose:** Covers OpenSSF Best Practices criteria that are NOT auto-detected by OpenSSF Scorecard.
> Scorecard already handles: License, SAST tools, CI tests, Security Policy file, Branch Protection,
> Pinned Dependencies, Signed Releases, Maintained status, and Known Vulnerabilities.
>
> **Legend:**
> - 🔴 MUST — Required for passing
> - 🟡 SHOULD — Required unless documented rationale given
> - 🔵 SUGGESTED — Optional but recommended
> - ⚪ N/A — Marked `[~]` with justification

**Scope:** `StabilityNexus/Fate-EVM-Frontend`, the EVM frontend for Fate Protocol.
Last reviewed: 2026-10-26.

---

## Score Summary

A criterion that does not apply cannot be failed, so **Met counts both `[x]` satisfied and `[~]`
justified N/A items**, over the full total of 49. This matches how other AOSSIE and Stability Nexus
projects score the same checklist, so the figures are comparable across repositories.

| Category           | Met | of Total | Score | Status |
|--------------------|-----|----------|-------|--------|
| Basics             | 8   | 8        | 100%  | 🟢     |
| Change Control     | 3   | 6        | 50%   | 🟡     |
| Reporting          | 8   | 8        | 100%  | 🟢     |
| Quality            | 9   | 11       | 82%   | 🟢     |
| Security           | 9   | 9        | 100%  | 🟢     |
| Analysis           | 4   | 7        | 57%   | 🟡     |
| **Total**          | **41** | **49** | **84%** | 🟢 |

Raw breakdown, for transparency: **28 satisfied `[x]`, 13 justified N/A `[~]`, 8 unmet `[ ]`.**

**Unmet 🔴 MUST items:** `version_unique`.
**Unmet 🟡 SHOULD items:** none.

---

## 🏗️ Basics

### Project Website & Documentation

- [x] 🔴 **description_good** — The project README/website clearly describes what the software does and what problem it solves.
  - *Evidence URL:* [README.md](README.md) — describes perpetual prediction pools, the dual-vault design, and the problem of order-book complexity.

- [x] 🔴 **interact** — The project provides information on how to obtain the software, submit bug reports, and contribute.
  - *Evidence URL:* [README.md](README.md) "Getting Started" and [CONTRIBUTING.md](CONTRIBUTING.md).

- [x] 🔴 **contribution** — `CONTRIBUTING.md` explains the contribution process (e.g., PRs are used, how to open one).
  - *Evidence URL:* [CONTRIBUTING.md](CONTRIBUTING.md) "Pull Request Process".

- [x] 🟡 **contribution_requirements** — `CONTRIBUTING.md` references acceptable contribution standards (coding style, tests required, etc.).
  - *Evidence URL:* [CONTRIBUTING.md](CONTRIBUTING.md) "Coding Style" and "Verifying a Change".

- [x] 🔴 **documentation_basics** — Basic documentation exists for the software (README, Wiki, or docs folder).
  - *Evidence URL:* [README.md](README.md), plus [AGENTS.md](AGENTS.md) for architectural constraints.

- [~] 🔴 **documentation_interface** — Reference documentation describes the external interface (API inputs/outputs, CLI flags, config schema, etc.).
  - *Justification:* N/A. This is a browser UI with no external API, CLI, or public configuration schema. It is a statically exported client that talks to on-chain contracts; the external interface belongs to the contracts repository.

### Other Basics

- [x] 🔴 **discussion** — Project has a searchable, URL-addressable discussion mechanism.
  - *Evidence URL:* [GitHub Issues](https://github.com/StabilityNexus/Fate-EVM-Frontend/issues) and the [Fate Discord channel](https://discord.com/channels/995968619034984528/1324064370883301386).

- [x] 🟡 **english** — Documentation is provided in English and English bug reports/comments are accepted.
  - *Note:* All documentation, issues, and code comments are in English.

---

## 🔄 Change Control

### Version Control

- [x] 🔵 **repo_distributed** — Project uses a distributed VCS (e.g., git). *(SUGGESTED)*
  - *Evidence URL:* https://github.com/StabilityNexus/Fate-EVM-Frontend

### Version Numbering

- [ ] 🔴 **version_unique** — Each release has a unique version identifier (e.g., v1.0.0).
  - *Note:* Unmet. The repository has no releases and no tags.

- [ ] 🔵 **version_semver** — Project uses SemVer or CalVer format. *(SUGGESTED)*
  - *Note:* Unmet, pending a first release.

- [ ] 🔵 **version_tags** — Releases are tagged in the VCS. *(SUGGESTED)*
  - *Note:* Unmet, pending a first release.

### Release Notes

- [~] 🔴 **release_notes** — Each release includes human-readable release notes summarizing major changes.
  - *Justification:* N/A under the continuous-delivery exemption. The frontend is deployed to GitHub Pages on merge to `main` and is not distributed as a versioned artifact for external reuse. Users always receive the current deployment.

- [~] 🔴 **release_notes_vulns** — Release notes identify every publicly known vulnerability (with CVE) fixed in that release.
  - *Justification:* N/A. No publicly known vulnerabilities have been reported against this project, and no versioned releases are published.

---

## 🐛 Reporting

### Bug Reporting

- [x] 🔴 **report_process** — A bug-reporting process exists.
  - *Evidence URL:* [CONTRIBUTING.md](CONTRIBUTING.md) "Reporting Issues" and [GitHub Issues](https://github.com/StabilityNexus/Fate-EVM-Frontend/issues).

- [x] 🟡 **report_tracker** — An issue tracker is used to track individual bugs.
  - *Evidence URL:* [GitHub Issues](https://github.com/StabilityNexus/Fate-EVM-Frontend/issues) — 46 issues in the last 12 months.

- [x] 🔴 **report_responses** — A majority of bug reports submitted in the last 2–12 months have been acknowledged.
  - *Self-certification note:* Measured on 2026-10-26 over the 36 issues opened 2 to 12 months earlier (2025-10-26 to 2026-08-26). An issue counts as acknowledged if it carries a reply from a person other than its author (bots excluded), or was closed by someone other than its author. An issue its author opened and closed alone is left out, since nobody else needed to respond. **All 8 issues labelled `bug` in that window were acknowledged (100%).**

- [x] 🟡 **enhancement_responses** — More than 50% of enhancement requests in the last 2–12 months have received a response.
  - *Self-certification note:* Measured the same way, over the same window. **All 9 issues labelled `enhancement` in that window were acknowledged (100%)**: 2 with a reply and 7 closed by a maintainer.

- [x] 🔴 **report_archive** — Reports and responses are publicly archived and searchable.
  - *Evidence URL:* [GitHub Issues](https://github.com/StabilityNexus/Fate-EVM-Frontend/issues) — public repository, full history readable without an account.

### Vulnerability Reporting

- [x] 🔴 **vulnerability_report_process** — A vulnerability reporting process is documented (e.g., `SECURITY.md`).
  - *Evidence URL:* [SECURITY.md](SECURITY.md) — private reporting route, what to include, 14-day acknowledgement target, and scope.

- [~] 🟡 **vulnerability_report_private** — If private vulnerability reporting is supported, the method for private submission is documented.
  - *Justification:* N/A. The criterion is conditional on private reporting being supported. GitHub's built-in private vulnerability reporting is disabled on this repository, and enabling it requires admin access. [SECURITY.md](SECURITY.md) nevertheless documents a private contact route via direct message to a listed maintainer. This becomes applicable if the setting is enabled.

- [~] 🔴 **vulnerability_report_response** — Initial response to any vulnerability report received in the last 6 months was within 14 days.
  - *Justification:* N/A. No vulnerability reports have been received.

---

## ✅ Quality

### Build System

- [x] 🔴 **build** — A working build system exists that can auto-rebuild from source.
  - *Evidence URL:* `npm run build` in [package.json](package.json); the GitHub Pages workflow rebuilds from source on every merge to `main`.

- [x] 🔵 **build_common_tools** — Common build tools are used. *(SUGGESTED)*
  - *Evidence URL:* npm, with Next.js as the build tool. See [package.json](package.json).

- [x] 🟡 **build_floss_tools** — The project can be built using only FLOSS tools.
  - *Note:* Node.js, npm, Next.js, TypeScript and Tailwind are all open source. No proprietary tooling is required to build.

### Automated Testing

- [x] 🔵 **test_invocation** — The test suite can be invoked in a standard way for the language. *(SUGGESTED)*
  - *Evidence URL:* `npm test` runs vitest ([package.json](package.json), [vitest.config.ts](vitest.config.ts)): 49 tests in 6 files. [CI](.github/workflows/ci.yml) runs it on every pull request.

- [ ] 🔵 **test_most** — The test suite covers most code branches, input fields, and functionality. *(SUGGESTED)*
  - *Note:* Unmet. Unit tests cover 6 of the 104 source files under `src/`: the backup helpers, the sell estimate, permits, the rebalance simulation, WAD math and formatting. No coverage tool is configured, so no percentage is claimed. UI and wallet flows are tested by hand.

### New Functionality Testing Policy

- [x] 🔴 **test_policy** — The project has a general policy that new functionality must include tests.
  - *Evidence URL:* [CONTRIBUTING.md](CONTRIBUTING.md) "Verifying a Change": new logic that can be tested outside the browser comes with a vitest test.

- [x] 🔴 **tests_are_added** — Evidence exists that the test policy has been followed in recent major changes.
  - *Evidence URL:* tests were added with the changes they cover in [#126](https://github.com/StabilityNexus/Fate-EVM-Frontend/pull/126) (backup), [#148](https://github.com/StabilityNexus/Fate-EVM-Frontend/pull/148) (sell estimate), [#162](https://github.com/StabilityNexus/Fate-EVM-Frontend/pull/162) (WAD math, rebalance simulation), [#163](https://github.com/StabilityNexus/Fate-EVM-Frontend/pull/163) (permits) and [#169](https://github.com/StabilityNexus/Fate-EVM-Frontend/pull/169) (formatting).

- [x] 🔵 **tests_documented_added** — The test policy is documented in contribution instructions. *(SUGGESTED)*
  - *Evidence URL:* [CONTRIBUTING.md](CONTRIBUTING.md) "Verifying a Change", and [AGENTS.md](AGENTS.md) "Commands".

### Linting / Warning Flags

- [x] 🔴 **warnings** — At least one linter or compiler warning flag is enabled.
  - *Tool used:* ESLint via `next lint`, configured in [eslint.config.mjs](eslint.config.mjs) with `eslint-config-next`. TypeScript type checking runs as part of `npm run build`.

- [x] 🔴 **warnings_fixed** — Warnings from the linter are addressed (not suppressed without reason).
  - *Evidence URL:* `npm run lint` and `npm run build` report no warnings. The last two, a `react-hooks/exhaustive-deps` warning in `PoolConfigurationStep.tsx` and a `@next/next/no-img-element` warning in `TokenImage.tsx`, were fixed in the code rather than suppressed.

- [ ] 🔵 **warnings_strict** — Project uses maximum strictness in linter config where practical. *(SUGGESTED)*
  - *Note:* Unmet. The project uses the `eslint-config-next` defaults rather than a hardened ruleset.

---

## 🔐 Security

### Secure Development Knowledge

- [x] 🔴 **know_secure_design** — At least one primary developer knows how to design secure software.
  - *Self-certification note:* Maintainers are familiar with secure-by-default design and threat modelling for Web3 frontends, including the risks of transaction construction, approval scope, and displaying untrusted on-chain data.

- [x] 🔴 **know_common_errors** — At least one primary developer knows common vulnerability types for this software's category.
  - *Self-certification note:* Maintainers are familiar with XSS, injection, and supply-chain risks in the frontend, and with reentrancy, oracle manipulation, and decimal or unit-scaling errors on the contract side that the UI must not misrepresent.

### Cryptography

*The six criteria below are marked N/A for a shared reason: this project performs no cryptographic
operations of its own. Transaction signing and key custody are delegated entirely to the user's
wallet, and hashing and ABI encoding are handled by the viem library. The project neither
implements, selects, nor stores cryptographic material.*

- [~] 🔴 **crypto_published** — Only publicly reviewed cryptographic protocols/algorithms are used by default.
  - *Justification:* N/A. See the shared note above. The underlying EVM primitives (ECDSA over secp256k1, keccak-256) are standard and are applied by the wallet and by viem, not by this project.

- [~] 🟡 **crypto_call** — Project calls an established crypto library rather than reimplementing crypto functions.
  - *Justification:* N/A by the shared note; where hashing or encoding is needed, viem is used. Nothing is reimplemented.

- [~] 🔴 **crypto_working** — No broken algorithms are used.
  - *Justification:* N/A. See the shared note above.

- [~] 🔴 **crypto_keylength** — Key lengths meet NIST 2030 minimums by default.
  - *Justification:* N/A. The project generates and stores no keys.

- [~] 🔴 **crypto_password_storage** — Passwords for external users are stored as iterated salted hashes.
  - *Justification:* N/A. There are no user accounts and no passwords. Authentication is wallet-based.

- [~] 🔴 **crypto_random** — Cryptographic keys and nonces are generated using a CSPRNG.
  - *Justification:* N/A. The project generates no cryptographic keys or nonces.

- [x] 🟡 **delivery_unsigned** — Cryptographic hashes are NOT retrieved over plain HTTP without a signature check.
  - *Note:* Dependencies are installed from the npm registry over HTTPS with integrity hashes pinned in `package-lock.json`. The application fetches no hashes over plain HTTP.

---

## 🔬 Analysis

### Static Code Analysis

- [x] 🔴 **static_analysis_fixed** — All medium+ severity vulnerabilities found by static analysis are fixed in a timely manner after confirmation.
  - *Note:* No medium or higher severity findings have been reported by static analysis to date.

- [ ] 🔵 **static_analysis_common_vulnerabilities** — The static analysis tool includes checks for common vulnerabilities. *(SUGGESTED)*
  - *Note:* Unmet. The ESLint configuration does not currently include a security ruleset such as `eslint-plugin-security`.

- [x] 🔵 **static_analysis_often** — Static analysis runs on every commit or at least daily. *(SUGGESTED)*
  - *Evidence URL:* [ci.yml](.github/workflows/ci.yml) runs ESLint and the type-checking build on every pull request and every push to `main`.

### Dynamic Code Analysis

- [ ] 🔵 **dynamic_analysis** — At least one dynamic analysis tool is applied before major releases. *(SUGGESTED)*
  - *Note:* Unmet. No dynamic analysis tooling is configured.

- [ ] 🔵 **dynamic_analysis_enable_assertions** — Dynamic analysis / testing runs with assertions enabled. *(SUGGESTED)*
  - *Note:* Unmet, dependent on there being an automated test suite.

- [~] 🔴 **dynamic_analysis_fixed** — Medium+ severity vulnerabilities found by dynamic analysis are fixed in a timely manner.
  - *Justification:* N/A. No dynamic analysis has been run, so there are no findings to act on. This becomes applicable once `dynamic_analysis` is met.

- [~] 🔵 **dynamic_analysis_unsafe** — If the project uses memory-unsafe languages, memory safety tools are used. *(SUGGESTED)*
  - *Justification:* N/A. The project is written in TypeScript, a memory-safe language, and ships no native code.

---

## 📎 Project-Specific Notes

**Full-Stack / Next.js.** The application is a static export (`output: "export"`), so it has no
server runtime, no API routes, and no server-side session or credential handling. This removes a
large class of criteria from scope, which is why the Cryptography section is entirely N/A.

**Web3.** Contract-level security belongs to `StabilityNexus/Fate-Solidity`, which is assessed
separately. This frontend must not misrepresent on-chain state; the most security-relevant class of
bug here is unit confusion, since three distinct numeric scales are in play (base-token decimals read
on-chain, WAD 1e18 for oracle values, and `DENOMINATOR = 100000` for contract fees). This is
documented for contributors in [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).

---

*This checklist complements [OpenSSF Scorecard](https://scorecard.dev/) (auto-detected checks) and is
inspired by the [OpenSSF Best Practices Badge](https://www.bestpractices.dev/en/criteria/0) passing criteria.*