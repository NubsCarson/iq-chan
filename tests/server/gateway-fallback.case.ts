import { test, expect } from "bun:test";
import { gwFetch, notifyPost } from "../../src/lib/gateway";
import { SOLANA_GATEWAY, GATEWAY_FALLBACKS, getGatewayUrl } from "../../src/lib/config";

test("restored gateway handles failed Solana reads but is skipped for EVM", async () => {
    const original = globalThis.fetch;
    const calls: string[] = [];
    globalThis.fetch = (async (url: RequestInfo | URL) => {
        calls.push(String(url));
        return new Response("{}", { status: String(url).startsWith(SOLANA_GATEWAY) ? 200 : 503 });
    }) as unknown as typeof fetch;
    try {
        expect((await gwFetch("/table/test/rows")).status).toBe(200);
        expect(calls[1]).toBe(`${SOLANA_GATEWAY}/table/test/rows`);
        calls.length = 0;
        await expect(gwFetch("/table/iqchan/biz/rows?network=robinhood")).rejects.toThrow();
        expect(calls.some(url => url.startsWith(SOLANA_GATEWAY))).toBe(false);
    } finally { globalThis.fetch = original; }
});

test("confirmed Solana posts notify every configured gateway once despite a failed primary", async () => {
    const original = globalThis.fetch;
    const fallbacks = [...GATEWAY_FALLBACKS];
    const calls: { url: string; init?: RequestInit }[] = [];
    const row = { sub: "confirmed post", threadPda: "thread" };
    // A trailing slash must not duplicate the primary notification.
    GATEWAY_FALLBACKS.push(`${getGatewayUrl()}/`);
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(url), init });
        if (String(url).startsWith(SOLANA_GATEWAY)) return new Response('{}');
        throw new Error("primary offline");
    }) as typeof fetch;
    try {
        await notifyPost("feed", "confirmed-signature", row, "author");
        expect(calls.map(call => call.url)).toEqual([
            `${getGatewayUrl().replace(/\/+$/, "")}/table/feed/notify`,
            `${SOLANA_GATEWAY}/table/feed/notify`,
        ]);
        for (const { init } of calls) {
            expect(init?.method).toBe("POST");
            expect(JSON.parse(String(init?.body))).toEqual({ txSignature: "confirmed-signature", row, signer: "author" });
            expect(init?.signal).toBeInstanceOf(AbortSignal);
        }
    } finally {
        globalThis.fetch = original;
        GATEWAY_FALLBACKS.splice(0, GATEWAY_FALLBACKS.length, ...fallbacks);
    }
});
