const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const injection = `
  const addNewSlot = () => {
    import('uuid').then(({ v4: uuidv4 }) => {
        setCandidates(prev => [...prev, {
        slotId: uuidv4(),
        files: [],
        candidateName: "",
        status: 'pending'
        }]);
    });
  };

  const removeSlot = (slotId) => {
    setCandidates(prev => prev.filter(c => c.slotId !== slotId));
  };
`;

code = code.replace(
  '  // --- LIFECYCLE & PERSISTENCE ---',
  injection + '\n  // --- LIFECYCLE & PERSISTENCE ---'
);

fs.writeFileSync('App.tsx', code);
