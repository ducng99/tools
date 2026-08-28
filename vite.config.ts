import { defineConfig, type Plugin } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/solid-start/plugin/vite";
import solidPlugin from "vite-plugin-solid";
import { cloudflare } from "@cloudflare/vite-plugin";

/**
 * The onnxruntime-web bundle statically references the WASM binary via
 *   `new URL("ort-wasm-simd-threaded.asyncify.wasm", import.meta.url)`,
 * which causes Vite to copy the ~23 MB file into the build output. This is
 * far too large for Cloudflare's 3 MB file-size limit on Pages/Workers.
 *
 * At runtime, transformers.js points `ort.env.wasm.wasmPaths` at a CDN
 * (jsDelivr by default), so ORT fetches the WASM from there and never
 * touches the local copy. This plugin simply strips the local copy from
 * the bundle so we can deploy to Cloudflare.
 */
function excludeOnnxWasm(): Plugin {
    return {
        name: "exclude-onnx-wasm",
        apply: "build",
        enforce: "post",
        generateBundle(_options, bundle) {
            for (const fileName of Object.keys(bundle)) {
                if (fileName.includes("ort-wasm-simd-threaded") && fileName.endsWith(".wasm")) {
                    delete bundle[fileName];
                }
            }
        },
    };
}

export default defineConfig({
    plugins: [
        devtools(),
        cloudflare({ viteEnvironment: { name: "ssr" } }),
        // this is the plugin that enables path aliases
        tanstackStart(),
        solidPlugin({ ssr: true }),
        excludeOnnxWasm(),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
                silenceDeprecations: ["import"],
            },
        },
    },
});
