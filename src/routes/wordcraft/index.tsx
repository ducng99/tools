import { useLocation } from "@solidjs/router";

export default function ToolComponent() {
    document.title = "WordCraft";
    const location = useLocation();

    return (
        <iframe
            src={`/wordcraft-web/index.html${location.search}`}
            title="WordCraft word processor"
            class="w-100 vh-100 border-0 d-block"
            allow="clipboard-read; clipboard-write; fullscreen; local-fonts"
            allowfullscreen
        />
    );
}
