import { Show, onCleanup } from "solid-js";
import { type TranslateInputProps } from "..";
import { formatBytes } from "../-extension";
import type { ChangeEvent } from "../../../utils";

export default function InputImage(props: TranslateInputProps) {
    // eslint-disable-next-line no-unassigned-vars
    let imageFileInputRef: HTMLInputElement | undefined;
    // eslint-disable-next-line no-unassigned-vars
    let imagePreviewRef: HTMLImageElement | undefined;

    // File metadata for the caption only; the image bytes themselves live in the
    // parent's `uploadedImageDataUrl` signal so a paste-elsewhere flow can populate it.
    let lastFileName = "";
    let lastFileSize = 0;

    onCleanup(() => {
        if (imagePreviewRef?.src.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreviewRef.src);
        }
    });

    const handleImageUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
        props.setImageUrl(event.currentTarget.value);
    };

    const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        loadImageFile(file);
    };

    const handleImageDragOver = (event: DragEvent) => {
        event.preventDefault();
    };

    const handleImageDrop = (event: DragEvent) => {
        event.preventDefault();
        const file = event.dataTransfer?.files?.[0];
        if (file && file.type.startsWith("image/")) {
            if (imageFileInputRef) {
                imageFileInputRef.value = "";
            }
            loadImageFile(file);
        }
    };

    const loadImageFile = (file: File | undefined) => {
        if (!file) {
            props.setUploadedImageDataUrl("");
            lastFileName = "";
            lastFileSize = 0;
            return;
        }
        if (!file.type.startsWith("image/")) {
            return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            const dataUrl = String(reader.result || "");
            lastFileName = file.name;
            lastFileSize = file.size;
            props.setUploadedImageDataUrl(dataUrl);
        });
        reader.readAsDataURL(file);
    };

    const hasUploadedImage = () => props.uploadedImageDataUrl().length > 0;
    const hasImageUrl = () => props.imageUrl().trim().length > 0;

    return (
        <div
            class="p-3 border border-2 border-dashed rounded"
            onDragOver={handleImageDragOver}
            onDrop={handleImageDrop}
        >
            <div class="mb-3">
                <label class="form-label" for="translate-image-url">Image URL</label>
                <input
                    class="form-control"
                    id="translate-image-url"
                    type="url"
                    placeholder="https://example.com/sign.jpg"
                    value={props.imageUrl()}
                    onInput={handleImageUrlChange}
                />
            </div>
            <div class="d-flex align-items-center gap-2 my-3">
                <hr class="flex-grow-1 m-0" />
                <span class="text-muted small">or</span>
                <hr class="flex-grow-1 m-0" />
            </div>
            <div class="mb-2">
                <label class="form-label" for="translate-image-file">Choose an image file</label>
                <input
                    class="form-control"
                    id="translate-image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    ref={imageFileInputRef}
                />
                <small class="text-muted d-block mt-1">
                    You can also paste an image anywhere on this page, or drag and drop one here.
                    {" "}
                    The file is converted to a data URL; your API server must accept data URLs for image loading.
                </small>
            </div>
            <Show when={hasUploadedImage() || hasImageUrl()}>
                <figure class="mt-3 mb-0">
                    <img
                        id="translate-image-preview"
                        class="img-fluid rounded border bg-dark"
                        style={{ "max-height": "320px", "object-fit": "contain" }}
                        src={props.uploadedImageDataUrl() || props.imageUrl().trim()}
                        alt="Selected image preview"
                        ref={imagePreviewRef}
                    />
                    <Show when={hasUploadedImage() && lastFileName}>
                        <figcaption class="text-muted small mt-2">
                            {`${lastFileName} - ${formatBytes(lastFileSize)}`}
                        </figcaption>
                    </Show>
                </figure>
            </Show>
        </div>
    );
}
