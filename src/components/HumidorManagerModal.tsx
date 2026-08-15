import React, { useState } from 'react';
import { X, Box, Droplets, Thermometer, Calendar } from 'lucide-react';
import { Humidor, HumidorType } from '../types';

interface HumidorManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (humidor: Omit<Humidor, 'id' | 'createdAt'>, idToEdit?: string) => void;
  humidorToEdit?: Humidor | null;
}

export const HumidorManagerModal: React.FC<HumidorManagerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  humidorToEdit,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(humidorToEdit?.name || '');
  const [location, setLocation] = useState(humidorToEdit?.location || 'Study');
  const [type, setType] = useState<HumidorType>(humidorToEdit?.type || 'Spanish Cedar Desktop');
  const [currentHumidity, setCurrentHumidity] = useState<number>(humidorToEdit?.currentHumidity || 66);
  const [targetHumidity, setTargetHumidity] = useState<number>(humidorToEdit?.targetHumidity || 66);
  const [currentTemp, setCurrentTemp] = useState<number>(humidorToEdit?.currentTemp || 68);
  const [targetTemp, setTargetTemp] = useState<number>(humidorToEdit?.targetTemp || 68);
  const [tempUnit] = useState<'F' | 'C'>(humidorToEdit?.tempUnit || 'F');
  const [maxCapacity, setMaxCapacity] = useState<number>(humidorToEdit?.maxCapacity || 50);
  const [bovedaPackType, setBovedaPackType] = useState(humidorToEdit?.bovedaPackType || 'Boveda 65% 60g (x2)');
  const [bovedaInstalledDate, setBovedaInstalledDate] = useState(
    humidorToEdit?.bovedaInstalledDate || new Date().toISOString().split('T')[0]
  );
  const [bovedaRechargeDays, setBovedaRechargeDays] = useState<number>(humidorToEdit?.bovedaRechargeDays || 90);
  const [hygrometerModel, setHygrometerModel] = useState(humidorToEdit?.hygrometerModel || 'Digital Bluetooth');
  const [notes, setNotes] = useState(humidorToEdit?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please provide a humidor name.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        location: location.trim(),
        type,
        currentHumidity,
        targetHumidity,
        currentTemp,
        targetTemp,
        tempUnit,
        maxCapacity,
        bovedaPackType: bovedaPackType.trim(),
        bovedaInstalledDate,
        bovedaRechargeDays,
        hygrometerModel: hygrometerModel.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      humidorToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-[#1C1816] border border-[#2C2621] rounded-lg shadow-2xl overflow-hidden text-[#E5E1DA]">
        <div className="px-6 py-4 bg-[#13110F] border-b border-[#2C2621] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1C1816] border border-[#2C2621] flex items-center justify-center text-[#D4AF37]">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-[#E5E1DA]">
                {humidorToEdit ? 'Edit Humidor Setup' : 'Add New Humidor'}
              </h2>
              <p className="text-xs text-[#A89F94]">Configure environment target parameters & seasoning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A89F94] hover:text-[#E5E1DA] p-1.5 rounded hover:bg-[#241E1B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Humidor Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cedar Desktop, Aging Tupperdor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Humidor Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as HumidorType)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              >
                <option value="Spanish Cedar Desktop">Spanish Cedar Desktop</option>
                <option value="Aging Cabinet">Aging Cabinet / End Table</option>
                <option value="Airtight Tupperdor">Airtight Tupperdor</option>
                <option value="Coolerdor / Wineador">Coolerdor / Wineador</option>
                <option value="Travel Herf-a-Dor">Travel Herf-a-Dor</option>
                <option value="Other">Other Container</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Physical Location</label>
              <input
                type="text"
                placeholder="e.g. Study Bookshelf, Basement"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#13110F] border border-[#2C2621] rounded-lg">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Current RH%</span>
              </label>
              <input
                type="number"
                min="50"
                max="80"
                value={currentHumidity}
                onChange={(e) => setCurrentHumidity(parseInt(e.target.value, 10) || 65)}
                className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Target RH%</label>
              <input
                type="number"
                min="55"
                max="75"
                value={targetHumidity}
                onChange={(e) => setTargetHumidity(parseInt(e.target.value, 10) || 65)}
                className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Temp (°{tempUnit})</span>
              </label>
              <input
                type="number"
                value={currentTemp}
                onChange={(e) => setCurrentTemp(parseInt(e.target.value, 10) || 68)}
                className="w-full bg-[#1C1816] border border-[#2C2621] rounded-md px-3 py-1.5 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Stick Capacity</label>
              <input
                type="number"
                min="5"
                max="1000"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value, 10) || 50)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Hygrometer Sensor</label>
              <input
                type="text"
                placeholder="e.g. Govee Smart Bluetooth"
                value={hygrometerModel}
                onChange={(e) => setHygrometerModel(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Humidification (Boveda / Beads)</label>
              <input
                type="text"
                placeholder="e.g. Boveda 65% 60g (x2)"
                value={bovedaPackType}
                onChange={(e) => setBovedaPackType(e.target.value)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Cycle (Days)</label>
              <input
                type="number"
                value={bovedaRechargeDays}
                onChange={(e) => setBovedaRechargeDays(parseInt(e.target.value, 10) || 90)}
                className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Boveda Refresh / Installed Date</label>
            <input
              type="date"
              value={bovedaInstalledDate}
              onChange={(e) => setBovedaInstalledDate(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#A89F94] mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Seasoning details, calibration notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#13110F] border border-[#2C2621] rounded-md px-3 py-2 text-xs text-[#E5E1DA] focus:outline-hidden focus:border-[#D4AF37]"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-[#2C2621] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#13110F] hover:bg-[#241E1B] text-[#A89F94] hover:text-[#E5E1DA] border border-[#2C2621] rounded text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0F0D0C] font-bold uppercase tracking-wider rounded text-xs shadow-sm transition cursor-pointer"
            >
              {humidorToEdit ? 'Update Humidor' : 'Create Humidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
