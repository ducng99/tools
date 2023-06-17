export default function Loading() {
    return (
        <div className="d-flex justify-content-center align-items-center h-100 max-vh-100">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
}
