import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRouteWithContext,
} from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";

import { HydrationScript } from "solid-js/web";
import { Suspense } from "solid-js";

import styleCss from "../styles.css?url";

export const Route = createRootRouteWithContext()({
    head: () => ({
        links: [
            { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" },
            { rel: "stylesheet", href: styleCss },
        ],
        scripts: [
            { src: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" },
        ],
    }),
    shellComponent: RootComponent,
});

function RootComponent() {
    return (
        <html>
            <head>
                <HydrationScript />
            </head>
            <body>
                <HeadContent />
                <Suspense>
                    <Outlet />
                    <TanStackRouterDevtools />
                </Suspense>
                <Scripts />
            </body>
        </html>
    );
}
