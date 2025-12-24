//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

export default [
    ...tanstackConfig,
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    stylistic.configs.customize({
        indent: 4,
        semi: true,
        jsx: true,
        quotes: "double",
    }),
    {
        rules: {
            "import/no-anonymous-default-export": "off",
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    fixStyle: "inline-type-imports",
                },
            ],
            "@typescript-eslint/no-unused-vars": "warn",
            "@stylistic/space-before-function-paren": [
                "error",
                {
                    anonymous: "always",
                    named: "never",
                    asyncArrow: "always",
                },
            ],
            "@stylistic/indent": [
                "error",
                4,
                {
                    offsetTernaryExpressions: false,
                    SwitchCase: 1,
                },
            ],
            "no-shadow": "off",
        },
    },
];
