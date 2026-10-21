import { useLocation } from "@solidjs/router";

export default function ToolComponent() {
    document.title = "FilmCraft";
    const location = useLocation();

    return (
        <iframe
            src={`/filmcraft-web/index.html${location.search}`}
            title="FilmCraft video editor"
            class="w-100 vh-100 border-0 d-block"
            allow="clipboard-read; clipboard-write; fullscreen; local-fonts"
            allowfullscreen
        />
    );
}
