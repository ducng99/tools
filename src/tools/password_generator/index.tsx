import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { generatePassword } from './extension';
import { Tooltip } from 'bootstrap';
import { DEFAULT_SYMBOLS, useStore } from './store';
import { useLoaderData } from 'react-router-dom';

export function Component() {
    const { title } = useLoaderData() as { title: string };

    const passwordCopyButtonRef = useRef<HTMLButtonElement>(null);
    const [passwordCopyTooltip, setPasswordCopyTooltip] = useState<Tooltip | null>(null);
    const passwordCopyTooltipTimeout = useRef<number>(0);

    const [password, setPassword] = useState<string>('');
    const [isPasswordReveal, setIsPasswordReveal] = useState<boolean>(false);
    const options = useStore();

    useEffect(() => {
        document.title = title;

        if (passwordCopyButtonRef.current) {
            const tooltip = new Tooltip(passwordCopyButtonRef.current, {
                title: 'Copied!',
                trigger: 'manual'
            });

            setPasswordCopyTooltip(tooltip);
        }
    }, []);

    const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = event.target;
        options.updateOptions({ [id]: checked });
    };

    const handleLengthChange = (event: ChangeEvent<HTMLInputElement>) => {
        options.updateOptions({ length: parseInt(event.target.value) });
    };

    const handleSymbolChange = (event: ChangeEvent<HTMLInputElement>) => {
        options.updateOptions({ customSymbols: event.target.value });
    };

    const handleResetSymbolsClick = () => {
        options.updateOptions({ customSymbols: DEFAULT_SYMBOLS });
    };

    const handleGenerateClick = () => {
        setPassword(generatePassword(options));
    };

    const handleCopyPassword = () => {
        if (password) {
            clearTimeout(passwordCopyTooltipTimeout.current);
            navigator.clipboard.writeText(password).then(() => {
                passwordCopyTooltip?.show();

                const timeout = setTimeout(() => {
                    passwordCopyTooltip?.hide();
                }, 1000);

                passwordCopyTooltipTimeout.current = timeout;
            }).catch(console.error);
        }
    };

    const handleRevealPassword = () => {
        setIsPasswordReveal(state => !state);
    };

    return (
        <div className="container mt-5">
            <h1>{title}</h1>
            <div className="mb-3">
                <label className="form-label" htmlFor="passwordLength">
                    Password Length:
                </label>
                <input className="form-control" id="passwordLength" type="number" value={options.length} onChange={handleLengthChange} />
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" id="includeUppercase" checked={options.includeUppercase} onChange={handleOptionChange} />
                <label className="form-check-label" htmlFor="includeUppercase">
                    Include Uppercase Letters
                </label>
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" id="includeLowercase" checked={options.includeLowercase} onChange={handleOptionChange} />
                <label className="form-check-label" htmlFor="includeLowercase">
                    Include Lowercase Letters
                </label>
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" id="includeNumbers" checked={options.includeNumbers} onChange={handleOptionChange} />
                <label className="form-check-label" htmlFor="includeNumbers">
                    Include Numbers
                </label>
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" id="includeSymbols" checked={options.includeSymbols} onChange={handleOptionChange} />
                <label className="form-check-label" htmlFor="includeSymbols">
                    Include Symbols
                </label>
            </div>
            {options.includeSymbols && (
                <div className="input-group" role="group">
                    <input className="form-control" type="text" value={options.customSymbols} onChange={handleSymbolChange} />
                    <button className="btn btn-secondary" onClick={handleResetSymbolsClick}><i className="bi bi-arrow-counterclockwise" />&nbsp;Reset</button>
                </div>
            )}

            <button className="btn btn-primary my-3" onClick={handleGenerateClick}>Generate Password</button>

            <div className="input-group" role="group">
                <input className="form-control" type={(isPasswordReveal ? 'text' : 'password')} value={password} onChange={(event) => { setPassword(event.currentTarget.value); }} />
                <button className="btn btn-secondary" onClick={handleRevealPassword}><i className={'bi bi-eye-' + (isPasswordReveal ? 'fill' : 'slash')} />&nbsp;Reveal</button>
                <button className="btn btn-secondary" onClick={handleCopyPassword} ref={passwordCopyButtonRef}><i className="bi bi-clipboard-fill" />&nbsp;Copy</button>
            </div>
        </div>
    );
}
