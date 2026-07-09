const fs = require('fs');
let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

const targetSaveReport = `  const finalEditalName = editalName || "Edital Geral";
  
  const newReportId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  
  let finalEditalId = "1";
  let finalPropostaId = "1";
  
  try {
      const counterRef = doc(db, 'ai_audits_cache', 'counters');
      
      // Try to find an existing editalId for this editalName
      let existingEditalId = "";
      const q = query(collection(db, 'reports'), where('editalName', '==', finalEditalName), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
          const existing = snap.docs[0].data();
          if (existing.editalId) {
              existingEditalId = existing.editalId;
          }
      }

      await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          let nextProposta = 1;
          let nextEdital = 1;
          
          if (counterDoc.exists()) {
              const data = counterDoc.data();
              if (data.nextPropostaSeq) nextProposta = data.nextPropostaSeq;
              if (data.nextEditalSeq) nextEdital = data.nextEditalSeq;
          }
          
          finalPropostaId = String(nextProposta);
          
          if (existingEditalId) {
              finalEditalId = existingEditalId;
          } else {
              finalEditalId = String(nextEdital);
              nextEdital++;
          }
          
          nextProposta++;
          
          transaction.set(counterRef, {
              nextPropostaSeq: nextProposta,
              nextEditalSeq: nextEdital
          }, { merge: true });
          
          // We can't write the report in this transaction easily without changing too much, 
          // because we need to save it after generating IDs. Wait, we can just save it normally after transaction.
      });
  } catch (e) {
      console.error("Error generating dynamic IDs", e);
      // Fallback if transaction fails
      finalPropostaId = String(Date.now()).slice(-6);
      finalEditalId = String(Date.now()).slice(-6);
  }`;

const replacementSaveReport = `  const finalEditalName = editalName || "Edital Geral";
  
  const newReportId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  
  let finalEditalId = "1";
  let finalPropostaId = "1";
  
  try {
      finalEditalId = await getOrCreateEditalId(finalEditalName);
      finalPropostaId = await getNextPropostaId();
  } catch (e) {
      console.error("Error generating dynamic IDs", e);
      // Fallback se a transação falhar
      finalPropostaId = String(Date.now()).slice(-6);
      finalEditalId = String(Date.now()).slice(-6);
  }`;

code = code.replace(targetSaveReport, replacementSaveReport);

const extraFunctions = `
const editalIdLocks = new Map<string, Promise<string>>();

export const getOrCreateEditalId = (editalName: string): Promise<string> => {
    if (!editalIdLocks.has(editalName)) {
        editalIdLocks.set(editalName, (async () => {
             const q = query(collection(db, 'reports'), where('editalName', '==', editalName), limit(50));
             const snap = await getDocs(q);
             for (const d of snap.docs) {
                 const existing = d.data();
                 if (existing.editalId && existing.editalId.trim() !== '') {
                     return existing.editalId;
                 }
             }
             
             const counterRef = doc(db, 'ai_audits_cache', 'counters');
             return await runTransaction(db, async (transaction) => {
                 const counterDoc = await transaction.get(counterRef);
                 let nextEdital = 1;
                 if (counterDoc.exists()) {
                     const data = counterDoc.data();
                     if (data.nextEditalSeq) nextEdital = data.nextEditalSeq;
                 }
                 const newId = String(nextEdital);
                 transaction.set(counterRef, { nextEditalSeq: nextEdital + 1 }, { merge: true });
                 return newId;
             });
        })());
    }
    return editalIdLocks.get(editalName)!;
};

export const getNextPropostaId = async (): Promise<string> => {
    const counterRef = doc(db, 'ai_audits_cache', 'counters');
    return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextProposta = 1;
        if (counterDoc.exists()) {
             const data = counterDoc.data();
             if (data.nextPropostaSeq) nextProposta = data.nextPropostaSeq;
        }
        transaction.set(counterRef, { nextPropostaSeq: nextProposta + 1 }, { merge: true });
        return String(nextProposta);
    });
};
`;

code = code.replace("export const saveReport", extraFunctions + "\nexport const saveReport");

fs.writeFileSync('src/services/storageService.ts', code);
