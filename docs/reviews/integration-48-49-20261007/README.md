# PRs 48 and 49: combined integration certification

Certified together on October 7, 2026 for the automated and Chromium checks below. This does not certify physical-iPhone behavior, native Whistlevale Mobile, artistic acceptance, or permission to merge.

## Exact source

| Input | Commit |
| --- | --- |
| Current main | `21bca3bbe5ea509596619053b76eb7c4bc6fe6e5` |
| PR 48, Venetian Salon | `5d78b0998f6bdc0d3f9618f8c876461921504cea` |
| PR 49, The Orrery | `ccddd87bb39e3bfe61d0972f0a21e2842b6f36f9` |
| Tested local integration commit | `dac635c9f9b4a24ec4c8cc91c9b84f96dc902895` |
| Published integration commit | `8ccdaaec5f8ffd3894e52bd2729e47f85166a7b1` |
| Exact shared runtime tree | `a46805c1630248b1319a159fdc526a1df0a1e35a` |

Temporary branch: `codex/integration-48-49-20261007`. The published commit has the exact two PR heads as parents; current main is an ancestor of both. Its tree was checked against the locally tested tree with an empty `git diff`. The evidence-only followup adds this directory without changing the certified runtime. PR 48 stays draft; neither PR is merged and neither source branch was changed.

Only `index.html` and `package.json` conflicted. The resolution keeps all five Venetian modules, Orrery room/track/stock/ride scripts and stylesheet, both focused commands, and both entries in `npm test`. Shared hobby, renderer and map changes are retained exactly from PR 48. Venice occupies east-7; Orrery occupies east-6. No product-code fix, budget change, timeout relaxation, dependency change or source-harness modification was needed.

## Executed results

| Check | Result and evidence |
| --- | --- |
| Full regression and public build | PASS, Node 24.19.0. Both room suites run through `npm test`; 140 public files, no optional audio recordings. [Log](npm-test.txt), [exit receipt](npm-test-result.json). |
| Full geometry | PASS: 560 meshes, 13,367,340 vertices and 160,408,080 Float32 attributes bitwise match the reference Builder. This is builder equivalence, not comparison with earlier artwork. [Log](geometry-full.txt). |
| Contributions | PASS: 11 works, three workshop pieces, nine measured placements across four contribution scenes; existing budgets retained. [Measured JSON](contributions.json). |
| Existing Venetian browser suite | PASS: desktop/day/evening/night, 390px/320px containment, play/pause/reduced motion, reflection state and visible A/B, cinema, map and light restoration. [Report](venetian-browser-report.json). |
| Existing Venetian experience suite | PASS: synthetic mouse/pinch, navigation and reflection disposal/recreation, actual downloaded HTML opened with HTTP(S) blocked, 11 views, 29 moving parts, boats and reflections working, zero network requests. [Report](venetian-experience-report.json). Optional rowing-film capture was not requested or run. |
| Existing Orrery browser/export suite | PASS: full native-simulation trip and arrival/replay, inversion, keyboard/focus, 390px/320px controls, synthetic pinch/cancel, reduced motion, map, room return and native animation. Actual downloaded HTML reopened offline with one control set, fresh dispatch, train movement and 12 mechanisms. [Report](orrery-browser-report.json). |
| Additional combined check | PASS in the served app and in each of the two actual downloaded exports: navigate Venice to Orrery and back, independent plots, reflection release/recreation, ride cleanup, both trains plus gondolas advancing on the live map, and global pause freezing all three. No uncaught or final WebGL errors. [Report](combined-browser-report.json), [harness](combined-browser.cjs). |

[Browser command exit codes and durations](browser-results.json). Browser: Playwright 1.55.1 / Chromium 140.0.7339.186 / SwiftShader on Linux. Existing browser scripts ran unchanged. Main animation is held for stills; native simulation/animation is tested separately. No physical device, hardware frame-rate, thermal or low-memory claim follows.

The first `npm test` attempt hit the existing 10-second VM timeout in `moonlight-valley-qa.mjs` while full geometry ran concurrently. [That failed log is retained](npm-test-initial-timeout.txt). The identical runtime passed the entire command when run sequentially after geometry; no timeout or source change was made. This was not treated as an integration defect.

The new combined harness initially asserted reflection disposal before drawing the destination room while deliberately holding animation. Its [initial failure](combined-browser-initial-harness.json) is retained. Disposal belongs to `venetianPrepareReflection()` on the next render, so the harness now draws the destination before asserting cleanup, as the existing experience harness does. Product source and existing tests were unchanged.

## Rendered evidence and reproducibility

Actual combined-build captures were inspected, including desktop and narrow layouts, room details and live map. These are integration observations, not owner artistic acceptance. Contact sheets are reduced derivatives of actual screenshots; the combined map is a direct screenshot.

- [Venetian contact sheet](venetian-contact.jpg)
- [Orrery contact sheet](orrery-contact.jpg)
- [Both rooms on the live map](combined-map.png)
- [Exact artifact sizes and SHA-256 hashes](artifact-hashes.json)

Raw PNGs and the two generated portable HTML files stay in the ignored local evidence directories. The remote record contains logs, JSON, reproducible harness, selected rendered evidence and hashes; it does not claim to host every raw capture or the exported HTML.

To repeat, check out published integration commit `8ccdaaec5f8ffd3894e52bd2729e47f85166a7b1`, run `npm test`, `npm run test:geometry:full`, and `npm run check:contributions -- --json` sequentially. Install Playwright outside the app, start `python3 scripts/serve.py --port 4175`, then run the unchanged `scripts/venetian-browser-qa.cjs` and `scripts/venetian-experience-qa.cjs` with `VENETIAN_PLAYWRIGHT` pointing to it, and `scripts/orrery-browser-qa.cjs` with `PLAYWRIGHT_PATH`. Copy the linked combined harness into `evidence/integration-48-49/combined-browser.cjs` and run it with `PLAYWRIGHT_PATH` after both existing export checks. It tests their exact downloaded output files, not substitute HTML.

Certification is limited to these frozen heads and checks. Re-run affected gates if main or either PR changes.
