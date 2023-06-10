export function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'); // $& means the whole matched string
}

export function toFirstUpperCase(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function clampWidthHeight(width: number, height: number, maxWidth: number, maxHeight: number) {
    if (width > maxWidth) {
        height = height * maxWidth / width;
        width = maxWidth;
    }

    if (height > maxHeight) {
        width = width * maxHeight / height;
        height = maxHeight;
    }

    return [width, height];
}
