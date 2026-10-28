// Ported from @tonconnect/ui (github.com/ton-connect/sdk), Apache-2.0. License in ./LICENSE.
export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function lerp(from: number, to: number, ratio: number): number {
    return from + (to - from) * ratio;
}
