const fs = require('fs');
const content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const target = `        }, retries, baseDelay, signal);
    } catch (error: any) {
        if (error.message === "AbortError") throw error;`;

const replacement = `        }, retries, baseDelay, signal);
        
        logAiUsage({ model, taskType, success: true, approxChars, editalName });
        return result;
    } catch (error: any) {
        if (error.message === "AbortError") throw error;
        const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
        logAiUsage({ model, taskType, success: false, errorMessage, approxChars, editalName });
`;

let updated = content.replace(target, replacement);

fs.writeFileSync('src/services/geminiService.ts', updated);
