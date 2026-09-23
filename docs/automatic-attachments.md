# Automatic inscription attachments — NOT READY

The shared AttachmentField is used by both PostForm and QuickReply. Click
**Inscribe attachment**, choose media in IQ Labs' existing Solana uploader, and
complete its normal wallet/funding flow. After a successful inscription the
reference returns to the post automatically. Review and submit the post separately.
The original visible **Attachment URL** input remains available. A completed
upload also shows Copy link and Open inscription in the uploader, so manual
pasting remains possible if automatic return fails.

This does not copy the uploader, SDK writer, funding or refund logic into the
frontend. The popup carries out those operations on IQ Labs. Only the public
signature, network and random request ID return to the posting app; draft text,
wallet keys and signing material are not exchanged. HoodChan still posts on
Robinhood; its attachment can reference a Solana inscription.

## Coordinated rollout

Requires the matching `code_in_v2.js` attachment return change in iq6900 and the
gateway `/media` route. Deploy and verify those before enabling this frontend.
The currently deployed uploader does not have the return protocol yet. This
prototype is submitted as a draft. **NOT READY: not fully tested or approved by
Nubs or Zo. Do not merge or deploy yet.**

The configured uploader defaults to `https://iqlabs.dev/`. Set the build-time
`NEXT_PUBLIC_INSCRIPTION_URL` for a local/staging uploader. The receiver validates
the exact configured origin, the popup Window and a per-upload UUID. A completed
Solana signature is validated through the existing inscription URL parser.
Cancellation, editing the attachment, unmounting or starting a new request removes
the old listener. Failure/cancellation does not close an upload still in progress.

The IQ Labs side accepts only explicit posting origins. Loopback return origins
are accepted only when the uploader itself is served on loopback. Add any new
production posting domain intentionally on that side. Static/on-chain hosting
does not need a backend for the exchange. Browser popup permission and opener
preservation are required; a COOP policy that severs the opener prevents return.

## Protocol

Open `?menu=codein&attachmentOrigin=<origin>&attachmentRequest=<UUIDv4>`.
The uploader sends `iq:attachment-ready`, then `iq:attachment-complete` containing
`requestId`, `network: "solana"`, and `signature`. The frontend acknowledges with
`iq:attachment-accepted` and `requestId`. Every message uses an exact target origin,
never `*`. A rejected or incomplete inscription never sends a completion.

## Validation and remaining work

Run `npm test` for receiver and form regressions. A real public-devnet browser
run used a dedicated generated signer, the actual uploader and the locally
patched official SDK. The signature returned automatically; the local gateway
read back the original WAV byte for byte. Five completed-run transactions were
finalized successfully. The full local BlockChan form also displayed a manually
pasted devnet inscription with the user's Phantom connected.

[Verified devnet inscription](https://explorer.solana.com/tx/3Yk265VoZgsam4FHPy4NL9XHtQ5MEkj7uDGTJ12ggHTxuEvM6YRMZLXgZXVX1EVuNLSe2AQ6MidemTn9LjdQ1Tws?cluster=devnet)

The signed run used explicit devnet build settings, not production endpoints.
It does not prove the full-app Phantom signing/posting flow, mobile behavior,
popup blocking/recovery across deployed origins, or production rollout. Review
the deployed origin/COOP/CSP behavior and coordinate uploader/gateway deployment.
The uploader's signing is not yet fully tested or approved by Nubs or Zo.
No mainnet transactions or production deployment were performed.
