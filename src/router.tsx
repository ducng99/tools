import { createRouter, ErrorComponent } from "@tanstack/solid-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import Loading from "./components/common/Loading";
import NotFoundComponent from "./components/common/NotFound";

// Create a new router instance
export const getRouter = () => {
    const router = createRouter({
        routeTree,
        scrollRestoration: true,
        defaultPreloadStaleTime: 0,
        defaultNotFoundComponent: NotFoundComponent,
        defaultErrorComponent: ErrorComponent,
        defaultPendingComponent: Loading,
        defaultPendingMs: 150,
        defaultPendingMinMs: 300,
    });

    return router;
};
