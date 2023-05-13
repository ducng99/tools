import { Link } from 'react-router-dom';
import { ToolsInfo } from '../tools/ToolsInfo';

import('./Sidebar.css');
import('bootstrap/js/dist/collapse');

export default function Sidebar() {
    return (
        <div className="navbar navbar-dark navbar-expand-lg col-12 col-md-3 col-xl-2 px-sm-2 px-0 bg-dark" id="sidebar">
            <div className="d-flex flex-column align-items-start px-3 pt-2 w-100 text-white">
                <div className="d-flex">
                    <button className="navbar-toggler me-3" type="button" data-bs-toggle="collapse" data-bs-target="#menu" aria-controls="menu" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <h1>Tools</h1>
                </div>

                <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-start collapse navbar-collapse w-100" id="menu">
                    {
                        ToolsInfo.map((info) =>
                            <li className="nav-item" key={info.id}>
                                <Link to={info.id} className="nav-link align-middle px-0">
                                    <span className="ms-1">{info.name}</span>
                                </Link>
                            </li>
                        )
                    }
                    <div className="d-md-none mb-3 w-100">
                        <hr />
                        <small>© 2022 - {new Date().getFullYear()} Thomas Nguyen</small>
                    </div>
                </ul>
                <div className="d-none d-md-block mb-3 w-100">
                    <hr />
                    <small>© 2022 - {new Date().getFullYear()} Thomas Nguyen</small>
                </div>
            </div>
        </div>
    );
}
