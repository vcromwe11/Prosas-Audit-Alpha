const fs = require('fs');
let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

const target = `    const dataToSave: any = {
      ...report,
      userId: report.userId || auth.currentUser.uid,
      result: JSON.stringify(report.result)
    };
    
    if (dataToSave.manualStatus === undefined) delete dataToSave.manualStatus;
    if (dataToSave.userNotes === undefined) delete dataToSave.userNotes;`;

const replacement = `    const dataToSave: any = {
      ...report,
      userId: report.userId || auth.currentUser.uid,
    };
    if (report.result !== undefined) {
        dataToSave.result = JSON.stringify(report.result);
    }
    
    Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
            delete dataToSave[key];
        }
    });`;

if (code.includes('result: JSON.stringify(report.result)')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/services/storageService.ts', code);
    console.log("Patched storageService.ts successfully");
} else {
    console.log("Target not found");
}
