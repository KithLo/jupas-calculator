import path from "path"
import ViteYaml from "@modyfi/vite-plugin-yaml"
// eslint-disable-next-line import/no-unresolved
import devtools from "solid-devtools/vite"
import { defineConfig, loadEnv } from "vite"
import solidPlugin from "vite-plugin-solid"

const DATA_PROXY_PORT = 55555

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd())

    return {
        base: "/jupas-calculator",
        resolve: {
            alias: [{ find: "@", replacement: path.resolve() }],
        },
        plugins: [
            // For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
            devtools({ autoname: true }),
            solidPlugin(),
            ViteYaml(),
        ],
        server: {
            port: 3000,
            proxy: {
                [env.VITE_DATA_BASE_PATH]: {
                    target: `http://127.0.0.1:${DATA_PROXY_PORT}`,
                    rewrite: (path) =>
                        path
                            .slice(env.VITE_DATA_BASE_PATH.length)
                            .replace(/^\/\w+\//, "/"),
                },
            },
        },
        build: {
            target: "esnext",
        },
    }
})
