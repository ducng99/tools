import { useLocation } from "@solidjs/router";

export default function ToolComponent() {
    document.title = "PdfCraft";
    const location = useLocation();

    return (
        <iframe
            src={`/pdfcraft-web/index.html${location.search}`}
            title="PdfCraft PDF editor"
            class="w-100 vh-100 border-0 d-block"
            allow="clipboard-read; clipboard-write; fullscreen; local-fonts"
            allowfullscreen
        />
    );
}
