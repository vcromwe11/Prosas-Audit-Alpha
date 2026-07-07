const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardScreen.tsx', 'utf8');

// 1. Add props to interface
const propsTarget = `interface DashboardScreenProps {`;
const propsReplacement = `interface DashboardScreenProps {
  onUpdateReport?: (report: SavedReport) => void;`;
code = code.replace(propsTarget, propsReplacement);

// 2. Add onUpdateReport to destructured props
const destructureTarget = `  onNewAnalysis,
  onViewContextText
}) => {`;
const destructureReplacement = `  onNewAnalysis,
  onViewContextText,
  onUpdateReport
}) => {`;
code = code.replace(destructureTarget, destructureReplacement);

// 3. Add state for inline editing
const stateTarget = `  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc' | 'default'>('default');
  const [currentSettings, setCurrentSettings] = React.useState<any>(null);`;
const stateReplacement = `  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc' | 'default'>('default');
  const [currentSettings, setCurrentSettings] = React.useState<any>(null);
  
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editEditalId, setEditEditalId] = React.useState<string>('');
  const [editPropostaId, setEditPropostaId] = React.useState<string>('');

  const handleSaveIds = (report: SavedReport) => {
      if (onUpdateReport) {
          onUpdateReport({
              ...report,
              editalId: editEditalId,
              propostaId: editPropostaId
          });
      }
      setEditingId(null);
  };`;
code = code.replace(stateTarget, stateReplacement);

// 4. Update the <th> elements
const thTarget = `                        <th 
                            className={\`px-6 \${appSettings.compactMode ? 'py-2' : 'py-4'} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group transition-colors duration-200\`}
                            onClick={() => handleSortClick('timestamp')}
                        >
                            <div className="flex items-center gap-1">
                                <span>Data</span>
                                {renderSortIcon('timestamp')}
                            </div>
                        </th>`;
const thReplacement = thTarget + `
                        <th className={\`px-6 \${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400\`}>ID Edital</th>
                        <th className={\`px-6 \${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400\`}>ID Proposta</th>`;
code = code.replace(thTarget, thReplacement);

// 5. Update the <td> elements
const tdTarget = `                            <td className={\`px-6 \${appSettings.compactMode ? 'py-2' : 'py-4'}\`}>{new Date(report.timestamp).toLocaleDateString()}</td>`;
const tdReplacement = `                            <td className={\`px-6 \${appSettings.compactMode ? 'py-2' : 'py-4'}\`}>{new Date(report.timestamp).toLocaleDateString()}</td>
                            <td className={\`px-6 \${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400\`} onClick={(e) => e.stopPropagation()}>
                                {editingId === report.id ? (
                                    <input 
                                        type="text" 
                                        value={editEditalId} 
                                        onChange={e => setEditEditalId(e.target.value)} 
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs" 
                                        placeholder="ID Edital" 
                                    />
                                ) : (
                                    report.editalId || '-'
                                )}
                            </td>
                            <td className={\`px-6 \${appSettings.compactMode ? 'py-2' : 'py-4'} text-gray-500 dark:text-gray-400\`} onClick={(e) => e.stopPropagation()}>
                                {editingId === report.id ? (
                                    <input 
                                        type="text" 
                                        value={editPropostaId} 
                                        onChange={e => setEditPropostaId(e.target.value)} 
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs" 
                                        placeholder="ID Proposta" 
                                    />
                                ) : (
                                    report.propostaId || '-'
                                )}
                            </td>`;
code = code.replace(tdTarget, tdReplacement);

// 6. Update the action buttons to include "Edit IDs"
const actionButtonsTarget = `                                {userRole !== 'viewer' && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReportToDelete(report);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Excluir Análise"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                                )}`;
const actionButtonsReplacement = `                                {userRole !== 'viewer' && (
                                    <>
                                        {editingId === report.id ? (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSaveIds(report);
                                                }}
                                                className="text-green-500 hover:text-green-600 transition-colors p-1 mr-2"
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
                                                className="text-blue-500 hover:text-blue-600 transition-colors p-1 mr-2"
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
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            title="Excluir Análise"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </>
                                )}`;
code = code.replace(actionButtonsTarget, actionButtonsReplacement);

fs.writeFileSync('src/components/DashboardScreen.tsx', code);
console.log("Patched src/components/DashboardScreen.tsx successfully");
