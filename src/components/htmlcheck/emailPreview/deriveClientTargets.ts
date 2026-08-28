import type { HTMLCheckResponse, HTMLCheckResult } from "../../../routes/htmlcheck/-extension";

export interface ClientTarget {
    key: string;
    family: string;
    platform: string;
    label: string;
    versionLabel: string;
}

/**
 * Only the most widely-used email clients/platforms, in display order.
 * Keeps the tab list short instead of listing every family x platform
 * combination caniemail tracks (~60+).
 */
const TOP_CLIENTS: Array<{ family: string; platform: string; label: string }> = [
    { family: "gmail", platform: "desktop-webmail", label: "Gmail (Web)" },
    { family: "gmail", platform: "ios", label: "Gmail (iOS)" },
    { family: "gmail", platform: "android", label: "Gmail (Android)" },
    { family: "apple-mail", platform: "macos", label: "Apple Mail (macOS)" },
    { family: "apple-mail", platform: "ios", label: "Apple Mail (iOS)" },
    { family: "outlook", platform: "windows", label: "Outlook (Windows)" },
    { family: "outlook", platform: "outlook-com", label: "Outlook.com (Web)" },
    { family: "outlook", platform: "ios", label: "Outlook (iOS)" },
    { family: "yahoo", platform: "desktop-webmail", label: "Yahoo Mail (Web)" },
    { family: "samsung-email", platform: "android", label: "Samsung Email" },
];

export function deriveClientTargets(result: HTMLCheckResponse): Array<ClientTarget> {
    const groups = new Map<string, HTMLCheckResult>();

    for (const warning of result.Warnings) {
        for (const r of warning.Results) {
            groups.set(`${r.Family}:${r.Platform}`, r);
        }
    }

    const targets: Array<ClientTarget> = [];

    for (const client of TOP_CLIENTS) {
        const key = `${client.family}:${client.platform}`;
        const r = groups.get(key);
        if (r) {
            targets.push({
                key,
                family: client.family,
                platform: client.platform,
                label: client.label,
                versionLabel: r.Version,
            });
        }
    }

    return targets;
}
