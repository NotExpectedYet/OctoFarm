export const floatOrZero = (n) => (
    isNaN(n) || !n ?
        0 :
        parseFloat(n));
