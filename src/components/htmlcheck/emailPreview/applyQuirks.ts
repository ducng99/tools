import type { HTMLCheckResponse, HTMLCheckWarning } from "../../../routes/htmlcheck/-extension";
import type { ClientTarget } from "./deriveClientTargets";
import { QUIRK_RULES } from "./quirkRules";
import type { QuirkRule } from "./types";

function sanitizeDoc(html: string): Document {
    const doc = new DOMParser().parseFromString(html, "text/html");

    for (const scriptEl of Array.from(doc.querySelectorAll("script"))) {
        scriptEl.remove();
    }

    for (const el of Array.from(doc.querySelectorAll("*"))) {
        for (const attr of Array.from(el.attributes)) {
            if (attr.name.toLowerCase().startsWith("on")) {
                el.removeAttribute(attr.name);
            }
        }
    }

    return doc;
}

const SUPPORT_SEVERITY: Record<string, number> = { no: 2, partial: 1, yes: 0 };

/**
 * A family+platform pair (e.g. "outlook"+"windows") can span several product
 * versions (Outlook 2003-2019) with different support levels. We take the
 * worst-case across all of them so the preview shows what could break on any
 * version a recipient might be using, rather than an arbitrary one.
 */
function getSupportForTarget(warning: HTMLCheckWarning, target: ClientTarget): string | undefined {
    let worst: string | undefined;
    let worstSeverity = -1;

    for (const r of warning.Results) {
        if (r.Family === target.family && r.Platform === target.platform) {
            const severity = SUPPORT_SEVERITY[r.Support] ?? 0;
            if (severity > worstSeverity) {
                worstSeverity = severity;
                worst = r.Support;
            }
        }
    }

    return worst;
}

function activeRulesForTarget(checkResult: HTMLCheckResponse, target: ClientTarget): Array<QuirkRule> {
    const bySlug = new Map<string, QuirkRule>();

    for (const warning of checkResult.Warnings) {
        const rule = QUIRK_RULES[warning.Slug];
        if (!rule) {
            continue;
        }

        const support = getSupportForTarget(warning, target);
        if (support === "no" || support === "partial") {
            bySlug.set(warning.Slug, rule);
        }
    }

    return Array.from(bySlug.values());
}

function applyElementRules(doc: Document, activeRules: Array<QuirkRule>): void {
    for (const rule of activeRules) {
        if (rule.kind === "remove-element") {
            for (const el of Array.from(doc.querySelectorAll(rule.tag))) {
                el.remove();
            }
        }
        else if (rule.kind === "unwrap-element") {
            for (const el of Array.from(doc.querySelectorAll(rule.tag))) {
                while (el.firstChild) {
                    el.parentNode?.insertBefore(el.firstChild, el);
                }
                el.remove();
            }
        }
        else if (rule.kind === "placeholder-element") {
            for (const el of Array.from(doc.querySelectorAll(rule.tag))) {
                const placeholder = doc.createElement("div");
                placeholder.setAttribute("style", "border:1px dashed #999;color:#888;padding:8px;text-align:center;font:12px sans-serif;background:#f5f5f5;");
                placeholder.textContent = `⚠ ${rule.label}`;
                el.replaceWith(placeholder);
            }
        }
        else if (rule.kind === "picture-unwrap") {
            for (const el of Array.from(doc.querySelectorAll("picture"))) {
                const img = el.querySelector("img");
                if (img) {
                    el.replaceWith(img);
                }
                else {
                    el.remove();
                }
            }
        }
    }
}

function applyInlineStyleRules(doc: Document, activeRules: Array<QuirkRule>): void {
    const propertyRules = activeRules.filter(r => r.kind === "css-property");
    if (propertyRules.length === 0) {
        return;
    }

    for (const el of Array.from(doc.querySelectorAll<HTMLElement>("[style]"))) {
        for (const active of propertyRules) {
            for (const prop of active.properties) {
                const value = el.style.getPropertyValue(prop);
                if (value && (!active.valueFilter || active.valueFilter.test(value))) {
                    el.style.removeProperty(prop);
                }
            }
        }

        if (!el.getAttribute("style")?.trim()) {
            el.removeAttribute("style");
        }
    }
}

function walkStyleRules(ruleList: CSSRuleList, activeRules: Array<QuirkRule>, output: Array<string>): void {
    for (const rule of Array.from(ruleList)) {
        if (rule instanceof CSSMediaRule) {
            const hoist = activeRules.some(r => r.kind === "css-at-media-hoist");
            if (hoist) {
                walkStyleRules(rule.cssRules, activeRules, output);
            }
            else {
                const inner: Array<string> = [];
                walkStyleRules(rule.cssRules, activeRules, inner);
                output.push(`@media ${rule.conditionText} { ${inner.join(" ")} }`);
            }
            continue;
        }

        if (rule instanceof CSSFontFaceRule) {
            const strip = activeRules.some(r => r.kind === "css-at-font-face-strip");
            if (!strip) {
                output.push(rule.cssText);
            }
            continue;
        }

        if (rule instanceof CSSStyleRule) {
            const stripSelector = activeRules.some(
                r => r.kind === "css-selector-strip" && r.selectorIncludes.some(s => rule.selectorText.includes(s)),
            );
            if (stripSelector) {
                continue;
            }

            for (const active of activeRules) {
                if (active.kind === "css-property") {
                    for (const prop of active.properties) {
                        const value = rule.style.getPropertyValue(prop);
                        if (value && (!active.valueFilter || active.valueFilter.test(value))) {
                            rule.style.removeProperty(prop);
                        }
                    }
                }
            }

            output.push(rule.cssText);
            continue;
        }

        output.push(rule.cssText);
    }
}

function rewriteStylesheetText(cssText: string, activeRules: Array<QuirkRule>): string {
    const styleEl = document.createElement("style");
    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);

    try {
        const sheet = styleEl.sheet;
        if (!sheet) {
            return cssText;
        }

        const output: Array<string> = [];
        walkStyleRules(sheet.cssRules, activeRules, output);
        return output.join("\n");
    }
    catch {
        return cssText;
    }
    finally {
        styleEl.remove();
    }
}

export function buildClientPreviewHtml(html: string, checkResult: HTMLCheckResponse | null, target: ClientTarget | null): string {
    const doc = sanitizeDoc(html);

    if (checkResult && target) {
        const activeRules = activeRulesForTarget(checkResult, target);

        if (activeRules.length > 0) {
            applyElementRules(doc, activeRules);
            applyInlineStyleRules(doc, activeRules);

            for (const styleEl of Array.from(doc.querySelectorAll("style"))) {
                styleEl.textContent = rewriteStylesheetText(styleEl.textContent ?? "", activeRules);
            }
        }
    }

    return doc.documentElement.outerHTML;
}
