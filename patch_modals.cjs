const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetModal = `          {/* MODALS OVERLAY */}
          <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
               <motion.div 
                 initial={{ x: '100%', opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 exit={{ x: '100%', opacity: 0 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="w-full max-w-4xl h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
               >
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                     <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {activeModal === 'SETTINGS' ? 'Configurações' : activeModal === 'IDEAS' ? 'Ideias e Notas' : 'Repositório'}
                     </h2>
                     <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                     </button>
                  </div>`;

const replacementModal = `          {/* MODALS OVERLAY */}
          <AnimatePresence>
          {activeModal && (
            <div 
              className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setActiveModal(null)}
            >
               <motion.div 
                 initial={{ x: '100%', opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 exit={{ x: '100%', opacity: 0 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="w-full max-w-4xl h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
                 onClick={(e) => e.stopPropagation()}
               >
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                     <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
                        <button 
                            onClick={() => setActiveModal('SETTINGS')} 
                            className={\`flex items-center whitespace-nowrap text-lg font-bold transition-colors pb-1 border-b-2 \${activeModal === 'SETTINGS' ? 'text-gray-800 dark:text-gray-100 border-prosas-blue' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-transparent'}\`}
                        >
                            <i className="fas fa-cog mr-2"></i>Configurações
                        </button>
                        <button 
                            onClick={() => setActiveModal('IDEAS')} 
                            className={\`flex items-center whitespace-nowrap text-lg font-bold transition-colors pb-1 border-b-2 \${activeModal === 'IDEAS' ? 'text-gray-800 dark:text-gray-100 border-prosas-blue' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-transparent'}\`}
                        >
                            <i className="fas fa-lightbulb mr-2"></i>Ideias e Notas
                        </button>
                        <button 
                            onClick={() => setActiveModal('REPOSITORY')} 
                            className={\`flex items-center whitespace-nowrap text-lg font-bold transition-colors pb-1 border-b-2 \${activeModal === 'REPOSITORY' ? 'text-gray-800 dark:text-gray-100 border-prosas-blue' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-transparent'}\`}
                        >
                            <i className="fas fa-folder-open mr-2"></i>Repositório
                        </button>
                     </div>
                     <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-4 flex-shrink-0">
                        <i className="fas fa-times text-xl"></i>
                     </button>
                  </div>`;

code = code.replace(targetModal, replacementModal);
fs.writeFileSync('src/App.tsx', code);
