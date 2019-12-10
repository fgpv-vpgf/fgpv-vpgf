module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "@typescript-eslint/tslint",
        "no-null"
    ],
    "rules": {
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/ban-types": "error",
        "@typescript-eslint/class-name-casing": "error",
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/consistent-type-definitions": "error",
        "@typescript-eslint/explicit-member-accessibility": [
            "off",
            {
                "accessibility": "explicit"
            }
        ],
        "@typescript-eslint/indent": "error",
        "@typescript-eslint/interface-name-prefix": "error",
        "@typescript-eslint/member-delimiter-style": [
            "off",
            "error",
            {
                "multiline": {
                    "delimiter": "none",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/member-ordering": "off",
        "@typescript-eslint/no-empty-function": "error",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-this-alias": "error",
        "@typescript-eslint/no-unnecessary-qualifier": "error",
        "@typescript-eslint/no-use-before-declare": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/quotes": "off",
        "@typescript-eslint/semi": [
            "off",
            null
        ],
        "@typescript-eslint/triple-slash-reference": "error",
        "@typescript-eslint/type-annotation-spacing": "error",
        "@typescript-eslint/unified-signatures": "error",
        "arrow-body-style": "off",
        "arrow-parens": [
            "off",
            "as-needed"
        ],
        "camelcase": "error",
        "capitalized-comments": "off",
        "comma-dangle": "off",
        "complexity": "off",
        "constructor-super": "error",
        "curly": [
            "error",
            "multi-line"
        ],
        "dot-notation": "error",
        "eol-last": "off",
        "eqeqeq": [
            "error",
            "smart"
        ],
        "guard-for-in": "off",
        "id-blacklist": [
            "error",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
            "undefined"
        ],
        "id-match": "error",
        "import/no-internal-modules": "off",
        "import/order": "off",
        "max-classes-per-file": "off",
        "max-len": "off",
        "new-parens": "error",
        "no-bitwise": "off",
        "no-caller": "error",
        "no-cond-assign": "off",
        "no-console": "off",
        "no-debugger": "off",
        "no-duplicate-case": "error",
        "no-duplicate-imports": "error",
        "no-empty": "error",
        "no-eval": "off",
        "no-extra-bind": "error",
        "no-fallthrough": "error",
        "no-invalid-this": "off",
        "no-multiple-empty-lines": "off",
        "no-new-func": "error",
        "no-new-wrappers": "error",
        "no-null/no-null": "error",
        "no-redeclare": "error",
        "no-return-await": "error",
        "no-sequences": "off",
        "no-shadow": [
            "off",
            {
                "hoist": "all"
            }
        ],
        "no-sparse-arrays": "error",
        "no-template-curly-in-string": "error",
        "no-throw-literal": "error",
        "no-trailing-spaces": "off",
        "no-undef-init": "error",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "error",
        "no-unused-labels": "error",
        "no-var": "error",
        "object-shorthand": "error",
        "one-var": [
            "off",
            "never"
        ],
        "prefer-const": "error",
        "prefer-object-spread": "error",
        "quote-props": "off",
        "radix": "off",
        "space-before-function-paren": "off",
        "spaced-comment": [
            "off",
            "never"
        ],
        "use-isnan": "error",
        "valid-typeof": "off",
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "import-spacing": true,
                    "jsdoc-format": true,
                    "no-reference-import": true,
                    "one-line": [
                        true,
                        "check-open-brace",
                        "check-whitespace"
                    ],
                    "whitespace": [
                        true,
                        "check-branch",
                        "check-decl",
                        "check-operator",
                        "check-module",
                        "check-separator",
                        "check-type"
                    ]
                }
            }
        ]
    }
};
