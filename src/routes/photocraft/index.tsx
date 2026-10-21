import { useLocation } from "@solidjs/router";

export default function ToolComponent() {
    document.title = "PhotoCraft";
    const location = useLocation();

    return (
        <iframe
            src={`/photocraft-web/index.html${location.search}`}
            title="PhotoCraft image editor"
            class="w-100 vh-100 border-0 d-block"
            allow="clipboard-read; clipboard-write; fullscreen; local-fonts"
            allowfullscreen
        />
    );
}
