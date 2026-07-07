const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardScreen.tsx', 'utf8');

const actionButtonsTarget = `                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReportToDelete(report);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                    title="Excluir Análise"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>`;
const actionButtonsReplacement = `                                    <>
                                        {editingId === report.id ? (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSaveIds(report);
                                                }}
                                                className="text-green-500 hover:text-green-600 transition-colors mr-2"
                                                title="Salvar IDs"
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditEditalId(report.editalId || '');
                                                    setEditPropostaId(report.propostaId || '');
                                                    setEditingId(report.id);
                                                }}
                                                className="text-gray-300 hover:text-blue-500 transition-colors mr-2"
                                                title="Editar IDs"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReportToDelete(report);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                            title="Excluir Análise"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </>`;

if (code.includes('title="Excluir Análise"')) {
    code = code.replace(actionButtonsTarget, actionButtonsReplacement);
    fs.writeFileSync('src/components/DashboardScreen.tsx', code);
    console.log("Patched src/components/DashboardScreen.tsx action buttons successfully");
} else {
    console.log("Could not find target in src/components/DashboardScreen.tsx");
}
