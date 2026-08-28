export type QuirkRule
    = | { kind: "css-property"; properties: Array<string>; valueFilter?: RegExp }
        | { kind: "css-selector-strip"; selectorIncludes: Array<string> }
        | { kind: "css-at-media-hoist" }
        | { kind: "css-at-font-face-strip" }
        | { kind: "remove-element"; tag: string }
        | { kind: "unwrap-element"; tag: string }
        | { kind: "picture-unwrap" }
        | { kind: "placeholder-element"; tag: string; label: string };
