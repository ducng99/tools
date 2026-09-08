import { createEffect } from "solid-js";
import { A } from "@solidjs/router";
import SidebarFooter from "./SidebarFooter";
import ThemeToggle from "./ThemeToggle";
import styles from "./Sidebar.module.css";
import { Collapse } from "bootstrap";

export default function Sidebar() {
    // eslint-disable-next-line no-unassigned-vars
    let sidebarContentRef: HTMLDivElement | undefined;
    let sidebarCollapseRef: Collapse | undefined;

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

    return (
        <div class={`navbar navbar-expand-md bg-body-tertiary col-12 col-md-3 col-xl-2 ${styles.sidebar}`}>
            <div class="container-fluid flex-column align-items-start h-100">
                <div class="d-flex align-items-center w-100">
                    <button class="navbar-toggler me-3" type="button" onClick={toggleSidebar} aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="navbar-brand">Tools</div>
                    <div class="ms-auto nav-item dropdown">
                        <ThemeToggle />
                    </div>
                </div>

                <div class={`collapse navbar-collapse flex-column align-items-start w-100 ${styles.sidebarContent}`} ref={sidebarContentRef}>
                    <ul class="navbar-nav flex-column">
                        <li class="nav-item">
                            <A href="/csv_to_table" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>CSV to table</span>
                            </A>
                            <A href="/csv_swap" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>CSV Swap</span>
                            </A>
                            <A href="/password_generator" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>Password generator</span>
                            </A>
                            <A href="/barcode_reader" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>Barcode reader</span>
                            </A>
                            <A href="/barcode_writer" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>Barcode writer</span>
                            </A>
                            <A href="/htmlcheck" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>HTML Email Checker</span>
                            </A>
                            <A href="/ocr" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>OCR</span>
                            </A>
                            <A href="/translate" class="nav-link" onClick={hideSidebar}>
                                <span class={styles.linkText}>Translate</span>
                            </A>
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
