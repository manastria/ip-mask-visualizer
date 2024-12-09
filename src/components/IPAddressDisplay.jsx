import React, { useState, useEffect } from 'react';

// Composant pour un bit individuel
const Bit = ({ value, index, onChange, className }) => (
  <button 
    className={`w-8 h-8 border border-gray-300 flex items-center justify-center 
                hover:bg-gray-100 transition-colors ${className}`}
    onClick={() => onChange(index)}
  >
    {value}
  </button>
);

// Composant pour un octet
const Octet = ({ value, onChange, label, comment, className }) => {
  // Convertit le nombre en binaire avec padding
  const bits = value.toString(2).padStart(8, '0').split('');
  
  const handleBitChange = (index) => {
    const newBits = [...bits];
    newBits[index] = newBits[index] === '1' ? '0' : '1';
    const newValue = parseInt(newBits.join(''), 2);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col items-center">
      {label && (
        <input
          type="number"
          min="0"
          max="255"
          value={value}
          onChange={(e) => onChange(Math.min(255, Math.max(0, parseInt(e.target.value) || 0)))}
          className="w-16 text-center mb-1 border border-gray-300 rounded"
        />
      )}
      <div className="flex">
        {bits.map((bit, index) => (
          <Bit 
            key={index}
            value={bit} 
            index={index}
            onChange={handleBitChange}
            className={className}
          />
        ))}
      </div>
      {comment && <div className="text-sm mt-1 text-gray-600">{comment}</div>}
    </div>
  );
};

const BinaryIPDisplay = ({ 
  title,
  initialIP = '192.168.1.1',
  showDecimal = true,
  comment,
  className,
  onIPChange
}) => {
  const [octets, setOctets] = useState(initialIP.split('.').map(n => parseInt(n)));
  
  // Met à jour l'IP quand les octets changent
  useEffect(() => {
    const newIP = octets.join('.');
    onIPChange?.(newIP);
  }, [octets]);

  const handleOctetChange = (index, newValue) => {
    const newOctets = [...octets];
    newOctets[index] = newValue;
    setOctets(newOctets);
  };

  return (
    <div className="flex flex-col items-center p-4">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {showDecimal && (
        <input
          type="text"
          value={octets.join('.')}
          onChange={(e) => {
            const parts = e.target.value.split('.');
            if (parts.length === 4) {
              const newOctets = parts.map(p => Math.min(255, Math.max(0, parseInt(p) || 0)));
              setOctets(newOctets);
            }
          }}
          className="mb-4 px-2 py-1 border border-gray-300 rounded"
        />
      )}
      <div className="flex items-center space-x-1">
        {octets.map((octet, index) => (
          <>
            <Octet
              key={index}
              value={octet}
              onChange={(newValue) => handleOctetChange(index, newValue)}
              label={true}
              className={className}
            />
            {index < 3 && <span className="text-xl">.</span>}
          </>
        ))}
      </div>
      {comment && <div className="mt-2 text-gray-600">{comment}</div>}
    </div>
  );
};

// Exemple d'utilisation du composant avec plusieurs IPs
const IPAddressDisplay = () => {
  const [ips, setIps] = useState(['192.168.1.1', '255.255.255.0']);
  
  return (
    <div className="space-y-8">
      {ips.map((ip, index) => (
        <>
          <BinaryIPDisplay
            key={index}
            title={`Adresse ${index + 1}`}
            initialIP={ip}
            comment={`Commentaire pour l'adresse ${index + 1}`}
            onIPChange={(newIP) => {
              const newIps = [...ips];
              newIps[index] = newIP;
              setIps(newIps);
            }}
          />
          {index < ips.length - 1 && (
            <div className="text-center font-medium">
              ET logique
            </div>
          )}
        </>
      ))}
    </div>
  );
};

export { BinaryIPDisplay };
export default IPAddressDisplay;