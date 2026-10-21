import { For, Show, createEffect, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import SidebarFooter from "./SidebarFooter";
import ThemeToggle from "./ThemeToggle";
import styles from "./Sidebar.module.css";
import { Collapse } from "bootstrap";

const tools = [
    { href: "/csv_to_table", icon: "bi-table", label: "CSV to table" },
    { href: "/csv_swap", icon: "bi-arrow-left-right", label: "CSV Swap" },
    { href: "/password_generator", icon: "bi-key", label: "Password generator" },
    { href: "/barcode_reader", icon: "bi-upc-scan", label: "Barcode reader" },
    { href: "/barcode_writer", icon: "bi-upc", label: "Barcode writer" },
    { href: "/htmlcheck", icon: "bi-envelope-check", label: "HTML Email Checker" },
    { href: "/ocr", icon: "bi-alphabet-uppercase", label: "OCR" },
    { href: "/translate", icon: "bi-translate", label: "Translate" },
    { href: "/wordcraft", icon: "bi-file-earmark-word", label: "WordCraft" },
];

export default function Sidebar() {
    // eslint-disable-next-line no-unassigned-vars
    let sidebarContentRef: HTMLDivElement | undefined;
    let sidebarCollapseRef: Collapse | undefined;

    const [collapsed, setCollapsed] = createSignal(localStorage.getItem("sidebarCollapsed") === "true");

    createEffect(() => {
        if (sidebarContentRef)
            sidebarCollapseRef = new Collapse(sidebarContentRef, { toggle: false });
    });

    const hideSidebar = () => {
        sidebarCollapseRef?.hide();
    };

    const toggleSidebar = () => {
        sidebarCollapseRef?.toggle();
    };

    const toggleCollapsed = () => {
        setCollapsed((previous) => {
            localStorage.setItem("sidebarCollapsed", String(!previous));
            return !previous;
        });
    };

    return (
        <div
            class={`navbar navbar-expand-md bg-body-tertiary col-12 col-md-3 col-xl-2 ${styles.sidebar}`}
            classList={{ [styles.collapsed]: collapsed() }}
        >
            <div class="container-fluid flex-column align-items-start h-100">
                <div class={`d-flex align-items-center w-100 ${styles.header}`}>
                    <button class="navbar-toggler me-3" type="button" onClick={toggleSidebar} aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <Show when={!collapsed()}>
                        <div class="navbar-brand">Tools</div>
                    </Show>
                    <div class="ms-auto nav-item dropdown">
                        <ThemeToggle />
                    </div>
                    <button
                        type="button"
                        class={`nav-link d-none d-md-flex ms-1 ${styles.collapseToggle}`}
                        onClick={toggleCollapsed}
                        aria-label={collapsed() ? "Expand sidebar" : "Collapse sidebar"}
                        title={collapsed() ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <i class={`bi ${collapsed() ? "bi-chevron-right" : "bi-chevron-left"}`} aria-hidden="true"></i>
                    </button>
                </div>

                <div class={`collapse navbar-collapse flex-column align-items-start w-100 ${styles.sidebarContent}`} ref={sidebarContentRef}>
                    <ul class="navbar-nav flex-column w-100">
                        <For each={tools}>
                            {tool => (
                                <li class="nav-item">
                                    <A href={tool.href} class={`nav-link ${styles.navLink}`} onClick={hideSidebar} title={tool.label}>
                                        <i class={`bi ${tool.icon}`} aria-hidden="true"></i>
                                        <span class={styles.linkText}>{tool.label}</span>
                                    </A>
                                </li>
                            )}
                        </For>
                    </ul>
                    <div class="mt-auto w-100">
                        <SidebarFooter />
                    </div>
                </div>
            </div>
        </div>
    );
}
