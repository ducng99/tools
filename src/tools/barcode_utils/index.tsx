import BarcodeReader from './BarcodeReader';

export function Component() {
    return (
        <div className="container mt-5">
            <h1>{document.title}</h1>

            <BarcodeReader />
        </div>
    );
}
