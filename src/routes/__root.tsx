import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRoute,
} from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";

import { HydrationScript } from "solid-js/web";
import themeJs from "../theme?url";
import bootstrapJs from "bootstrap/dist/js/bootstrap.bundle.min.js?url";
import styles from "../scss/styles.scss?url";
import Sidebar from "../components/common/Sidebar";
import type { JSX } from "solid-js";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                title: "Tools",
            },
            {
                charset: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
        ],
        links: [
            { rel: "stylesheet", href: styles },
            { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13/font/bootstrap-icons.min.css" },
            {
                rel: "icon",
                type: "image/svg+xml",
                href: "/logo.svg",
            },
        ],
        scripts: [
            { src: themeJs, type: "module", async: true },
            { src: bootstrapJs },
        ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
});

function RootShell({ children }: { children: JSX.Element }) {
    return (
        <html lang="en">
            <head>
                <HydrationScript />
            </head>
            <body>
                <HeadContent />
                <div class="container-fluid">
                    <div class="row flex-column flex-md-row min-vh-100">
                        {children}
                    </div>
                </div>
                <TanStackRouterDevtools />
                <Scripts />
            </body>
        </html>
    );
}

function RootComponent() {
    return (
        <>
            <Sidebar />
            <div class="col max-vh-100 overflow-auto">
                <Outlet />
            </div>
        </>
    );
}
