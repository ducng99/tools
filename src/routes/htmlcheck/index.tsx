import { createFileRoute } from "@tanstack/solid-router";
import { For, Show, createMemo, createSignal } from "solid-js";
import { runHtmlCheck } from "./-extension";
import type { HTMLCheckResponse } from "./-extension";
import type { ChangeEvent } from "../../utils";

interface ClientCompat {
    platform: string;
    percent: number;
}

const PLATFORM_NAMES: Record<string, string> = {
    "desktop-app": "Desktop",
    "desktop-webmail": "Desktop Webmail",
    "mobile-webmail": "Mobile Webmail",
    "webmail": "Webmail",
    "ios": "iOS",
    "android": "Android",
    "windows": "Windows",
    "macos": "macOS",
    "windows-mail": "Windows Mail",
    "outlook-com": "Outlook.com",
};

function formatPlatformName(platform: string): string {
    return PLATFORM_NAMES[platform] ?? platform;
}

function computeClientCompat(result: HTMLCheckResponse): Array<ClientCompat> {
    const weights = new Map<string, { supported: number; total: number }>();

    for (const warning of result.Warnings) {
        if (warning.Score.Found === 0) {
            continue;
        }

        const weight = warning.Score.Found;

        for (const r of warning.Results) {
            const entry = weights.get(r.Platform) ?? { supported: 0, total: 0 };
            entry.total += weight;
            if (r.Support === "yes") {
                entry.supported += weight;
            }
            else if (r.Support === "partial") {
                entry.supported += weight * 0.5;
            }
            weights.set(r.Platform, entry);
        }
    }

    return Array.from(weights.entries())
        .map(([platform, { supported, total }]) => ({
            platform: formatPlatformName(platform),
            percent: total > 0 ? (supported / total) * 100 : 0,
        }))
        .sort((a, b) => a.platform.localeCompare(b.platform));
}

export const Route = createFileRoute("/htmlcheck/")({
    head: () => ({
        meta: [
            {
                title: "HTML Email Checker",
            },
        ],
        scripts: [
            { src: "/htmlcheck/wasm_exec.js" },
        ],
    }),
    component: ToolComponent,
});

function ToolComponent() {
    // eslint-disable-next-line no-unassigned-vars
    let htmlTextboxRef: HTMLTextAreaElement | undefined;
    const [isChecking, setIsChecking] = createSignal(false);
    const [error, setError] = createSignal<string>("");
    const [checkResult, setCheckResult] = createSignal<HTMLCheckResponse | null>(null);
    const clientCompat = createMemo(() => {
        const result = checkResult();
        return result ? computeClientCompat(result) : [];
    });

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.currentTarget.files && event.currentTarget.files.length > 0) {
            const file = event.currentTarget.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if (htmlTextboxRef) {
                    htmlTextboxRef.value = e.target?.result as string;
                }
            };
            reader.readAsText(file);
        }
    }

    function handleSubmit() {
        if (!htmlTextboxRef?.value) {
            return;
        }

        setError("");
        setCheckResult(null);
        setIsChecking(true);

        runHtmlCheck(htmlTextboxRef.value)
            .then((result) => {
                setCheckResult(result);
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : String(err));
            })
            .finally(() => {
                setIsChecking(false);
            });
    }

    return (
        <div class="container mt-5">
            <h1>HTML Email Checker</h1>
            <p class="text-muted">
                Checks HTML/CSS email markup against email client support data from
                <a href="https://www.caniemail.com/" target="_blank" rel="noreferrer">caniemail.com</a>
                .
            </p>

            <div class="mb-3">
                <div>
                    <label class="form-label" for="html-file-upload">Upload an HTML file or paste HTML below:</label>
                    <input type="file" class="form-control" id="html-file-upload" accept=".html,.htm,text/html" onChange={handleFileChange} />
                </div>
                <div class="my-3">
                    <textarea class="form-control" id="html-textbox" placeholder="Paste your email HTML here" rows={12} ref={htmlTextboxRef}></textarea>
                </div>
                <button type="button" class="btn btn-primary" id="trigger-button" disabled={isChecking()} onClick={handleSubmit}>
                    <Show when={isChecking()} fallback="Check ✅">
                        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Checking...
                    </Show>
                </button>
            </div>

            <Show when={error()}>
                <div class="alert alert-danger">{error()}</div>
            </Show>

            <Show when={checkResult()}>
                {result => (
                    <div class="mt-4">
                        <h2 class="h4">Summary</h2>
                        <div class="row">
                            <div class="col-12 col-md-3">
                                <strong>{result().Total.Nodes}</strong>
                                {" nodes checked"}
                            </div>
                            <div class="col-12 col-md-3">
                                <strong>{result().Total.Tests}</strong>
                                {" tests run"}
                            </div>
                            <div class="col-12 col-md-3 text-success">
                                <strong>
                                    {result().Total.Supported.toFixed(1)}
                                    %
                                </strong>
                                {" supported"}
                            </div>
                            <div class="col-12 col-md-3 text-danger">
                                <strong>
                                    {(result().Total.Partial + result().Total.Unsupported).toFixed(1)}
                                    %
                                </strong>
                                {" partial/unsupported"}
                            </div>
                        </div>

                        <Show when={clientCompat().length > 0}>
                            <h2 class="h4 mt-4">Email Client Compatibility</h2>
                            <div class="row row-cols-2 row-cols-md-4 g-2">
                                <For each={clientCompat()}>
                                    {client => (
                                        <div class="col">
                                            <div class="border rounded p-2 d-flex justify-content-between align-items-center">
                                                <span>{client.platform}</span>
                                                <span
                                                    class={
                                                        client.percent >= 90
                                                            ? "text-success"
                                                            : client.percent >= 50
                                                                ? "text-warning-emphasis"
                                                                : "text-danger"
                                                    }
                                                >
                                                    <strong>
                                                        {client.percent.toFixed(1)}
                                                        %
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </Show>

                        <h2 class="h4 mt-4">
                            Warnings (
                            {result().Warnings.length}
                            )
                        </h2>
                        <Show when={result().Warnings.length > 0} fallback={<p class="text-muted">No compatibility issues found 🎉</p>}>
                            <div class="table-responsive">
                                <table class="table table-striped table-bordered align-middle">
                                    <thead>
                                        <tr>
                                            <th>Feature</th>
                                            <th>Category</th>
                                            <th>Found</th>
                                            <th>Supported</th>
                                            <th>Partial</th>
                                            <th>Unsupported</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <For each={result().Warnings}>
                                            {warning => (
                                                <tr>
                                                    <td>
                                                        <details>
                                                            <summary>
                                                                <a href={warning.URL} target="_blank" rel="noreferrer">{warning.Title}</a>
                                                            </summary>
                                                            <div class="mt-2" innerHTML={warning.Description}></div>
                                                        </details>
                                                    </td>
                                                    <td><span class="badge bg-secondary">{warning.Category}</span></td>
                                                    <td>{warning.Score.Found}</td>
                                                    <td class="text-success">
                                                        {warning.Score.Supported.toFixed(1)}
                                                        %
                                                    </td>
                                                    <td class="text-warning-emphasis">
                                                        {warning.Score.Partial.toFixed(1)}
                                                        %
                                                    </td>
                                                    <td class="text-danger">
                                                        {warning.Score.Unsupported.toFixed(1)}
                                                        %
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        </Show>
                    </div>
                )}
            </Show>
        </div>
    );
}
