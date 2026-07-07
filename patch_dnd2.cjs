const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const anchorState = "const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);";
if (!code.includes("const [draggedModuleIdx, setDraggedModuleIdx] = useState<number | null>(null);")) {
    code = code.replace(anchorState, anchorState + "\n  const [draggedModuleIdx, setDraggedModuleIdx] = useState<number | null>(null);");
}

const handleDropFunc = `
  const handleModuleDrop = (e: React.DragEvent, dropIdx: number) => {
      e.preventDefault();
      if (draggedModuleIdx === null || draggedModuleIdx === dropIdx) return;
      
      let newMods = [...(context.promptModules || [])];
      
      // If we're dragging a fixed module, don't allow it
      const draggedDocType = newMods[draggedModuleIdx].documentType.trim().toLowerCase();
      if (draggedDocType === 'orquestrador da esteira' || draggedDocType === 'cartão cnpj') {
          setDraggedModuleIdx(null);
          return;
      }
      
      const dropDocType = newMods[dropIdx].documentType.trim().toLowerCase();
      // even if dropped on a fixed module, enforceModuleOrder will fix it, 
      // but we shouldn't allow reordering them, enforce will push them back to top, 
      // which is fine, but visually it's just better to do the splice and let enforce fix the rest.
      
      const draggedMod = newMods.splice(draggedModuleIdx, 1)[0];
      newMods.splice(dropIdx, 0, draggedMod);
      
      setContext({...context, promptModules: enforceModuleOrder(newMods)});
      setDraggedModuleIdx(null);
  };
`;
if (!code.includes("const handleModuleDrop")) {
    code = code.replace(anchorState, anchorState + handleDropFunc);
}

fs.writeFileSync('App.tsx', code);
console.log('App.tsx state and drop patched');
