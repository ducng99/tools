import { Link } from "react-router-dom";

export default function Sidebar() {
	return (
		<div className="col-1 border-end" style={{ height: "100vh" }}>
			<h1>Tools</h1>
			<small>By human or machine</small>

			<ul className="nav flex-column">
				<li className="nav-item">
					<Link className="nav-link" to={'csv_swap'}>CSV Swap</Link>
				</li>
				<li className="nav-item">
					<Link className="nav-link" to={'csv_display_table'}>CSV Display Table</Link>
				</li>
			</ul>
		</div>
	)
}