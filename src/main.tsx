import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { ToolsInfo } from './tools/ToolsInfo';
import Loading from './Loading';
import ErrorPage from './ErrorPage';

import('./scss/styles.scss');
import('bootstrap-icons/font/bootstrap-icons.css');

const router = createHashRouter([
    {
        path: '/',
        element: <App />,
        errorElement: <ErrorPage />,
        children: [
            {
                errorElement: <ErrorPage />,
                children: [
                    {
                        index: true,
                        lazy: () => import('./tools')
                    },
                    ...ToolsInfo.map(tool => ({
                        path: tool.id,
                        loader: async () => {
                            document.title = tool.name;
                            return null;
                        },
                        lazy: tool.element
                    })),
                    {
                        path: '*',
                        lazy: () => import('./NotFound')
                    }
                ]
            }
        ]
    }
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Suspense fallback={<Loading />}>
            <RouterProvider router={router} />
        </Suspense>
    </React.StrictMode>
);
