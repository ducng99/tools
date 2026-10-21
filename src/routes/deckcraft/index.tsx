import { useLocation } from "@solidjs/router";

export default function ToolComponent() {
    document.title = "DeckCraft";
    const location = useLocation();

    return (
        <iframe
            src={`/deckcraft-web/index.html${location.search}`}
            title="DeckCraft presentation designer"
            class="w-100 vh-100 border-0 d-block"
            allow="clipboard-read; clipboard-write; fullscreen"
            allowfullscreen
        />
    );
}
