import {
    HeadContent,
    Scripts,
    createRootRoute,
} from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";

import { HydrationScript } from "solid-js/web";
import NotFoundComponent from "../components/common/NotFound";
import ErrorComponent from "../components/common/ErrorComponent";
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
            { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css" },
        ],
        scripts: [
            { src: "https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/js/bootstrap.bundle.min.js", type: "text/javascript" },
        ],
    }),
    shellComponent: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
});

function RootComponent({ children }: { children: JSX.Element }) {
    return (
        <html lang="en">
            <head>
                <HydrationScript />
            </head>
            <body>
                <HeadContent />
                <div class="container-fluid">
                    <div class="row flex-column flex-md-row min-vh-100">
                        {/* <Sidebar /> */}
                        <div class="col">
                            {children}
                        </div>
                    </div>
                </div>
                <TanStackRouterDevtools />
                <Scripts />
            </body>
        </html>
    );
}
