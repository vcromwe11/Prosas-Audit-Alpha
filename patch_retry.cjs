const fs = require('fs');
let code = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const targetCode = `            const isRateLimit = status === 429;
            const isServerOverload = status === 503;
            const isNetworkError = errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError");
            const isParsingError = errorMessage.includes("Unexpected token") || errorMessage.includes("SyntaxError: Unexpected token");
            
            if ((isRateLimit || isServerOverload || isNetworkError || isParsingError) && i < retries - 1) {`;

const replacementCode = `            const isRateLimit = status === 429;
            const isServerOverload = status === 503;
            const isNetworkError = errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError");
            const isParsingError = errorMessage.includes("Unexpected token") || errorMessage.includes("SyntaxError: Unexpected token");
            
            // Verifica se é cota diária esgotada
            if (isRateLimit && errorMessage.includes("PerDay")) {
                let dailyQuotaModel = "o modelo atual";
                let dailyQuotaLimit = "desconhecido";
                
                const modelMatch = errorMessage.match(/"model"\\s*:\\s*"([^"]+)"/) || errorMessage.match(/model:\\s*([^\\s,]+)/);
                if (modelMatch && modelMatch[1]) dailyQuotaModel = modelMatch[1];
                
                const limitMatch = errorMessage.match(/"quotaValue"\\s*:\\s*"([^"]+)"/) || errorMessage.match(/limit:\\s*([^\\s,]+)/);
                if (limitMatch && limitMatch[1]) dailyQuotaLimit = limitMatch[1];
                
                throw new Error(\`Cota diária gratuita esgotada para o modelo \${dailyQuotaModel} (limite: \${dailyQuotaLimit} requisições/dia). Troque de modelo em Configurações > Avançado ou aguarde o próximo dia.\`);
            }
            
            if ((isRateLimit || isServerOverload || isNetworkError || isParsingError) && i < retries - 1) {`;

if (code.includes('isNetworkError || isParsingError) && i < retries - 1) {')) {
    code = code.replace(targetCode, replacementCode);
    fs.writeFileSync('src/services/geminiService.ts', code);
    console.log("Success");
} else {
    console.log("Target code not found");
}
