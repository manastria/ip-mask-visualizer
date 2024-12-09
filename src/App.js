import React from 'react';
import { BinaryIPDisplay } from './components/IPAddressDisplay';

function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Test des composants IP</h1>
      
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Test 1 : Adresse unique</h2>
        <BinaryIPDisplay 
          title="Mon adresse IP"
          initialIP="192.168.1.1"
          comment="Adresse locale"
        />
      </div>
    </div>
  );
}

export default App;