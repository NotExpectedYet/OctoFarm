export type ThrottleRate = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface ThrottleMessage {
    /**
     * Rate limit with base multiplier of 500ms.
     * Example: 2 will represent 1sec, etc.
     */
    throttle: ThrottleRate;
}