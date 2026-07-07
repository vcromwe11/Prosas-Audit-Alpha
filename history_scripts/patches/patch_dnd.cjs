const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add draggedModuleIdx state
const stateAnchor = "const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);";
code = code.replace(stateAnchor, stateAnchor + "\n  const [draggedModuleIdx, setDraggedModuleIdx] = useState<number | null>(null);");

// I need to add draggable handlers to BOTH the collapsed and expanded divs, because both represent the module list items.
