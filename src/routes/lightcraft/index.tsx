import { useLocation } from "@solidjs/router";

export default function ToolComponent() {
    document.title = "LightCraft";
    const location = useLocation();

    return (
        <iframe
            src={`/lightcraft-web/index.html${location.search}`}
            title="LightCraft photo editor"
            class="w-100 vh-100 border-0 d-block"
            allow="clipboard-read; clipboard-write; fullscreen; local-fonts"
            allowfullscreen
        />
    );
}
