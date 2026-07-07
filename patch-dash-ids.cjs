const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardScreen.tsx', 'utf8');

const target1 = `  const handleSaveIds = (report: SavedReport) => {
      if (onUpdateReport) {
          // If the edital ID changed, update all reports for this edital
          if (editEditalId !== report.editalId) {
              const reportsInEdital = allReports.filter(r => r.editalName === report.editalName);
              reportsInEdital.forEach(r => {
                  if (r.id === report.id) {
                      onUpdateReport({ ...r, editalId: editEditalId, propostaId: editPropostaId });
                  } else if (r.editalId !== editEditalId) {
                      onUpdateReport({ ...r, editalId: editEditalId });
                  }
              });
          } else {
              onUpdateReport({
                  ...report,
                  editalId: editEditalId,
                  propostaId: editPropostaId
              });
          }
      }
      setEditingId(null);
  };`;

const replacement1 = `  const handleSaveIds = (report: SavedReport) => {
      if (onUpdateReport) {
          // Check for duplicate Proposta ID (across all reports)
          if (editPropostaId && editPropostaId.trim() !== '') {
              const isDuplicate = allReports.some(r => r.id !== report.id && r.propostaId === editPropostaId);
              if (isDuplicate) {
                  alert("Este ID de Proposta já está sendo usado por outro projeto. Os IDs devem ser únicos.");
                  return;
              }
          }

          // If the edital ID changed, update all reports for this edital
          if (editEditalId !== report.editalId) {
              const reportsInEdital = allReports.filter(r => r.editalName === report.editalName);
              reportsInEdital.forEach(r => {
                  if (r.id === report.id) {
                      onUpdateReport({ ...r, editalId: editEditalId, propostaId: editPropostaId });
                  } else if (r.editalId !== editEditalId) {
                      onUpdateReport({ ...r, editalId: editEditalId });
                  }
              });
          } else {
              onUpdateReport({
                  ...report,
                  editalId: editEditalId,
                  propostaId: editPropostaId
              });
          }
      }
      setEditingId(null);
  };`;

code = code.replace(target1, replacement1);

const target2 = `className="text-gray-300 hover:text-blue-500 transition-colors mr-2"`;
const replacement2 = `className="text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors mr-2"`;

code = code.replaceAll(target2, replacement2);

const target3 = `className="text-gray-300 hover:text-red-500 transition-colors"`;
const replacement3 = `className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"`;

code = code.replaceAll(target3, replacement3);

fs.writeFileSync('src/components/DashboardScreen.tsx', code);
console.log("Patched DashboardScreen.tsx successfully");
