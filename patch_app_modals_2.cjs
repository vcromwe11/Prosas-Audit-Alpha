const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const overlay = `          {/* MODALS OVERLAY */}
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
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                     {activeModal === 'IDEAS' && (
                          <IdeasScreen
                            ideas={ideas}
                            setIsIdeaModalOpen={setIsIdeaModalOpen}
                            setSelectedIdea={setSelectedIdea}
                          />
                     )}
                     {activeModal === 'REPOSITORY' && (
                          <RepositoryScreen
                            appSettings={appSettings}
                          />
                     )}
                     {activeModal === 'SETTINGS' && (
                          <SettingsScreen 
                            isDarkMode={isDarkMode}
                            setIsDarkMode={setIsDarkMode}
                            appSettings={appSettings}
                            setAppSettings={setAppSettings}
                            user={user}
                            handleSetStage={handleSetStage}
                          />
                     )}
                  </div>
               </motion.div>
            </div>
          )}
          </AnimatePresence>`;

const targetEnd = `      <RepositoryPickerDialog 
        isOpen={isRepoPickerOpen} 
        onClose={() => setIsRepoPickerOpen(false)} 
        onSelect={handleRepoFileSelect} 
      />
    </div>
  );
};`;

code = code.replace(targetEnd, overlay + '\n      ' + targetEnd);

fs.writeFileSync('src/App.tsx', code);
