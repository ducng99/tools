import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App'

import('bootstrap/dist/css/bootstrap.min.css');
import('bootstrap-icons/font/bootstrap-icons.css');

const CSV_Swap = lazy(() => import('./tools/csv_swap'));
const CSV_Display_Table = lazy(() => import('./tools/csv_display_table'));

const router = createBrowserRouter(
	[
		{
			path: "/",
			element: <App />,
			children: [
				{
					path: "csv_swap",
					element: <CSV_Swap />
				},
				{
					path: "csv_display_table",
					element: <CSV_Display_Table />
				}
			]
		}
	],
	{
		basename: '/tools'
	}
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<Suspense fallback={<div>Loading...</div>}>
			<RouterProvider router={router} />
		</Suspense>
	</React.StrictMode>,
)
