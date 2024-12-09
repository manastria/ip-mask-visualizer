// Dans App.js
import React from 'react';
import IPMaskDisplay from './components/IPMaskDisplay';

function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Comprendre l'adressage IP</h1>
      <IPMaskDisplay />
    </div>
  );
}

export default App;