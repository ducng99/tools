type IToolInfo = Array<{
    id: string;
    name: string;
    element: any;
}>;

const CSV_Swap = () => import('./csv_swap');
const CSV_Display_Table = () => import('./csv_display_table');
const PasswordGenerator = () => import('./password_generator');
const QRCodeUtilities = () => import('./qr_code_utils');

export const ToolsInfo: IToolInfo = [
    {
        id: 'csv_display_table',
        name: 'CSV Display in table',
        element: CSV_Display_Table
    },
    {
        id: 'csv_swap',
        name: 'CSV Swap Columns and Rows',
        element: CSV_Swap
    },
    {
        id: 'password_generator',
        name: 'Password Generator',
        element: PasswordGenerator
    },
    {
        id: 'qr_code_utils',
        name: 'QR Code Utilities',
        element: QRCodeUtilities
    }
];
