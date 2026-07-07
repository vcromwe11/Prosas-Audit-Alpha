import { collection, getDocs, deleteDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { FALLBACK_PROMPT_MODULE_TEMPLATES } from '../../src/services/promptModules';

async function run() {
    try {
        console.log("Updating prompt modules in Firestore...");
        const q = collection(db, 'prompt_modules');
        const snapshot = await getDocs(q);
        
        for (const document of snapshot.docs) {
            await deleteDoc(document.ref);
            console.log("Deleted old module:", document.id);
        }

        for (const mod of FALLBACK_PROMPT_MODULE_TEMPLATES) {
            const docId = mod.documentType.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
            await setDoc(doc(db, 'prompt_modules', docId), mod);
            console.log("Added new module:", docId);
        }
        
        console.log("Update complete!");
        process.exit(0);
    } catch (e) {
        console.error("Error updating:", e);
        process.exit(1);
    }
}

run();
