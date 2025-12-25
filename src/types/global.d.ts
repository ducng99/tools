import type Bootstrap from "bootstrap";

declare namespace globalThis {
    const bootstrap: typeof Bootstrap;
}
