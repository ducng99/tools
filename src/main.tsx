import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App'
import { ToolsIds } from './tools/ToolsIDs';

import('bootstrap/dist/css/bootstrap.min.css');
import('bootstrap-icons/font/bootstrap-icons.css');

const CSV_Swap = lazy(() => import('./tools/csv_swap'));
const CSV_Display_Table = lazy(() => import('./tools/csv_display_table'));
const PasswordGenerator = lazy(() => import('./tools/password_generator'));

const router = createHashRouter(
	[
		{
			path: "/",
			element: <App />,
			children: [
				{
					path: ToolsIds.CSV_Swap,
					element: <CSV_Swap />
				},
				{
					path: ToolsIds.CSV_Display_Table,
					element: <CSV_Display_Table />
				},
				{
					path: ToolsIds.Password_Generator,
					element: <PasswordGenerator />
				}
			]
		}
	]
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<Suspense fallback={<div>Loading...</div>}>
			<RouterProvider router={router} />
		</Suspense>
	</React.StrictMode>,
)
