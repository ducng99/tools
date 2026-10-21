export default function App() {
    return (
        <div class="container-fluid min-vh-100 d-flex flex-column justify-content-center align-items-center text-center">
            <h3>
                {"Just pick a tool on the "}
                <span id="sidebar-indicator"></span>
                {" mate 🤷‍♀️"}
            </h3>
            <div class="text-muted mt-2 text-center" style={{ "max-width": "40em" }}>
                A collection of free, open-sourced, client-side-only utilities
            </div>
        </div>
    );
}
