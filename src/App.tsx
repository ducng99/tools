import { Outlet } from 'react-router-dom'
import Sidebar from './common/Sidebar'

function App() {
	return (
		<div className="container-fluid">
			<div className="row">
				<Sidebar />
				<div className="col">
					<Outlet />
				</div>
			</div>
		</div>
	)
}

export default App
