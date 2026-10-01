import React, { useState } from 'react';
import { CardData, DEFAULT_CARD_DATA } from '../types/card';
import {
  Users,
  UserPlus,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
} from 'lucide-react';

interface BatchManagerProps {
  cards: CardData[];
  setCards: React.Dispatch<React.SetStateAction<CardData[]>>;
  activeCardId: string;
  setActiveCardId: (id: string) => void;
}

export const PRESET_CARDS: CardData[] = [
  {
    ...DEFAULT_CARD_DATA,
    id: 'sample-1',
    surnames: 'FLORES VILLACRE',
    firstNames: 'AUGUSTO SERGIO FERNANDO',
    dateOfBirth: '16/09/1964',
    dniNumber: '07557840',
    selectedClubId: 'cc-el-bosque',
    clubNameText: 'CC. EL BOSQUE',
  },
  {
    ...DEFAULT_CARD_DATA,
    id: 'sample-2',
    surnames: 'MENDOZA QUISPE',
    firstNames: 'CARLOS ALBERTO',
    dateOfBirth: '22/04/1971',
    dniNumber: '10849201',
    selectedClubId: 'club-regatas',
    clubNameText: 'CRL - REGATAS',
  },
  {
    ...DEFAULT_CARD_DATA,
    id: 'sample-3',
    surnames: 'BENAVIES PAREDES',
    firstNames: 'JAVIER ENRIQUE',
    dateOfBirth: '05/11/1968',
    dniNumber: '08342918',
    selectedClubId: 'cc-rinconada',
    clubNameText: 'CC. RINCONADA',
  },
];

export const BatchManager: React.FC<BatchManagerProps> = ({
  cards,
  setCards,
  activeCardId,
  setActiveCardId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const activeCard = cards.find((c) => c.id === activeCardId) || cards[0];

  const handleAddNew = () => {
    const newCard: CardData = {
      ...DEFAULT_CARD_DATA,
      id: `card-${Date.now()}`,
      surnames: 'NUEVO JUGADOR',
      firstNames: 'NOMBRE',
      dateOfBirth: '01/01/1970',
      dniNumber: '00000000',
    };
    setCards((prev) => [...prev, newCard]);
    setActiveCardId(newCard.id);
  };

  const handleDuplicate = () => {
    if (!activeCard) return;
    const duplicated: CardData = {
      ...activeCard,
      id: `card-${Date.now()}`,
      firstNames: `${activeCard.firstNames} (COPIA)`,
    };
    setCards((prev) => [...prev, duplicated]);
    setActiveCardId(duplicated.id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cards.length <= 1) {
      alert('Debe mantener al menos una tarjeta en la lista.');
      return;
    }
    const filtered = cards.filter((c) => c.id !== id);
    setCards(filtered);
    if (activeCardId === id) {
      setActiveCardId(filtered[0].id);
    }
  };

  const filteredCards = cards.filter(
    (c) =>
      c.surnames.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.firstNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dniNumber.includes(searchTerm)
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-red-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Nómina de Carnets ({cards.length})
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nuevo
          </button>
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all"
            title="Duplicar Carnet Actual"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por apellido, nombre o DNI..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Cards List */}
      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredCards.map((card) => {
          const isActive = card.id === activeCardId;
          return (
            <div
              key={card.id}
              onClick={() => setActiveCardId(card.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                isActive
                  ? 'border-red-500/80 bg-red-950/20 text-white'
                  : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <div className="truncate flex-1 pr-2">
                <div className="text-xs font-bold truncate font-mono">
                  {card.surnames || 'SIN APELLIDO'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {card.firstNames || 'Sin nombre'} · DNI: {card.dniNumber}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  {card.clubNameText || 'CC'}
                </span>
                {cards.length > 1 && (
                  <button
                    onClick={(e) => handleDelete(card.id, e)}
                    className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                    title="Eliminar carnet"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
