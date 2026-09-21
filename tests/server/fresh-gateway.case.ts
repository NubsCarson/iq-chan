import { expect, test } from "bun:test";
import { fetchAllTableRows, gwFetch } from "../../src/lib/gateway";
import { SOLANA_GATEWAY } from "../../src/lib/config";

test("Solana head reads reject legacy stale success and use a fresh fallback after expiry", async () => {
    const original = globalThis.fetch;
    const requests: string[] = [];
    try {
        globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
            const url = new URL(String(input));
            requests.push(url.href);
            expect(url.searchParams.get("fresh")).toBe("true");
            expect(new Headers(init?.headers).has("If-None-Match")).toBe(false);
            return Response.json({ cached: url.origin !== SOLANA_GATEWAY,
                rows: url.origin === SOLANA_GATEWAY ? [{ __txSignature: "confirmed-post" }] : [] },
                { headers: { etag: '"board"' } });
        }) as unknown as typeof fetch;
        for (let i = 0; i < 2; i++) {
            expect((await fetchAllTableRows("fresh-board", 50))[0].__txSignature).toBe("confirmed-post");
        }
        expect(requests.filter(url => url.startsWith(SOLANA_GATEWAY))).toHaveLength(2);
    } finally { globalThis.fetch = original; }
});

test("explicit fresh reads fall back on 503 and reject stale-only responses", async () => {
    const original = globalThis.fetch;
    try {
        globalThis.fetch = (async (input: unknown) => String(input).startsWith(SOLANA_GATEWAY)
            ? Response.json({ cached: false, rows: [{ __txSignature: "new" }] })
            : new Response(null, { status: 503 })) as unknown as typeof fetch;
        expect((await fetchAllTableRows("patched-board", 50))[0].__txSignature).toBe("new");
        globalThis.fetch = (async () => Response.json({ cached: true, rows: [] })) as unknown as typeof fetch;
        await expect(fetchAllTableRows("all-stale", 50)).rejects.toThrow("no gateway could provide fresh rows");
    } finally { globalThis.fetch = original; }
});

test("historical pagination retains cached reads and EVM excludes the Solana-only fallback", async () => {
    const original = globalThis.fetch;
    const requests: string[] = [];
    try {
        globalThis.fetch = (async (input: unknown) => {
            const url = new URL(String(input)); requests.push(url.href);
            const older = url.searchParams.has("before");
            expect(url.searchParams.has("fresh")).toBe(!older);
            return Response.json({ cached: older, rows: [{ __txSignature: older ? "older" : "head" }],
                nextCursor: older ? null : "cursor" });
        }) as unknown as typeof fetch;
        expect((await fetchAllTableRows("paged-board", 100)).map(row => row.__txSignature)).toEqual(["head", "older"]);
        requests.length = 0;
        globalThis.fetch = (async (input: unknown) => {
            requests.push(String(input)); return new Response(null, { status: 503 });
        }) as unknown as typeof fetch;
        await expect(gwFetch("/table/iqchan/iq/rows?network=robinhood")).rejects.toThrow();
        expect(requests.some(url => url.startsWith(SOLANA_GATEWAY))).toBe(false);
    } finally { globalThis.fetch = original; }
});
