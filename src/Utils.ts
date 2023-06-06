export function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'); // $& means the whole matched string
}

export function toFirstUpperCase(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
