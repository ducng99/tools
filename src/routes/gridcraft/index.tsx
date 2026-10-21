import { useLocation } from "@solidjs/router";

export default function ToolComponent() {
    document.title = "GridCraft";
    const location = useLocation();

    return (
        <iframe
            src={`/gridcraft-web/index.html${location.search}`}
            title="GridCraft spreadsheet"
            class="w-100 vh-100 border-0 d-block"
            allow="clipboard-read; clipboard-write; fullscreen"
            allowfullscreen
        />
    );
}
