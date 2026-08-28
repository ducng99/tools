import { Show, createEffect, createMemo, createSignal } from "solid-js";
import EmailClientTabs from "./EmailClientTabs";
import { buildClientPreviewHtml } from "./emailPreview/applyQuirks";
import { deriveClientTargets } from "./emailPreview/deriveClientTargets";
import type { HTMLCheckResponse } from "../../routes/htmlcheck/-extension";

interface EmailClientPreviewProps {
    html: string;
    checkResult: HTMLCheckResponse | null;
}

export default function EmailClientPreview(props: EmailClientPreviewProps) {
    const targets = createMemo(() => (props.checkResult ? deriveClientTargets(props.checkResult) : []));
    const [activeKey, setActiveKey] = createSignal("");

    createEffect(() => {
        const list = targets();
        if (list.length > 0 && !list.some(t => t.key === activeKey())) {
            setActiveKey(list[0].key);
        }
    });

    const activeTarget = createMemo(() => targets().find(t => t.key === activeKey()) ?? null);
    const previewHtml = createMemo(() => buildClientPreviewHtml(props.html, props.checkResult, activeTarget()));

    return (
        <div class="mt-4">
            <h2 class="h4">Client Preview</h2>
            <Show
                when={targets().length > 0}
                fallback={<p class="text-muted small">Run the check above to see per-client simulated previews.</p>}
            >
                <EmailClientTabs targets={targets()} activeKey={activeKey()} onSelect={setActiveKey} />
                <p class="text-muted small mt-2 mb-2">
                    Simulated by neutralizing CSS/HTML features this client doesn't support, based on the check results above — an approximation, not a pixel-accurate render.
                </p>
            </Show>
            <iframe
                title="Email client preview"
                class="border rounded w-100"
                style={{ height: "600px", background: "#fff" }}
                sandbox="allow-same-origin"
                srcdoc={previewHtml()}
            />
        </div>
    );
}
