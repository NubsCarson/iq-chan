# IQ PR visual and test evidence

September 22, 2026. Local browser captures and recorded test results. These are
not screenshots of deployed fixes. No mainnet writes or real-wallet signing.

## Watch the visible changes

- [Homepage before/after recording](homepage-before-after.mp4): actual HomePage
  at upstream `592527b` and PR #30 `0f0a42e`, with the same two synthetic board reads.
  Fast board 250 ms, slow board 6 s, slow image 8 s. This is a controlled behavior
  demonstration, not a production latency benchmark.
- [Early homepage screenshot](homepage-slow-early.png): available content appears
  while the slow board/image remain pending. Both versions make two board reads.
- [Partial failure](homepage-partial-settled.png) and [total outage](homepage-outage-settled.png).
- [BlockChan attachment recording](attachments-solana.mp4) / [screenshot](attachments-solana.png).
- [HoodChan attachment recording](attachments-robinhood.mp4) / [screenshot](attachments-robinhood.png).
  Actual Attachment/PostForm components and application CSP. Wallet context is
  simulated; submit only displays JSON locally. Audio is reconstructed through the
  real gateway route from a signed offline Surfpool WAV. Video is synthetic.
  HoodChan form/network labels are tested here; signed EVM readback was tested
  separately on Anvil, not by this browser recording.
- [IQ6900 viewer](iq6900-metadata-text.png): actual viewer with a harmless synthetic
  HTML-looking tag rendered as text. No live feed mutation.

## Backend and dependency evidence

See [machine-readable results](test-results.json), [browser assertions](browser-results.json),
and the [HTML results report](test-report.html). These summarize the recorded
local signed runs and checks, not fabricated application screens.

| PR | Source / repeatable tests |
|---|---|
| [SDK #25](https://github.com/IQCoreTeam/iqlabs-solana-sdk/pull/25) | SDK `npm run test:sdk`, `npm run test:contract`; local signed workflow in `docs/surfpool-testing.md` |
| [Homepage #30](https://github.com/IQCoreTeam/iq-chan/pull/30) | `bun test ./tests/home-progress.case.tsx`; exact component commit `0f0a42e` |
| [Gateway #32](https://github.com/IQCoreTeam/iq-gateway/pull/32) | `bun test`; `docs/inscription-media.md` and opt-in `tests/local-media.evm.ts` |
| [IQ6900 #4](https://github.com/IQCoreTeam/iq6900/pull/4) | `cd tests && npm test`; `tests/README.md` and opt-in local upload test |
| [Attachments #31](https://github.com/IQCoreTeam/iq-chan/pull/31) | `npm test`; CSP/playback and local fixtures shown above |
| [Frontend dependencies #32](https://github.com/IQCoreTeam/iq-chan/pull/32) | clean install, tests, both chain server/static builds; wallet QR generation only |
| [Gateway dependencies #33](https://github.com/IQCoreTeam/iq-gateway/pull/33) | clean npm/frozen Bun installs, tests/typecheck/build, local media readback |

Original source commits and summary fields are in `test-results.json`. Raw local
logs and full receipts remain preserved locally. Wallet QR/session details, private
keys and book material are excluded. Remaining advisories, production rollout,
physical-wallet pairing and browser signing remain explicitly unverified.

Local interactive hub on the test PC: http://localhost:3213/ . Exact PR #30 full
app: http://localhost:3212/#/ . These localhost links work only on that PC.

Also available: [metadata grid](iq6900-metadata-grid.png), [actual full PR #30 app](homepage-full-pr30-local.png), and [its read-only result](full-app-result.json). The live app capture shows two threads while other boards were still pending.
