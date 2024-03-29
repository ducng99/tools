import { NavLink } from 'react-router-dom';
import { ToolsInfo } from '../tools/ToolsInfo';
import SidebarFooter from './SidebarFooter';
import { lazy, useEffect, useRef } from 'react';
import { type Collapse } from 'bootstrap';

import('bootstrap/js/dist/dropdown');

const ThemeToggle = lazy(() => import('./ThemeToggle'));

export default function Sidebar() {
    const sidebarContentRef = useRef<HTMLDivElement>(null);
    const sidebarCollapseRef = useRef<Collapse | null>(null);

    useEffect(() => {
        (async () => {
            const Collapse = (await import('bootstrap/js/dist/collapse')).default;
            sidebarCollapseRef.current = new Collapse(sidebarContentRef.current as HTMLDivElement, { toggle: false });
        })();
    }, []);

    const hideSidebar = () => {
        sidebarCollapseRef.current?.hide();
    };

    const toggleSidebar = () => {
        sidebarCollapseRef.current?.toggle();
    };

    return (
        <div className="navbar navbar-expand-md bg-body-tertiary col-12 col-md-3 col-xl-2" id="sidebar">
            <div className="container-fluid flex-column align-items-start h-100">
                <div className="d-flex align-items-center w-100">
                    <button className="navbar-toggler me-3" type="button" onClick={toggleSidebar} aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="navbar-brand">Tools</div>
                    <div className="ms-auto nav-item dropdown">
                        <ThemeToggle />
                    </div>
                </div>

                <div className="collapse navbar-collapse flex-column align-items-start w-100" id="sidebarContent" ref={sidebarContentRef}>
                    <ul className="navbar-nav flex-column">
                        {
                            ToolsInfo.map(tool =>
                                <li className="nav-item" key={tool.id}>
                                    <NavLink to={tool.id} className="nav-link" onClick={hideSidebar}>
                                        <span className="ms-1">{tool.name}</span>
                                    </NavLink>
                                </li>
                            )
                        }
                    </ul>
                    <div className="mt-auto w-100">
                        <SidebarFooter />
                    </div>
                </div>
            </div>
        </div>
    );
}
