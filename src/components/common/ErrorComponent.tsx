export default function ErrorComponent({ error }: { error: Error }) {
    console.dir(error);

    return (
        <div class="d-flex justify-content-center align-items-center h-100 max-vh-100 text-center">
            <div>
                <h1><strong>Welcome to nothingness 🌌</strong></h1>
                <p>You have encountered an unknown force!</p>
                <i class="text-secondary">{error.message}</i>
            </div>
        </div>
    );
}
