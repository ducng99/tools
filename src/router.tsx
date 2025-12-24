import { createRouter } from "@tanstack/solid-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import Loading from "./components/common/Loading";

// Create a new router instance
export const getRouter = () => {
    const router = createRouter({
        routeTree,
        scrollRestoration: true,
        defaultPreloadStaleTime: 0,
        defaultPendingComponent: Loading,
    });

    return router;
};
