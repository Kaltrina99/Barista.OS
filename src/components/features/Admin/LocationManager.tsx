import React, { useState } from 'react';
import { MapPin, X, Edit2, Check } from 'lucide-react';
import { Location } from '../../../types';
import { Modal, InputGroup } from '../../shared/Modals';
import { cn } from '../../../lib/utils';

interface LocationManagerProps {
  onClose: () => void;
  locations: Location[];
  activeLocationId: string;
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  newLocationName: string;
  setNewLocationName: (name: string) => void;
}

export const LocationManager: React.FC<LocationManagerProps> = ({
  onClose,
  locations,
  activeLocationId,
  onAdd,
  onUpdate,
  onDelete,
  newLocationName,
  setNewLocationName
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const isInvalid = !newLocationName.trim();

  const handleStartEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditValue(loc.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      onUpdate(editingId, editValue.trim());
      setEditingId(null);
    }
  };

  return (
    <Modal onClose={onClose} title="Location Matrix">
      <div className="space-y-10">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (!isInvalid) onAdd(newLocationName);
          }} 
          className="space-y-4 bg-[#F9F8F6] p-8 rounded-[32px] border border-[#E8E2D9]"
        >
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40] mb-4">Provision New Node</h4>
          <InputGroup 
            label="Branch Name" 
            value={newLocationName} 
            onChange={setNewLocationName} 
            placeholder="e.g. Downtown Loft" 
          />
          <button 
            type="submit" 
            disabled={isInvalid}
            className={cn(
              "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              isInvalid 
                ? "bg-[#E8E2D9] text-[#8C857D] cursor-not-allowed" 
                : "bg-[#5A5A40] text-white hover:opacity-90 active:scale-95 shadow-xl shadow-[#5A5A40]/20"
            )}
          >
            Establish Location
          </button>
        </form>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8C857D] mb-4 flex items-center gap-2">
            <MapPin size={14} />
            Active Infrastructure
          </h4>
          <div className="grid gap-3">
            {locations.map(loc => (
              <div key={loc.id} className="flex items-center justify-between p-5 bg-white border border-[#E8E2D9] rounded-[24px] group hover:border-[#5A5A40] transition-all">
                <div className="flex-1 mr-4">
                  {editingId === loc.id ? (
                    <input 
                      autoFocus
                      className="w-full bg-transparent border-b-2 border-[#C88D67] font-bold text-[#2D2A26] outline-none"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      onBlur={handleSaveEdit}
                    />
                  ) : (
                    <p className="font-bold text-[#2D2A26] capitalize">{loc.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {loc.id === activeLocationId && (
                    <span className="text-[8px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100">Live</span>
                  )}
                  {editingId === loc.id ? (
                    <button 
                      onClick={handleSaveEdit}
                      className="p-2.5 text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-all border border-green-200"
                    >
                      <Check size={18} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStartEdit(loc)}
                      className="p-2.5 text-[#8C857D] hover:text-[#5A5A40] hover:bg-[#F0EBE4] rounded-xl transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  
                  {loc.id !== 'default' ? (
                    deletingId === loc.id ? (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            onDelete(loc.id);
                            setDeletingId(null);
                          }}
                          className="px-3 py-2 bg-red-500 text-white text-[9px] font-black uppercase rounded-lg hover:bg-red-600"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="p-2 text-[#8C857D] hover:bg-[#F0EBE4] rounded-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeletingId(loc.id)}
                        className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Decommission Node"
                      >
                        <X size={18} />
                      </button>
                    )
                  ) : (
                    <span className="text-[8px] font-black text-[#5A5A40] bg-[#EBDCCB] px-3 py-1 rounded-lg uppercase tracking-tighter border border-[#D9C4AE]">Master Node</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-[#F5F5F0]">
          <button 
            onClick={onClose}
            className="w-full py-4 border border-[#E8E2D9] text-[#8C857D] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F9F8F6] transition-all"
          >
            Finish Configuration
          </button>
        </div>
      </div>
    </Modal>
  );
};
