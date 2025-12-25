export function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&"); // $& means the whole matched string
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

export function escapeMeCardValue(value: string) {
    return value.replaceAll(/[\\;,":]/g, "\\$&");
}

export type ChangeEvent<T extends HTMLElement> = Event & { currentTarget: T };

/**
 * Unbiased random integer in [0, max)
 * @param max Exclusive upper bound
 */
export function getRandomInt(max: number): number {
    if (max <= 0) {
        throw new Error("max must be > 0");
    }
    const UINT32_RANGE = 0x100000000; // 2^32
    const limit = Math.floor(UINT32_RANGE / max) * max;
    const buf = new Uint32Array(1);
    let r: number;
    do {
        crypto.getRandomValues(buf);
        r = buf[0];
    } while (r >= limit);
    return r % max;
};
