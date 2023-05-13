import { lazy } from 'react';

type IToolInfo = Array<{
    id: string;
    name: string;
    element: any;
}>;

const CSV_Swap = lazy(async () => await import('./csv_swap'));
const CSV_Display_Table = lazy(async () => await import('./csv_display_table'));
const PasswordGenerator = lazy(async () => await import('./password_generator'));

export const ToolsInfo: IToolInfo = [
    {
        id: 'csv_display_table',
        name: 'CSV Display Table',
        element: CSV_Display_Table
    },
    {
        id: 'csv_swap',
        name: 'CSV Swap',
        element: CSV_Swap
    },
    {
        id: 'password_generator',
        name: 'Password Generator',
        element: PasswordGenerator
    }
];
