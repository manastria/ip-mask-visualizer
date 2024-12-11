import React, { useState, useEffect } from 'react';


/**
 * Represents a range of bits with associated metadata.
 */
class BitRange {
  /**
   * Creates an instance of BitRange.
   * @param {number} start - The position of the first bit (1-32).
   * @param {number} end - The position of the last bit (1-32).
   * @param {string} cssClass - The CSS class to apply.
   * @param {string} label - The description of the range.
   */
  constructor(start, end, cssClass, label) {
    this.start = start;      // Position du premier bit (1-32)
    this.end = end;          // Position du dernier bit (1-32)
    this.cssClass = cssClass;// Classe CSS à appliquer
    this.label = label;      // Description de la plage
  }
}

// Convertit un masque en plages de bits réseau
const getMaskRanges = (mask) => {
  const maskBits = mask.split('.')
    .map(n => parseInt(n))
    .map(n => n.toString(2).padStart(8, '0'))
    .join('');
  
  let networkBits = 0;
  for (let i = 0; i < maskBits.length; i++) {
    if (maskBits[i] === '1') networkBits++;
    else break;
  }
  
  return [
    new BitRange(1, networkBits, 'bg-blue-100 hover:bg-blue-200', 'Réseau'),
    new BitRange(networkBits + 1, 32, 'bg-green-100 hover:bg-green-200', 'Hôte')
  ];
};

const getBitPosition = (octetIndex, bitIndex) => {
  return octetIndex * 8 + bitIndex + 1;
};

const getBitClasses = (octetIndex, bitIndex, bitRanges) => {
  const position = getBitPosition(octetIndex, bitIndex);
  const classes = ['bit-default'];

  bitRanges.forEach(range => {
    if (position >= range.start && position <= range.end) {
      classes.push(range.cssClass);
    }
  });

  return classes.join(' ');
};

const Bit = ({ 
  value, 
  index, 
  onChange, 
  onColorChange,
  octetIndex, 
  bitRanges,
  paintMode,
  selectedColor 
}) => {
  const classes = getBitClasses(octetIndex, index, bitRanges);
  
  const handleClick = () => {
    if (paintMode) {
      // En mode pinceau, on change uniquement la couleur
      onColorChange(getBitPosition(octetIndex, index), selectedColor);
    } else {
      // En mode bit, on change uniquement la valeur
      onChange(index);
    }
  };
  
  return (
    <button 
      className={`w-8 h-8 border border-gray-300 flex items-center justify-center 
                transition-colors ${classes}`}
      onClick={handleClick}
      title={`Bit ${getBitPosition(octetIndex, index)}`}
    >
      {value}
    </button>
  );
};

const Octet = ({ 
  value, 
  onChange, 
  onColorChange,
  label, 
  octetIndex, 
  bitRanges,
  paintMode,
  selectedColor,
  isMask = false // Ajout du paramètre pour identifier si c'est un masque
}) => {
  const bits = value.toString(2).padStart(8, '0').split('');
  
  const handleBitChange = (index) => {
    if (isMask) {
      // Logique spéciale pour le masque
      const bitPosition = octetIndex * 8 + index; // Position globale du bit (0-31)
      const totalBits = 32;
      
      // Créer un tableau de 32 bits représentant tout le masque
      const currentValue = parseInt(value).toString(2).padStart(8, '0');
      const allBits = new Array(totalBits).fill('0');
      // Remplir avec les bits actuels de l'octet
      for (let i = 0; i < 8; i++) {
        allBits[octetIndex * 8 + i] = currentValue[i];
      }
      
      // Mettre à 1 tous les bits à gauche de la position cliquée
      for (let i = 0; i <= bitPosition; i++) {
        allBits[i] = '1';
      }
      // Mettre à 0 tous les bits à droite de la position cliquée
      for (let i = bitPosition + 1; i < totalBits; i++) {
        allBits[i] = '0';
      }
      
      // Extraire les 8 bits correspondant à cet octet
      const newOctetBits = allBits.slice(octetIndex * 8, (octetIndex + 1) * 8);
      const newValue = parseInt(newOctetBits.join(''), 2);
      onChange(newValue);
    } else {
      // Comportement normal pour les autres octets
      const newBits = [...bits];
      newBits[index] = newBits[index] === '1' ? '0' : '1';
      const newValue = parseInt(newBits.join(''), 2);
      onChange(newValue);
    }
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
        {bits.map((bit, bitIndex) => (
          <Bit 
            key={bitIndex}
            value={bit} 
            index={bitIndex}
            onChange={handleBitChange}
            onColorChange={onColorChange}
            octetIndex={octetIndex}
            bitRanges={bitRanges}
            paintMode={paintMode}
            selectedColor={selectedColor}
          />
        ))}
      </div>
    </div>
  );
};

// Définition des couleurs disponibles
const availableColors = [
  { name: 'Réseau', class: 'bg-blue-300 hover:bg-blue-400' },     // Plus foncé
  { name: 'Sous-réseau', class: 'bg-yellow-300 hover:bg-yellow-400' }, // Plus foncé
  { name: 'Hôte', class: 'bg-green-300 hover:bg-green-400' },     // Plus foncé
  { name: 'Spécial', class: 'bg-purple-300 hover:bg-purple-400' }, // Plus foncé
  { name: 'Aucune', class: 'bg-white hover:bg-gray-100' }
];


// Affiche l'adresse IP
const IPDisplay = ({ 
  title,
  initialIP = '192.168.1.1',
  bitRanges = [],
  showLegend = true,
  onIPChange,
  paintMode = false,
  selectedColor,
  onColorChange,
  isMask = false,
  isPad = false,
  sourceIP = null,
  sourceBitRanges = null,
  mask = null
}) => {
  const [octets, setOctets] = useState(initialIP.split('.').map(n => parseInt(n)));
  
  const handleOctetChange = (index, newValue) => {
    const newOctets = [...octets];
    newOctets[index] = newValue;
    
    // Si c'est un masque et qu'un octet change, appliquer la logique du masque à tous les octets
    if (isMask) {
      const bitPosition = index * 8 + 7; // Position du dernier bit de l'octet
      
      // Mettre à 1 tous les octets à gauche
      for (let i = 0; i < index; i++) {
        newOctets[i] = 255;
      }
      // Mettre à 0 tous les octets à droite
      for (let i = index + 1; i < 4; i++) {
        newOctets[i] = 0;
      }
    }
    
    setOctets(newOctets);
    onIPChange?.(newOctets.join('.'));
  };

  const setNetworkAddress = () => {
    if (mask) {
      const maskParts = mask.split('.').map(n => parseInt(n));
      const newOctets = octets.map((octet, i) => octet & maskParts[i]);
      setOctets(newOctets);
      onIPChange?.(newOctets.join('.'));
    }
  };
  
  const setBroadcastAddress = () => {
    if (mask) {
      const maskParts = mask.split('.').map(n => parseInt(n));
      const newOctets = octets.map((octet, i) => octet | (~maskParts[i] & 255));
      setOctets(newOctets);
      onIPChange?.(newOctets.join('.'));
    }
  };
  
  const copySourceIP = () => {
    if (sourceIP) {
      const newOctets = sourceIP.split('.').map(n => parseInt(n));
      setOctets(newOctets);
      onIPChange?.(sourceIP);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      
      <input
        type="text"
        value={octets.join('.')}
        onChange={(e) => {
          const parts = e.target.value.split('.');
          if (parts.length === 4) {
            const newOctets = parts.map(p => Math.min(255, Math.max(0, parseInt(p) || 0)));
            setOctets(newOctets);
            onIPChange?.(newOctets.join('.'));
          }
        }}
        className="mb-4 px-2 py-1 border border-gray-300 rounded"
      />
      
      <div className="flex items-ends space-x-1">
        {octets.map((octet, octetIndex) => (
          <React.Fragment key={octetIndex}>
            <Octet
              value={octet}
              onChange={(newValue) => handleOctetChange(octetIndex, newValue)}
              onColorChange={onColorChange}
              label={true}
              octetIndex={octetIndex}
              bitRanges={bitRanges}
              paintMode={paintMode}
              selectedColor={selectedColor}
              isMask={isMask}
            />
            {octetIndex < 3 && (
              <span className="flex items-end pb-2 text-base text-gray-400">&bull;</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {isPad && (
        <div className="mt-4 flex space-x-2">
          <button 
            onClick={setNetworkAddress}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Adresse réseau
          </button>
          <button 
            onClick={setBroadcastAddress}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Adresse broadcast
          </button>
          <button 
            onClick={copySourceIP}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Copier IP source
          </button>
          <button 
            onClick={() => onColorChange?.(sourceBitRanges)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Copier couleurs
          </button>
        </div>
      )}

      {showLegend && bitRanges.length > 0 && (
        <div className="mt-4 text-sm">
          <div className="font-semibold mb-2">Légende :</div>
          <div className="flex flex-wrap gap-4">
            {bitRanges.map((range, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-4 h-4 mr-2 ${range.cssClass}`}></div>
                <span>{range.label} (bits {range.start}-{range.end})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// Composant principal qui gère le masque et l'adresse IP
const IPMaskDisplay = () => {
  const [mask, setMask] = useState('255.255.255.0');
  const [ip, setIP] = useState('192.168.1.1');
  const [customIPRanges, setCustomIPRanges] = useState([]);
  const [customMaskRanges, setCustomMaskRanges] = useState([]);
  const [paintMode, setPaintMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(availableColors[0]);
  const [padIP, setPadIP] = useState('192.168.1.1');
  const [customPadRanges, setCustomPadRanges] = useState([]);

  // Calculer les plages basées sur le masque
  const maskRanges = getMaskRanges(mask);

  // Initialisation des plages
  useEffect(() => {
    setCustomIPRanges(maskRanges);
    setCustomMaskRanges(maskRanges);
  }, []); // Une seule fois au démarrage

  // Mettre à jour les plages de l'IP quand le masque change
  useEffect(() => {
    // Fusionner les plages personnalisées avec les nouvelles plages du masque
    setCustomIPRanges(currentRanges => {
      // Récupérer les bits personnalisés
      const customizedBits = currentRanges
        .filter(range => range.start === range.end)
        .map(range => range.start);

      // Garder les plages du masque pour les bits non personnalisés
      const updatedRanges = maskRanges.map(maskRange => {
        // Créer une plage qui exclut les bits personnalisés
        const rangeBits = Array.from(
          { length: maskRange.end - maskRange.start + 1 },
          (_, i) => maskRange.start + i
        ).filter(bit => !customizedBits.includes(bit));

        if (rangeBits.length === 0) return null;

        return new BitRange(
          Math.min(...rangeBits),
          Math.max(...rangeBits),
          maskRange.cssClass,
          maskRange.label
        );
      }).filter(Boolean);

      // Ajouter les bits personnalisés
      const customRanges = currentRanges.filter(range => 
        range.start === range.end && customizedBits.includes(range.start)
      );

      return [...updatedRanges, ...customRanges];
    });
  }, [mask]); // Se déclenche quand le masque change

  // Fonction pour copier les couleurs de l'adresse IP
  const handleCopyColors = (sourceBitRanges) => {
    const setTargetRanges = setCustomPadRanges;
    setTargetRanges(sourceBitRanges.map(range => new BitRange(
      range.start,
      range.end,
      range.cssClass,
      range.label
    )));
  };

  // Fonction pour mettre à jour la couleur d'un bit
  const handleColorChange = (bitPosition, color, isMask) => {
    const setTargetRanges = isMask ? setCustomMaskRanges : setCustomIPRanges;

    setTargetRanges(currentRanges => {
      // Trouver toutes les plages non affectées par ce changement
      const unaffectedRanges = currentRanges.filter(range =>
        bitPosition < range.start || bitPosition > range.end
      );

      // Trouver la plage qui contient ce bit
      const affectedRange = currentRanges.find(range =>
        range.start <= bitPosition && range.end >= bitPosition
      );

      // Si on a une plage affectée, il faut potentiellement la diviser
      const newRanges = [];
      if (affectedRange) {
        // Partie gauche de la plage originale
        if (affectedRange.start < bitPosition) {
          newRanges.push(new BitRange(
            affectedRange.start,
            bitPosition - 1,
            affectedRange.cssClass,
            affectedRange.label
          ));
        }
        // Partie droite de la plage originale
        if (affectedRange.end > bitPosition) {
          newRanges.push(new BitRange(
            bitPosition + 1,
            affectedRange.end,
            affectedRange.cssClass,
            affectedRange.label
          ));
        }
      }

      // Ajouter le nouveau bit colorié
      let newBitRange = new BitRange(bitPosition, bitPosition, color.class, color.name);

      // Chercher les plages adjacentes de même couleur pour fusion
      const sameColorRanges = [...unaffectedRanges, ...newRanges]
        .filter(range => range.cssClass === color.class)
        .sort((a, b) => a.start - b.start);

      // Fusionner avec les plages adjacentes de même couleur
      for (const range of sameColorRanges) {
        if (range.end + 1 === newBitRange.start) {
          newBitRange.start = range.start;
          const index = newRanges.indexOf(range);
          if (index > -1) newRanges.splice(index, 1);
        } else if (range.start - 1 === newBitRange.end) {
          newBitRange.end = range.end;
          const index = newRanges.indexOf(range);
          if (index > -1) newRanges.splice(index, 1);
        }
      }

      return [
        ...unaffectedRanges.filter(range => !sameColorRanges.includes(range)),
        ...newRanges,
        newBitRange
      ];
    });
  };

  const controls = (
    <div className="mb-4 space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => setPaintMode(!paintMode)}
          className={`px-4 py-2 rounded ${
            paintMode ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
          } text-white`}
        >
          {paintMode ? 'Mode Pinceau' : 'Mode Bit'}
        </button>
      </div>

      {paintMode && (
        <div className="flex space-x-2 items-center">
          <span>Couleur : </span>
          {availableColors.map((color, index) => (
            <button
              key={index}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded ${color.class} ${
                selectedColor === color ? 'ring-2 ring-blue-500' : ''
              }`}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {controls}
      
      <IPDisplay
        title="Masque de sous-réseau"
        initialIP={mask}
        onIPChange={(newMask) => {
          setMask(newMask);
          if (!paintMode) {
            // En mode bit, on met à jour les couleurs du masque
            setCustomMaskRanges(getMaskRanges(newMask));
          }
        }}
        bitRanges={customMaskRanges}
        paintMode={paintMode}
        selectedColor={selectedColor}
        onColorChange={(pos, color) => handleColorChange(pos, color, true)}
        isMask={true}
      />

      <IPDisplay
        title="Adresse IP"
        initialIP={ip}
        onIPChange={setIP}
        bitRanges={customIPRanges}
        paintMode={paintMode}
        selectedColor={selectedColor}
        onColorChange={(pos, color) => handleColorChange(pos, color, false)}
        isMask={false}
      />

      <IPDisplay
        title="Adresse de travail"
        initialIP={padIP}
        onIPChange={setPadIP}
        bitRanges={customPadRanges}
        paintMode={paintMode}
        selectedColor={selectedColor}
        onColorChange={handleCopyColors}  // Modification ici
        isPad={true}
        sourceIP={ip}
        sourceBitRanges={customIPRanges}
        mask={mask}
      />

      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-semibold mb-2">Mode d'emploi :</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Mode Bit : cliquez sur un bit pour basculer sa valeur entre 0 et 1</li>
          <li>Mode Pinceau : sélectionnez une couleur et cliquez sur les bits pour les colorier</li>
        </ul>
      </div>
    </div>
  );
};

export default IPMaskDisplay;
export { BitRange };