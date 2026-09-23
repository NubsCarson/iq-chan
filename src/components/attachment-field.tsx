"use client";

import { useEffect, useState } from "react";
import Attachment from "./attachment";
import { inscriptionMediaPath } from "../lib/attachment";
import { NETWORKS } from "../lib/chains/networks";

const UPLOADER = process.env.NEXT_PUBLIC_INSCRIPTION_URL || "https://iqlabs.dev/";

export default function AttachmentField({ value, onChange, disabled }: {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}) {
    const [upload, setUpload] = useState<{ popup: Window; id: string; initialValue: string } | null>(null);
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (!upload) return;
        if (disabled || value !== upload.initialValue) { setUpload(null); return; }
        const { popup, id } = upload;
        let completed = false;
        const origin = new URL(UPLOADER).origin;
        const timer = window.setTimeout(() => {
            setStatus("Automatic attachment is not available in this uploader version yet. Your draft is saved.");
        }, 10000);
        function receive(event: MessageEvent) {
            if (completed || event.origin !== origin || event.source !== popup || event.data?.requestId !== id) return;
            if (event.data.type === "iq:attachment-ready") {
                window.clearTimeout(timer);
                setStatus("Finish the upload in IQ Labs. Your attachment will return here automatically.");
                return;
            }
            if (event.data.type !== "iq:attachment-complete" || event.data.network !== "solana" || typeof event.data.signature !== "string") return;
            const share = new URL(UPLOADER);
            share.searchParams.set("menu", "codein");
            share.searchParams.set("post", event.data.signature);
            if (!inscriptionMediaPath(share.href, NETWORKS.solana)) return;
            completed = true;
            onChange(share.href);
            popup.postMessage({ type: "iq:attachment-accepted", requestId: id }, origin);
            setUpload(null);
            setStatus("Attachment added. Review your post, then press Post when ready.");
            window.focus();
        }
        window.addEventListener("message", receive);
        const closed = window.setInterval(() => {
            if (upload.popup.closed) {
                setUpload(null);
                setStatus("Upload window closed. Your post draft is saved.");
            }
        }, 500);
        return () => {
            window.clearTimeout(timer);
            window.clearInterval(closed);
            window.removeEventListener("message", receive);
        };
    }, [upload, disabled, value, onChange]);

    function openUploader() {
        if (upload) { upload.popup.focus(); return; }
        const id = crypto.randomUUID();
        const url = new URL(UPLOADER);
        url.searchParams.set("menu", "codein");
        url.searchParams.set("attachmentOrigin", window.location.origin);
        url.searchParams.set("attachmentRequest", id);
        // The narrowly validated message exchange needs an opener. No wallet
        // credentials or draft text are sent to the uploader.
        const popup = window.open(url.href, "iq-attachment-" + id, "popup,width=1000,height=850");
        if (!popup) { setStatus("Allow the IQ Labs popup, then try again. Your draft is saved."); return; }
        setUpload({ popup, id, initialValue: value });
        setStatus("Opening IQ Labs uploader…");
    }

    return <div>
        <input name="img" disabled={disabled} type="url" tabIndex={8} value={value}
            onChange={e => { setUpload(null); setStatus(""); onChange(e.target.value); }}
            placeholder="https://..." />
        <button type="button" onClick={openUploader} disabled={disabled}>
            {upload ? "Return to uploader" : "Inscribe attachment"}
        </button>
        {upload && <button type="button" onClick={() => {
            setUpload(null);
            setStatus("Automatic attachment cancelled. The upload window is still open; your draft is saved.");
        }}>Cancel attachment</button>}
        <div style={{ fontSize: 11 }}>Use IQ Labs’ Solana uploader. Completed media is added here automatically.</div>
        {status && <div role="status" style={{ fontSize: 12 }}>{status}</div>}

        {value.trim() && <div>
            <Attachment key={value.trim()} url={value.trim()} name="Attachment preview" />
            <button type="button" disabled={disabled} onClick={() => { setUpload(null); setStatus(""); onChange(""); }}>[Remove]</button>
        </div>}
    </div>;
}
