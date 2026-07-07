const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardScreen.tsx', 'utf8');

const target = `  const handleSaveIds = (report: SavedReport) => {
      if (onUpdateReport) {
          onUpdateReport({
              ...report,
              editalId: editEditalId,
              propostaId: editPropostaId
          });
      }
      setEditingId(null);
  };`;

const replacement = `  const handleSaveIds = (report: SavedReport) => {
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

if (code.includes('handleSaveIds = (report: SavedReport)')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/DashboardScreen.tsx', code);
    console.log("Patched src/components/DashboardScreen.tsx handleSaveIds successfully");
} else {
    console.log("Could not find handleSaveIds in DashboardScreen.tsx");
}
