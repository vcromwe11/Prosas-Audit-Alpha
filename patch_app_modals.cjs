const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add activeModal state
const targetState = `  const [firebaseError, setFirebaseError] = useState<string | null>(null);`;
const replacementState = `  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'SETTINGS' | 'REPOSITORY' | 'IDEAS' | null>(null);`;
code = code.replace(targetState, replacementState);

// 2. Update handleSetStage to clear modals
const targetHandleSetStage = `  const handleSetStage = (newStage: AppStage) => {
      setPreviousStage(stage);
      setStage(newStage);
  };`;
const replacementHandleSetStage = `  const handleSetStage = (newStage: AppStage) => {
      setActiveModal(null);
      setPreviousStage(stage);
      setStage(newStage);
  };`;
code = code.replace(targetHandleSetStage, replacementHandleSetStage);

// 3. Update Ideas button
const targetIdeasBtn = `                         onClick={() => { handleSetStage(AppStage.IDEAS); setSelectedReport(null); }}
                         className={\`w-full text-left py-2 rounded text-sm flex items-center gap-3 transition-all duration-200 transform active:scale-95 \${stage === AppStage.IDEAS ?`;
const replacementIdeasBtn = `                         onClick={() => { setActiveModal('IDEAS'); setSelectedReport(null); }}
                         className={\`w-full text-left py-2 rounded text-sm flex items-center gap-3 transition-all duration-200 transform active:scale-95 \${activeModal === 'IDEAS' ?`;
code = code.replace(targetIdeasBtn, replacementIdeasBtn);

// 4. Update Repository button
const targetRepoBtn = `                         onClick={() => { handleSetStage(AppStage.REPOSITORY); setSelectedReport(null); }}
                         className={\`w-full text-left py-2 rounded text-sm flex items-center gap-3 transition-all duration-200 transform active:scale-95 \${stage === AppStage.REPOSITORY ?`;
const replacementRepoBtn = `                         onClick={() => { setActiveModal('REPOSITORY'); setSelectedReport(null); }}
                         className={\`w-full text-left py-2 rounded text-sm flex items-center gap-3 transition-all duration-200 transform active:scale-95 \${activeModal === 'REPOSITORY' ?`;
code = code.replace(targetRepoBtn, replacementRepoBtn);

// 5. Update Settings button
const targetSettingsBtn = `                         onClick={() => { handleSetStage(AppStage.SETTINGS); setSelectedReport(null); }}
                         className={\`w-full text-left py-2 rounded text-sm flex items-center gap-3 transition-all duration-200 transform active:scale-95 \${stage === AppStage.SETTINGS ?`;
const replacementSettingsBtn = `                         onClick={() => { setActiveModal('SETTINGS'); setSelectedReport(null); }}
                         className={\`w-full text-left py-2 rounded text-sm flex items-center gap-3 transition-all duration-200 transform active:scale-95 \${activeModal === 'SETTINGS' ?`;
code = code.replace(targetSettingsBtn, replacementSettingsBtn);

// 6. Replace views with modal overlay at the bottom of the main layout, before closing div.
// Wait, the views are inside `<main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 relative">`
// Let's remove them from there and add the modal overlay.

const targetViews = `{/* VIEW: SETTINGS */}
          {stage === AppStage.IDEAS && (
              <IdeasScreen
                ideas={ideas}
                setIsIdeaModalOpen={setIsIdeaModalOpen}
                setSelectedIdea={setSelectedIdea}
              />
          )}

          {/* VIEW: REPOSITORY */}
          {stage === AppStage.REPOSITORY && (
              <RepositoryScreen
                appSettings={appSettings}
              />
          )}

          {stage === AppStage.SETTINGS && (
              <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-4xl mx-auto"
              >
                  <SettingsScreen 
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    appSettings={appSettings}
                    setAppSettings={setAppSettings}
                    user={user}
                    handleSetStage={handleSetStage}
                  />
              </motion.div>
          )}`;

const replacementViews = ``;
code = code.replace(targetViews, replacementViews);

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

// Insert the overlay right before `</main>` at the end of the file.
// Or just after `<ToastContainer />` which is usually at the bottom.
const targetEnd = `        </main>
    </div>
  );
};`;
code = code.replace(targetEnd, overlay + '\\n' + targetEnd);

fs.writeFileSync('src/App.tsx', code);
