import { createEffect } from "solid-js";
import { ClientOnly, Link } from "@tanstack/solid-router";
import SidebarFooter from "./SidebarFooter";
import ThemeToggle from "./ThemeToggle";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
    let sidebarContentRef: HTMLDivElement | undefined;
    let sidebarCollapseRef: globalThis.bootstrap.Collapse | undefined;

    createEffect(() => {
        if (sidebarContentRef)
            sidebarCollapseRef = new globalThis.bootstrap.Collapse(sidebarContentRef, { toggle: false });
    });

    const hideSidebar = () => {
        sidebarCollapseRef?.hide();
    };

    const toggleSidebar = () => {
        sidebarCollapseRef?.toggle();
    };

    return (
        <div class={`navbar navbar-expand-md bg-body-tertiary col-12 col-md-3 col-xl-2 ${styles.sidebar}`}>
            <div class="container-fluid flex-column align-items-start h-100">
                <div class="d-flex align-items-center w-100">
                    <button class="navbar-toggler me-3" type="button" onClick={toggleSidebar} aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="navbar-brand">Tools</div>
                    <div class="ms-auto nav-item dropdown">
                        <ClientOnly>
                            <ThemeToggle />
                        </ClientOnly>
                    </div>
                </div>

                <div class={`collapse navbar-collapse flex-column align-items-start w-100 ${styles.sidebarContent}`} ref={sidebarContentRef}>
                    <ul class="navbar-nav flex-column">
                        <li class="nav-item">
                            <Link to="/csv_to_table" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>CSV to table</span>
                            </Link>
                            <Link to="/csv_swap" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>CSV Swap</span>
                            </Link>
                            <Link to="/password_generator" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>Password generator</span>
                            </Link>
                            <Link to="/barcode_reader" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>Barcode reader</span>
                            </Link>
                            <Link to="/barcode_writer" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>Barcode writer</span>
                            </Link>
                        </li>
                    </ul>
                    <div class="mt-auto w-100">
                        <SidebarFooter />
                    </div>
                </div>
            </div>
        </div>
    );
}
