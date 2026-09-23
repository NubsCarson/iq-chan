import { NETWORKS } from "./chains/networks";
import type { NetworkDescriptor } from "./chains/types";

// Shared provider restrictions for browser requests and server extraction.
export const ALLWEBS_PAGE = /^https:\/\/allwebs\.ru\/video\/[A-Za-z0-9.]+$/;
export const ALLWEBS_MEDIA = /^https:\/\/allwebs\.ru\/images\/\d{4}\/\d{2}\/\d{2}\/[a-f0-9]+\.(mov|mp4|webm)$/i;

/** Only known inscription/explorer links or transaction IDs enter the gateway. */
export function inscriptionMediaPath(value: string, network: NetworkDescriptor): string | null {
    let id = value.trim();
    let selected = network;
    if (/^https?:\/\//i.test(id)) {
        let url: URL;
        try { url = new URL(id); } catch { return null; }
        if (url.protocol !== "https:" || url.username || url.password) return null;
        if (url.origin === "https://iqlabs.dev" && url.searchParams.get("menu") === "codein") {
            id = url.searchParams.get("post") || "";
            selected = NETWORKS.solana;
        } else {
            const explorer = Object.values(NETWORKS).find(net => id.startsWith(net.explorerTxUrl));
            if (!explorer) return null;
            if (url.searchParams.has("cluster") && url.searchParams.get("cluster") !== "mainnet-beta") return null;
            id = url.pathname.split("/").at(-1) || "";
            selected = explorer;
        }
    }
    if (/^[1-9A-HJ-NP-Za-km-z]{80,88}$/.test(id)) return `/media/${id}?network=solana`;
    if (/^0x[0-9a-fA-F]{64}$/.test(id) && selected.family === "evm") {
        return `/media/${id}?network=${encodeURIComponent(selected.gatewayNetworkParam || selected.id)}`;
    }
    return null;
}
