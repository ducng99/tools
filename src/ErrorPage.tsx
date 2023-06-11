import { useRouteError } from 'react-router-dom';

export default function ErrorPage() {
    const error = useRouteError() as any;

    return (
        <div className="container-fluid min-vh-100 d-flex justify-content-center align-items-center text-center">
            <div>
                <h1><strong>Welcome to nothingness 🌌</strong></h1>
                <p>You have encountered an unknown force!</p>
                { error && <i className="text-secondary">{error.statusText || error.message}</i> }
            </div>
        </div>
    );
}
