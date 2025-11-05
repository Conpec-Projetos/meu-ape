let lockCount = 0;
let previousOverflow: string | null = null;

export function lockBodyScroll() {
    if (typeof document === "undefined") return;
    lockCount += 1;
    if (lockCount === 1) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }
}

export function unlockBodyScroll() {
    if (typeof document === "undefined") return;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
        if (previousOverflow !== null) {
            document.body.style.overflow = previousOverflow;
            previousOverflow = null;
        } else {
            document.body.style.overflow = "";
        }
    }
}
