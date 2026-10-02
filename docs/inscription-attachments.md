# Inscription attachments

New PostForm and QuickReply attachments accept a canonical transaction ID for
the active board's chain, or open that chain's existing IQ Labs uploader.
BlockChan uses a Solana signature and Code In; HoodChan uses a Robinhood
transaction hash and Hood In. New input rejects URLs and IDs from another
chain. Successful uploads return the canonical ID automatically. If popup
return fails, retain the post draft and paste the completed transaction ID.
Review and submit the post separately; returning an attachment never posts it.

Existing posts remain readable with ordinary external media URLs, IQ Labs
share links, supported transaction explorer links and IDs. Their renderer uses
the shared parser: a legacy Solana signature selects Solana even on HoodChan,
and an EVM hash selects the active EVM network. This compatibility applies to
reading existing posts, not to new attachment-field input.

The uploader defaults to `https://iqlabs.dev/`; `NEXT_PUBLIC_INSCRIPTION_URL`
sets its build-time URL. The matching `codein` or `hoodin` menu and the validated
return protocol are described in [automatic attachments](automatic-attachments.md).
This reuses the existing uploader and writer, leaves the post's chain unchanged,
and makes no browser RPC calls to read media.

The shared Attachment component calls the existing gateway transport at
`/media/:id?network=:network`, checks its media type and size, and uses native
image/audio/video elements. Ordinary media URLs continue to work. HTML, SVG,
unknown share sites and embedded remote media URLs are not resolved as inscriptions.
There is a 15-second request deadline and a 6 MiB maximum accepted decoded size.
The browser downloads the response before checking its size and starting playback;
this is not a streaming player or a bounded streaming download. The gateway
rejects oversized encoded payloads separately.

The server's `media-src` policy includes `blob:` for attachment object URLs.
Static exports do not emit Next response headers: configure any hosting CSP
to allow `blob:` in `media-src` too.

## Code review, rollout dependencies and recorded tests

The selected gateway must support the new `/media` endpoint first. A gateway
without that route returns an error; a 404 is terminal in the existing fallback
transport, so deploying only to a secondary gateway is insufficient.
The matching uploader return protocol must also be integrated. Verify deployed
popup/opener behavior and hosting CSP before enabling the attachment clients.
The local candidate is prepared for code review; these deployment checks and
physical mobile-wallet signing remain separate acceptance gates.

Recorded `npm test` runs cover reference parsing, image/audio/video rendering, cleanup,
unsupported content, ordinary URLs and EVM network selection. Typecheck and both
`NEXT_PUBLIC_NETWORK=solana npm run build` and
`NEXT_PUBLIC_NETWORK=robinhood npm run build` were checked, including
`STATIC_EXPORT=1` for each. A browser harness using the actual CSP reproduced
blocked playback before the fix and played WAV/video afterward in both site modes.
The WAV came from a signed offline Surfpool row; form tests use a simulated wallet.
Updated WalletConnect rendered a real QR code in the static HoodChan build;
pairing with a physical wallet was not tested.

The dependency lock selects official Solana SDK 0.3.6. SDK confirmation/resume
fixes in SDK PR #25 are not part of that published package. An unpublished local
test tarball is not a released SDK: publish a new version, update the application
alias/imports and locks, and rerun consumer checks before claiming the fixed
upload path is integrated.
The gateway separately passed signed EVM media tests on a local Anvil fork using
official Ethereum SDK 0.4.0. These checks do not prove live RPC availability,
deployed gateway support or browser-signed posting. No remote changes or mainnet
writes were made.

This documentation correction changes no runtime code or dependencies. It does
not represent a new test run, deployment or physical-wallet validation.
