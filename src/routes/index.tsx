export default function App() {
    return (
        <div class="container-fluid min-vh-100 d-flex flex-column justify-content-center align-items-center text-center">
            <h1 class="mb-4">
                Just Tools
            </h1>
            <div class="text-muted mb-5 text-center" style={{ "max-width": "40em" }}>
                A collection of free, open-sourced, no-fuss browser utilities - barcodes, CSV wrangling, OCR,
                password generation, translation and more.
            </div>
            <h3>
                {"Just pick one on the "}
                <span id="sidebar-indicator"></span>
                {" mate 🤷‍♀️"}
            </h3>
        </div>
    );
}
