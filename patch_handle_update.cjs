const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetFunc = `  const handleUpdateReport = async (reportId: string, title: string, markdown: string) => {
    try {
        const reportToUpdate = allReports.find(r => r.id === reportId);
        if (reportToUpdate) {
            const updatedReport = { ...reportToUpdate, title, markdown };
            await updateReport(updatedReport);
            setAllReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));
            if (selectedReport?.id === reportId) {
                setSelectedReport(updatedReport);
            }
        }
    } catch (e) {
        console.error("Erro ao atualizar", e);
        toastError("Erro ao atualizar o relatório.");
    }
  };`;

const replacementFunc = `  const handleUpdateReport = async (updatedReport: SavedReport) => {
    try {
        await updateReport(updatedReport);
        setAllReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
        if (selectedReport?.id === updatedReport.id) {
            setSelectedReport(updatedReport);
        }
    } catch (e) {
        console.error("Erro ao atualizar", e);
        toastError("Erro ao atualizar o relatório.");
    }
  };`;

code = code.replace(targetFunc, replacementFunc);

fs.writeFileSync('src/App.tsx', code);
