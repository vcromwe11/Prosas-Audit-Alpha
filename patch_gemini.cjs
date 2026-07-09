const fs = require('fs');
let code = fs.readFileSync('src/services/geminiService.ts', 'utf8');

// 1. Throttle the retry fallback
const targetRetry = `if ((isRateLimit || isServerOverload || isNetworkError || isParsingError) && i < retries - 1) {
                let waitTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
                
                // Try to parse explicit retry delay from error message (e.g., "Please retry in 11.75s")
                const retryMatch = errorMessage.match(/retry in ([0-9.]+)s/i) || errorMessage.match(/retryDelay["']?\\s*:\\s*["']?([0-9.]+)s/i);
                if (retryMatch && retryMatch[1]) {
                    const parsedDelay = parseFloat(retryMatch[1]) * 1000;
                    if (!isNaN(parsedDelay) && parsedDelay > 0) {
                        waitTime = Math.max(waitTime, parsedDelay + 2000); // add 2s buffer
                    }
                }`;
                
const replacementRetry = `if ((isRateLimit || isServerOverload || isNetworkError || isParsingError) && i < retries - 1) {
                let waitTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
                
                // Try to parse explicit retry delay from error message (e.g., "Please retry in 11.75s")
                const retryMatch = errorMessage.match(/retry in ([0-9.]+)s/i) || errorMessage.match(/retryDelay["']?\\s*:\\s*["']?([0-9.]+)s/i);
                if (retryMatch && retryMatch[1]) {
                    const parsedDelay = parseFloat(retryMatch[1]) * 1000;
                    if (!isNaN(parsedDelay) && parsedDelay > 0) {
                        waitTime = Math.max(waitTime, parsedDelay + 2000); // add 2s buffer
                    }
                }
                
                // Force a longer wait if we hit free tier limits
                if (isRateLimit && waitTime < 15000) {
                    waitTime = 60000 + Math.random() * 5000;
                }`;

code = code.replace(targetRetry, replacementRetry);

// 2. Increase retries
const targetRetries = `export const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    retries: number = 3,
    baseDelay: number = 2000,
    signal?: AbortSignal
): Promise<T> => {`;

const replacementRetries = `export const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    retries: number = 5,
    baseDelay: number = 3000,
    signal?: AbortSignal
): Promise<T> => {`;
code = code.replace(targetRetries, replacementRetries);

// 3. Fallback model: use gemini-1.5-flash since 3.5-flash or 2.5-flash doesn't exist? Actually let's use gemini-1.5-flash or gemini-2.5-flash
// The API is returning gemini-3.5-flash, maybe it's fine. We just need to fix maxConcurrentSlots.
fs.writeFileSync('src/services/geminiService.ts', code);
