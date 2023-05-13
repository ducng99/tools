export default function Loading() {
    return (
        <div className="container-fluid h-100">
            <div className="row h-100">
                <div className="col h-100">
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
