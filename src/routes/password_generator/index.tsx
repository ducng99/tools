import { Tooltip } from "bootstrap";
import { createFileRoute } from "@tanstack/solid-router";
import { createEffect, createSignal } from "solid-js";
import { generatePassword } from "./-extension";
import { DEFAULT_SYMBOLS, PasswordOptionsStore, updateOptions } from "./-store";
import type { ChangeEvent } from "../../utils";

export const Route = createFileRoute("/password_generator/")({
    head: () => ({
        meta: [
            {
                title: "Password Generator",
            },
        ],
    }),
    component: Component,
});

function Component() {
    let passwordCopyButtonRef: HTMLButtonElement | undefined;
    let passwordCopyTooltip: Tooltip | undefined;
    let passwordCopyTooltipTimeout = 0;

    const [password, setPassword] = createSignal<string>("");
    const [isPasswordReveal, setIsPasswordReveal] = createSignal<boolean>(false);
    const [options] = PasswordOptionsStore;

    createEffect(() => {
        passwordCopyTooltip = new Tooltip(passwordCopyButtonRef as HTMLButtonElement, {
            title: "Copied!",
            trigger: "manual",
        });
    });

    const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = event.currentTarget;
        updateOptions({ [id]: checked });
    };

    const handleLengthChange = (event: ChangeEvent<HTMLInputElement>) => {
        updateOptions({ length: parseInt(event.currentTarget.value) });
    };

    const handleSymbolChange = (event: ChangeEvent<HTMLInputElement>) => {
        updateOptions({ customSymbols: event.currentTarget.value });
    };

    const handleResetSymbolsClick = () => {
        updateOptions({ customSymbols: DEFAULT_SYMBOLS });
    };

    const handleGenerateClick = () => {
        setPassword(generatePassword(options));
    };

    const handleCopyPassword = () => {
        const _password = password();
        if (_password) {
            window.clearTimeout(passwordCopyTooltipTimeout);
            navigator.clipboard.writeText(_password).then(() => {
                passwordCopyTooltip?.show();

                const timeout = window.setTimeout(() => {
                    passwordCopyTooltip?.hide();
                }, 1000);

                passwordCopyTooltipTimeout = timeout;
            }).catch(console.error);
        }
    };

    const handleRevealPassword = () => {
        setIsPasswordReveal(state => !state);
    };

    return (
        <div class="container mt-5">
            <h1>Password Generator</h1>

            <div class="mb-3">
                <label class="form-label" for="passwordLength">
                    Password Length:
                </label>
                <input class="form-control" id="passwordLength" type="number" value={options.length} onChange={handleLengthChange} />
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="includeUppercase" checked={options.includeUppercase} onChange={handleOptionChange} />
                <label class="form-check-label" for="includeUppercase">
                    Include Uppercase Letters
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="includeLowercase" checked={options.includeLowercase} onChange={handleOptionChange} />
                <label class="form-check-label" for="includeLowercase">
                    Include Lowercase Letters
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="includeNumbers" checked={options.includeNumbers} onChange={handleOptionChange} />
                <label class="form-check-label" for="includeNumbers">
                    Include Numbers
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="includeSymbols" checked={options.includeSymbols} onChange={handleOptionChange} />
                <label class="form-check-label" for="includeSymbols">
                    Include Symbols
                </label>
            </div>
            {options.includeSymbols && (
                <div class="input-group" role="group">
                    <input class="form-control" id="customSymbols" type="text" value={options.customSymbols} onChange={handleSymbolChange} />
                    <button class="btn btn-secondary" onClick={handleResetSymbolsClick}>
                        <i class="bi bi-arrow-counterclockwise" />
                        <span class="d-none d-md-inline">&nbsp;Reset</span>
                    </button>
                </div>
            )}

            <button class="btn btn-primary my-3" id="generateButton" onClick={handleGenerateClick}>Generate Password</button>

            <div class="input-group" role="group">
                <input class="form-control" id="passwordOutput" type={(isPasswordReveal() ? "text" : "password")} value={password()} onChange={(event) => { setPassword(event.currentTarget.value); }} />
                <button class="btn btn-secondary" onClick={handleRevealPassword}>
                    <i class={"bi bi-eye-" + (isPasswordReveal() ? "fill" : "slash")} />
                    <span class="d-none d-md-inline">&nbsp;Reveal</span>
                </button>
                <button class="btn btn-secondary" onClick={handleCopyPassword} ref={passwordCopyButtonRef}>
                    <i class="bi bi-clipboard-fill" />
                    <span class="d-none d-md-inline">&nbsp;Copy</span>
                </button>
            </div>
        </div>
    );
}
