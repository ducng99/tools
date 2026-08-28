import type { QuirkRule } from "./types";

/**
 * Maps caniemail.com feature slugs (HTMLCheckWarning.Slug) to a simulated
 * degradation rule. Only features that can meaningfully be approximated by
 * transforming the HTML/CSS for rendering in a normal browser are listed here
 * — things like HTML5 semantics or <body> attribute stripping happen inside
 * an email client's own layout engine and can't be reproduced this way.
 */
export const QUIRK_RULES: Record<string, QuirkRule> = {
    "css-border-radius": { kind: "css-property", properties: ["border-radius"] },
    "css-box-shadow": { kind: "css-property", properties: ["box-shadow"] },
    "css-text-shadow": { kind: "css-property", properties: ["text-shadow"] },
    "css-transform": { kind: "css-property", properties: ["transform"] },
    "css-filter": { kind: "css-property", properties: ["filter"] },
    "css-mix-blend-mode": { kind: "css-property", properties: ["mix-blend-mode"] },
    "css-opacity": { kind: "css-property", properties: ["opacity"] },
    "css-outline": { kind: "css-property", properties: ["outline"] },
    "css-float": { kind: "css-property", properties: ["float", "clear"] },
    "css-overflow": { kind: "css-property", properties: ["overflow", "overflow-x", "overflow-y"] },
    "css-visibility": { kind: "css-property", properties: ["visibility"] },
    "css-max-width": { kind: "css-property", properties: ["max-width"] },
    "css-min-width": { kind: "css-property", properties: ["min-width"] },
    "css-word-break": { kind: "css-property", properties: ["word-break"] },
    "css-background-image": { kind: "css-property", properties: ["background-image"] },
    "css-background-size": { kind: "css-property", properties: ["background-size"] },
    "css-background-position": { kind: "css-property", properties: ["background-position"] },
    "css-background-repeat": { kind: "css-property", properties: ["background-repeat"] },
    "css-position": { kind: "css-property", properties: ["position"], valueFilter: /fixed|absolute|sticky/i },
    "css-display": { kind: "css-property", properties: ["display"], valueFilter: /flex|grid/i },
    "css-pseudo-class-hover": { kind: "css-selector-strip", selectorIncludes: [":hover"] },
    "css-pseudo-element-before": { kind: "css-selector-strip", selectorIncludes: ["::before", ":before"] },
    "css-pseudo-element-after": { kind: "css-selector-strip", selectorIncludes: ["::after", ":after"] },
    "css-at-media": { kind: "css-at-media-hoist" },
    "css-at-font-face": { kind: "css-at-font-face-strip" },
    "html-video": { kind: "placeholder-element", tag: "video", label: "Video not supported" },
    "html-audio": { kind: "placeholder-element", tag: "audio", label: "Audio not supported" },
    "html-svg": { kind: "placeholder-element", tag: "svg", label: "SVG not supported" },
    "html-picture": { kind: "picture-unwrap" },
    "html-form": { kind: "unwrap-element", tag: "form" },
    "html-style": { kind: "remove-element", tag: "style" },
};
