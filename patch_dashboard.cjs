const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardScreen.tsx', 'utf8');

if (!code.includes('updateEditalIdCache')) {
    code = code.replace(
        "import { deleteReport, SavedReport } from '../services/storageService';",
        "import { deleteReport, SavedReport, updateEditalIdCache } from '../services/storageService';"
    );
}

const targetUpdate = `          // If the edital ID changed, update all reports for this edital
          if (finalEditalId !== report.editalId) {
              const reportsInEdital = globalAllReports.filter(r => r.editalName === report.editalName);`;

const replacementUpdate = `          // If the edital ID changed, update all reports for this edital
          if (finalEditalId !== report.editalId) {
              updateEditalIdCache(report.editalName, finalEditalId);
              const reportsInEdital = globalAllReports.filter(r => r.editalName === report.editalName);`;

code = code.replace(targetUpdate, replacementUpdate);
fs.writeFileSync('src/components/DashboardScreen.tsx', code);
