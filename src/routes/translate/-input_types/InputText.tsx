import { type TranslateInputProps } from "..";
import type { ChangeEvent } from "../../../utils";

export default function InputText({ sourceText, setSourceText }: TranslateInputProps) {
    function onChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setSourceText(event.currentTarget.value);
    }

    const charCount = () => sourceText().length;

    return (
        <>
            <label class="form-label" for="translate-source-text">Text to translate</label>
            <textarea
                class="form-control"
                id="translate-source-text"
                rows={8}
                placeholder="Paste the text to translate..."
                value={sourceText()}
                onInput={onChange}
            />
            <div class="d-flex justify-content-between text-muted small mt-1">
                <span>{`${charCount().toLocaleString()} character${charCount() === 1 ? "" : "s"}`}</span>
                <span>TranslateGemma has a 2K-token input context.</span>
            </div>
        </>
    );
}
