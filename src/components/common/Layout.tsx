import type { ParentProps } from "solid-js";
import Sidebar from "./Sidebar";

export default function Layout(props: ParentProps) {
    return (
        <div class="d-flex flex-column flex-md-row min-vh-100">
            <Sidebar />
            <div class="flex-grow-1 max-vh-100 overflow-auto">
                {props.children}
            </div>
        </div>
    );
}
