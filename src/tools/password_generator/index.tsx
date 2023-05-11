import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { generatePassword } from './extension';
import { Tooltip } from 'bootstrap';
import { DEFAULT_SYMBOLS, useStore } from './store';

function PasswordGenerator() {
    const passwordCopyButtonRef = useRef<HTMLButtonElement>(null);
    const [passwordCopyTooltip, setPasswordCopyTooltip] = useState<Tooltip | null>(null);
    const passwordCopyTooltipTimeout = useRef<number>(0);

    const [password, setPassword] = useState<string>('');
    const options = useStore();

    useEffect(() => {
        document.title = 'Password Generator';

        if (passwordCopyButtonRef.current) {
            const tooltip = new Tooltip(passwordCopyButtonRef.current, {
                title: 'Copied!',
                trigger: 'manual'
            });

            setPasswordCopyTooltip(tooltip);
        }
    }, []);

    const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        options.updateOptions({ [name]: checked });
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

    return (
        <div className="container mt-5">
            <h1>Password Generator</h1>
            <div className="mb-3">
                <label className="form-label">
                    Password Length:
                </label>
                <input className="form-control" type="number" value={options.length} onChange={handleLengthChange} />
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" name="includeUppercase" checked={options.includeUppercase} onChange={handleOptionChange} />
                <label className="form-check-label">
                    Include Uppercase Letters
                </label>
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" name="includeLowercase" checked={options.includeLowercase} onChange={handleOptionChange} />
                <label className="form-check-label">
                    Include Lowercase Letters
                </label>
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" name="includeNumbers" checked={options.includeNumbers} onChange={handleOptionChange} />
                <label className="form-check-label">
                    Include Numbers
                </label>
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" name="includeSymbols" checked={options.includeSymbols} onChange={handleOptionChange} />
                <label className="form-check-label">
                    Include Symbols
                </label>
            </div>
            {options.includeSymbols && (
                <div className="input-group" role="group">
                    <input className="form-control" type="text" name="customSymbols" value={options.customSymbols} onChange={handleSymbolChange} />
                    <button className="btn btn-secondary" onClick={handleResetSymbolsClick}><i className="bi bi-arrow-counterclockwise" /></button>
                </div>
            )}

            <button className="btn btn-primary my-3" onClick={handleGenerateClick}>Generate Password</button>

            <div className="input-group" role="group">
                <input className="form-control" type="text" value={password} readOnly />
                <button className="btn btn-secondary" onClick={handleCopyPassword} ref={passwordCopyButtonRef}><i className="bi bi-clipboard-fill" /></button>
            </div>
        </div>
    );
}

export default PasswordGenerator;
