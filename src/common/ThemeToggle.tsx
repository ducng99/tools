import { useEffect, useMemo, useState } from 'react';
import { toFirstUpperCase } from '../Utils';

type ColourScheme = 'light' | 'dark' | 'auto';

const getStoredTheme = () => localStorage.getItem('theme') as ColourScheme | null;
const setStoredTheme = (theme: ColourScheme) => { localStorage.setItem('theme', theme); };

const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
        return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const setTheme = (theme: ColourScheme) => {
    if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }
};

export default function ThemeToggle() {
    const [currentTheme, setCurrentTheme] = useState<ColourScheme>(getPreferredTheme());

    useEffect(() => {
        setTheme(getPreferredTheme());

        const onPreferedColorSchemeChange = () => {
            const storedTheme = getStoredTheme();
            if (storedTheme !== 'light' && storedTheme !== 'dark') {
                setTheme(getPreferredTheme());
            }
        };

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onPreferedColorSchemeChange);

        return () => {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', onPreferedColorSchemeChange);
        };
    }, []);

    const onThemeChangeClick = (theme: ColourScheme) => {
        setTheme(theme);
        setStoredTheme(theme);
        setCurrentTheme(theme);
    };

    const getThemeIcon = (theme: ColourScheme) => {
        switch (theme) {
            case 'light':
                return <i className="bi bi-sun-fill"></i>;
            case 'dark':
                return <i className="bi bi-moon-stars-fill"></i>;
            case 'auto':
            default:
                return <i className="bi bi-circle-half"></i>;
        }
    };

    const currentThemeIcon = useMemo(() => getThemeIcon(currentTheme), [currentTheme]);

    return (
        <>
            <button className="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                {currentThemeIcon}
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow">
                {
                    ['light', 'dark', 'auto'].map((theme) =>
                        <li key={theme}>
                            <button className={'d-flex dropdown-item rounded-1' + (currentTheme === theme ? ' active' : '')} onClick={() => { onThemeChangeClick(theme as ColourScheme); }} role="button">
                                {getThemeIcon(theme as ColourScheme)}
                                <span className="ms-2">{toFirstUpperCase(theme)}</span>
                                {
                                    currentTheme === theme && <i className="bi bi-check2 ms-auto"></i>
                                }
                            </button>
                        </li>
                    )
                }
            </ul>
        </>
    );
}
