// src/utils/debounceUtils.ts

import React from "react";

/**
 * Creates a debounced version of a function
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function(...args: Parameters<T>) {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    };
}

/**
 * Creates a throttled version of a function that only executes once per specified period
 * @param fn The function to throttle
 * @param limit The time limit in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;

    return function(...args: Parameters<T>) {
        // Store the latest arguments
        lastArgs = args;

        // If we're not throttling, execute immediately
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;

            // Set a timeout to reset the throttle flag
            setTimeout(() => {
                inThrottle = false;

                // If there were calls during the throttle period, execute with latest args
                if (lastArgs !== null) {
                    const argsToUse = lastArgs;
                    lastArgs = null;
                    fn(...argsToUse);
                }
            }, limit);
        }
    };
}

/**
 * Creates a debounced state updater function that only triggers after a delay
 * @param setState React setState function
 * @param delay Delay in milliseconds
 * @returns A debounced version of setState
 */
export function useDebouncedStateUpdate<T>(
    setState: React.Dispatch<React.SetStateAction<T>>,
    delay: number = 200
): (value: T | ((prev: T) => T)) => void {
    return debounce((value: T | ((prev: T) => T)) => {
        setState(value);
    }, delay);
}

/**
 * Creates a memoized version of a callback that only changes if the dependencies change
 * and adds debouncing to prevent rapid calls
 * @param callback The callback function
 * @param delay Delay in milliseconds
 * @param deps Dependencies array (like for useCallback)
 * @returns A stable, debounced callback function
 */
export function createStableCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    changeDetection?: (prev: any, next: any) => boolean
): T {
    let lastCallTime = 0;
    let lastArgs: Parameters<T> | null = null;
    let lastResult: ReturnType<T>;

    // Default change detection just compares values
    const detectChange = changeDetection || ((prev, next) => prev !== next);

    return function(...args: Parameters<T>) {
        const now = Date.now();

        // If we're within the debounce window, store args and exit
        if (now - lastCallTime < delay) {
            lastArgs = args;
            return lastResult;
        }

        // Check if args are different from last call
        const shouldUpdate =
            lastArgs === null ||
            args.length !== lastArgs.length ||
            args.some((arg, i) => detectChange(arg, lastArgs![i]));

        // Update state and call the function if needed
        if (shouldUpdate) {
            lastCallTime = now;
            lastArgs = args;
            lastResult = callback(...args) as ReturnType<T>;
        }

        return lastResult;
    } as T;
}

/**
 * Creates a stable handler for callback props to prevent excessive re-renders
 * @param onChange The callback from props
 * @returns A stable callback that won't cause re-renders when called frequently
 */
export function createStableHandler<T extends (...args: any[]) => any>(
    onChange?: T
): (...args: Parameters<T>) => void {
    // If no handler provided, use a noop function
    if (!onChange) {
        return () => {};
    }

    let lastCallTime = 0;
    const MINIMUM_CALL_INTERVAL = 100; // 100ms minimum between calls

    return function(...args: Parameters<T>) {
        const now = Date.now();

        // Call the handler at most once per 100ms
        if (now - lastCallTime >= MINIMUM_CALL_INTERVAL) {
            lastCallTime = now;
            onChange(...args);
        }
    };
}
