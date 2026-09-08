import type { ParentProps } from "solid-js";
import Sidebar from "./Sidebar";

export default function Layout(props: ParentProps) {
    return (
        <div class="container-fluid">
            <div class="row flex-column flex-md-row min-vh-100">
                <Sidebar />
                <div class="col max-vh-100 overflow-auto">
                    {props.children}
                </div>
            </div>
        </div>
    );
}
