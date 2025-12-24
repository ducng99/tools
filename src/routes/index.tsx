import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
    return (
        <div class="container-fluid min-vh-100 d-flex justify-content-center align-items-center text-center">
            <div>
                <h2>
                    {"Choose a tool on the "}
                    <span id="sidebar-indicator"></span>
                    {" mate 🤷‍♀️"}
                </h2>
            </div>
        </div>
    );
}
