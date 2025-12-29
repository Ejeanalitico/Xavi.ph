import React, { useEffect, useState } from 'react';
import { AddOnOptions, AddOnLabels, BookingState, Package } from '../types';
import { StorageService } from '../services/storageService';

interface CalculatorProps {
  basePackage: Package;
  bookingState: BookingState;
  onChange: (field: keyof BookingState, value: string) => void;
  onTotalChange: (total: number) => void;
}

const Calculator: React.FC<CalculatorProps> = ({ basePackage, bookingState, onChange, onTotalChange }) => {
  const [prices, setPrices] = useState<AddOnOptions>(StorageService.getAddonPrices());
  const [labels, setLabels] = useState<AddOnLabels>(StorageService.getAddonLabels());

  useEffect(() => {
    setPrices(StorageService.getAddonPrices());
    setLabels(StorageService.getAddonLabels());
  }, []);
  
  const calculateTotal = () => {
    let total = basePackage.price;
    
    // Canvas
    if (bookingState.canvasSize === 'small') total += prices.canvas.small;
    if (bookingState.canvasSize === 'medium') total += prices.canvas.medium;
    if (bookingState.canvasSize === 'large') total += prices.canvas.large;

    // Photobook
    if (bookingState.photobookSize === 'pages20') total += prices.photobook.pages20;
    if (bookingState.photobookSize === 'pages40') total += prices.photobook.pages40;
    if (bookingState.photobookSize === 'pages60') total += prices.photobook.pages60;

    // Prints
    if (bookingState.printSet === 'set10') total += prices.prints.set10;
    if (bookingState.printSet === 'set20') total += prices.prints.set20;
    if (bookingState.printSet === 'set50') total += prices.prints.set50;

    return total;
  };

  const currentTotal = calculateTotal();

  useEffect(() => {
    onTotalChange(currentTotal);
  }, [bookingState, basePackage, currentTotal, onTotalChange]);

  return (
    <div className="bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-800 mt-6">
      <h3 className="font-serif text-xl mb-4 text-white">Personaliza tu Experiencia</h3>
      
      <div className="space-y-4">
        {/* Canvas */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Cuadro Canvas</label>
          <select 
            className="w-full border-zinc-700 rounded-md shadow-sm p-2 border bg-zinc-800 focus:ring-white focus:border-white text-white"
            value={bookingState.canvasSize}
            onChange={(e) => onChange('canvasSize', e.target.value)}
          >
            <option value="none">Sin cuadro adicional</option>
            <option value="small">{labels.canvas.small} (+${prices.canvas.small})</option>
            <option value="medium">{labels.canvas.medium} (+${prices.canvas.medium})</option>
            <option value="large">{labels.canvas.large} (+${prices.canvas.large})</option>
          </select>
        </div>

        {/* Photobook */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Photobook Premium</label>
          <select 
            className="w-full border-zinc-700 rounded-md shadow-sm p-2 border bg-zinc-800 focus:ring-white focus:border-white text-white"
            value={bookingState.photobookSize}
            onChange={(e) => onChange('photobookSize', e.target.value)}
          >
            <option value="none">Sin photobook</option>
            <option value="pages20">{labels.photobook.pages20} (+${prices.photobook.pages20})</option>
            <option value="pages40">{labels.photobook.pages40} (+${prices.photobook.pages40})</option>
            <option value="pages60">{labels.photobook.pages60} (+${prices.photobook.pages60})</option>
          </select>
        </div>

        {/* Prints */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Fotos Físicas</label>
          <select 
            className="w-full border-zinc-700 rounded-md shadow-sm p-2 border bg-zinc-800 focus:ring-white focus:border-white text-white"
            value={bookingState.printSet}
            onChange={(e) => onChange('printSet', e.target.value)}
          >
            <option value="none">Solo entrega digital</option>
            <option value="set10">{labels.prints.set10} (+${prices.prints.set10})</option>
            <option value="set20">{labels.prints.set20} (+${prices.prints.set20})</option>
            <option value="set50">{labels.prints.set50} (+${prices.prints.set50})</option>
          </select>
        </div>

        <div className="pt-4 mt-4 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-gray-400">Inversión Total:</span>
            <span className="text-2xl font-serif font-bold text-white">${currentTotal.toLocaleString('es-MX')}</span>
        </div>
      </div>
    </div>
  );
};

export default Calculator;