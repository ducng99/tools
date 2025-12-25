import styles from "./Sidebar.module.css";

function SidebarFooter() {
    return (
        <>
            <hr />
            <footer>
                <small>&copy; 2022 - 2025 Thomas Nguyen</small>
                <br />
                <a href="https://github.com/ducng99/tools" class={`text-decoration-none ${styles.footerLink}`} target="_blank" rel="noreferrer"><i class="bi bi-github" /></a>
                <small>
                    {" Code licensed "}
                    <a class={`text-decoration-none ${styles.footerLink}`} href="https://github.com/ducng99/tools/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT</a>
                </small>
            </footer>
        </>
    );
}

export default SidebarFooter;
