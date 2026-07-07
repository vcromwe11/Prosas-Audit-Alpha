const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
    /className=\{\n\s*isCollapsed[\s\S]*?onClick=\{isCollapsed \? \(\) => setExpandedModuleId\(mod\.id\) : undefined\}/,
    `className={
                isCollapsed 
                ? \`cursor-pointer p-3 col-span-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center text-sm transition-colors \${draggedModuleIdx === idx ? 'opacity-50' : ''}\`
                : \`p-4 rounded-lg border overflow-hidden \${isExpanded ? 'md:col-span-2' : 'col-span-1'} \${mod.isActive ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'} \${draggedModuleIdx === idx ? 'opacity-50 scale-[0.98]' : ''}\`
            }
            onClick={isCollapsed ? () => setExpandedModuleId(mod.id) : undefined}`
);

fs.writeFileSync('App.tsx', code);
console.log('Grid layout fixed');
