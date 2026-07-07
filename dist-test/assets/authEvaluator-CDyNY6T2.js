import{e as x}from"./index-CT0paD12.js";const $=s=>{if(!s||s==="N/A")return new Date(0);const t=s.split("/");return t.length===3?new Date(parseInt(t[2]),parseInt(t[1])-1,parseInt(t[0])):new Date(s)},P=(s,t)=>{const f=$(s),c=t?$(t):new Date;return f.setHours(0,0,0,0),c.setHours(0,0,0,0),f>=c},L=(s,t)=>{const f=typeof t=="string"?new RegExp(t,"i"):t,c=s.match(f);return c?c[1]!==void 0?c[1]:c[0]:null},M=s=>{const t=s.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);return t?t[0]:null},U=s=>{const t=s.toUpperCase();return t.includes("POSITIVA COM EFEITOS DE NEGATIVA")||t.includes("POSITIVA COM EFEITO DE NEGATIVA")?{isValid:!0,status:"POSITIVA COM EFEITOS DE NEGATIVA"}:t.includes("CERTIDÃO NEGATIVA")||t.includes("NÃO CONSTA")||t.includes("INEXISTÊNCIA DE DÉBITOS")?{isValid:!0,status:"NEGATIVA"}:t.includes("REGULARIDADE")?{isValid:!0,status:"REGULAR"}:{isValid:!1,status:"POSITIVA / IRREGULAR"}},y=async(s,t,f="",c)=>{let d=!0,e=[];const g=[];let u=null;e.push("=== RELATÓRIO DE PRÉ-ANÁLISE (AUTENTICAÇÃO DETERMINÍSTICA / IA OTIMIZADA) ==="),e.push(`Data de Referência: ${f||"Data Atual"}`);for(const a of t){if(!a.documentType||!a.dataToScrape)continue;const n=a.questionPrefix?`[${a.questionPrefix}] ${a.documentType}`:`[${a.documentType}]`;c&&c(`Analisando ${n}...`);const E=s.find(r=>{const l=r.name.toLowerCase(),o=l.includes(a.documentType.toLowerCase()),p=a.questionPrefix?l.includes(a.questionPrefix.toLowerCase()):!1;return o||p});if(!E){d=!1,e.push(`❌ ${n} Arquivo não encontrado.`),e.push(`   Motivo: ${a.rejectionTrigger||"Documento obrigatório ausente."}`);continue}g.includes(E.name)||g.push(E.name);try{const r=await x(E),l=a.documentType.toLowerCase(),o=M(r);if(l.includes("cnpj")){const i=r.match(/SITUAÇÃO CADASTRAL\s*\n?\s*(ATIVA|BAIXADA|SUSPENSA|INAPTA|NULA)/i),A=i?i[1].toUpperCase():"NÃO ENCONTRADA";if(o&&u&&o!==u){d=!1,e.push(`❌ ${n} Reprovado por Divergência de CNPJ.`),e.push(`   Justificativa: O CNPJ deste Cartão CNPJ (${o}) difere do CNPJ proponente base (${u}).`);continue}else o&&!u&&(u=o,e.push(`📌 CNPJ Base Identificado: ${u}`));const D=r.match(/DATA DE ABERTURA\s*\n?\s*([\d/]+)/i),N=D?D[1]:"N/A";if(!(A==="ATIVA")){d=!1,e.push(`⚠️ PONTO DE ATENÇÃO: ${n} Reprovado na validação de status.`),e.push(`   Justificativa: Situação encontrada: ${A} (INVÁLIDA - Deve ser ATIVA).`);continue}}else if(l.includes("cnd")||l.includes("fgts")||l.includes("trabalhista")||l.includes("estadual")||l.includes("municipal")){if(u&&o&&o!==u){d=!1,e.push(`❌ ${n} Reprovado por Divergência de CNPJ.`),e.push(`   Justificativa: O CNPJ do documento (${o}) difere do CNPJ proponente (${u}).`);continue}else o&&!u&&(u=o);const i=a.formatRegex||"válida até\\s*(\\d{2}/\\d{2}/\\d{4})|validade:\\s*(\\d{2}/\\d{2}/\\d{4})",D=L(r,i)||"N/A",N=D!=="N/A"&&P(D,f);let h=!0,O="REGULAR / NÃO AVALIADO";if(l.includes("fgts")){const T=r.toUpperCase().includes("REGULARIDADE");h=T,O=T?"SITUAÇÃO REGULAR DO FGTS":"SITUAÇÃO IRREGULAR"}else{const T=U(r);h=T.isValid,O=T.status}N&&h?(e.push(`✅ ${n} Validado com sucesso.`),e.push(`   Justificativa: Situação fiscal "${O}" (OK). Data de validade ${D} está vigente em relação à data de referência.`)):(d=!1,e.push(`⚠️ PONTO DE ATENÇÃO: ${n} Reprovado na validação.`),e.push(`   Justificativa: Validade do Doc: ${D} ${N?"(OK)":"(VENCIDA OU NÃO ENCONTRADA)"}. Status: ${O} ${h?"(OK)":"(INVÁLIDO)"}.`));continue}let p=a.formatRegex,m="i";if(p.startsWith("/")&&p.lastIndexOf("/")>0){const i=p.lastIndexOf("/");m=p.substring(i+1),p=p.substring(1,i)}const C=new RegExp(p,m),I=r.match(C);if(!I){d=!1,e.push(`❌ ${n} Falha na extração de dados.`),e.push(`   Dado esperado: ${a.dataToScrape}`),e.push("   Motivo: Padrão não encontrado no texto do documento.");continue}const R=I[1]!==void 0?I[1]:I[0],v=r.match(/DATA DE ABERTURA\s*\n?\s*([\d/]+)/i),V=v?v[1]:"N/A";let S=!1;try{S=new Function("value","referenceDate","openingDate",`
                    function parseDate(str) {
                        if (!str || str === 'N/A') return new Date(0);
                        const parts = str.split('/');
                        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
                        return new Date(str);
                    }
                    function isWithinThreeMonths(dateStr, refDateStr) {
                        const date = parseDate(dateStr);
                        const refDate = refDateStr ? parseDate(refDateStr) : new Date();
                        const diffTime = refDate.getTime() - date.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 90;
                    }
                    function isValidTo(dateStr, refDateStr) {
                        const date = parseDate(dateStr);
                        const refDate = refDateStr ? parseDate(refDateStr) : new Date();
                        date.setHours(0,0,0,0);
                        refDate.setHours(0,0,0,0);
                        return date >= refDate;
                    }
                    function getAgeInYears(dateStr, refDateStr) {
                        const date = parseDate(dateStr);
                        const refDate = refDateStr ? parseDate(refDateStr) : new Date();
                        if (date.getTime() === 0) return 0;
                        let age = refDate.getFullYear() - date.getFullYear();
                        const m = refDate.getMonth() - date.getMonth();
                        if (m < 0 || (m === 0 && refDate.getDate() < date.getDate())) {
                            age--;
                        }
                        return age;
                    }
                    return ${a.validationRule};
                `)(R.trim(),f,V)}catch(i){console.error(`Erro ao avaliar regra para ${a.documentType}:`,i),d=!1,e.push(`❌ ${n} Erro de validação interna.`),e.push(`   Regra: ${a.validationRule}`),e.push(`   Erro: ${i}`);continue}if(S)e.push(`✅ ${n} ${a.approvalTrigger||"Validado com sucesso."}`),e.push(`   Justificativa: O valor extraído ("${R.trim()}") atende ao padrão esperado e à regra de validação em relação à data de referência.`);else{d=!1;const A=a.validationRule.includes("isWithinThreeMonths")||a.validationRule.includes("isValidTo")?"⚠️ PONTO DE ATENÇÃO":"❌ Reprovado";e.push(`${A}: ${n} Falha na validação.`),e.push(`   Justificativa: O valor extraído ("${R.trim()}") foi barrado pela regra ("${a.validationRule}").`),e.push(`   Motivo: ${a.rejectionTrigger||"Não atende aos critérios da regra."}`)}}catch(r){d=!1,e.push(`❌ ${n} Erro ao ler o arquivo.`),e.push(`   Erro: ${r}`)}}return e.push("==============================================================="),{passed:d,report:e.join(`
`),processedFiles:g}};export{y as runDeterministicAuth};
