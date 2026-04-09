import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wheat, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socios/ui';
import { cn } from '@/lib/utils';
import type { CurrencyMode } from '@/lib/formatters';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const currentMonthIndex = new Date().getMonth();

const formatFullValue = (value: number, currencyMode: CurrencyMode) => {
  if (value === 0) return '-';

  let displayValue = value;
  let prefix = 'R$ ';

  if (currencyMode === 'SOJA') {
    displayValue = value / 120;
    prefix = 'scs ';
  }
  if (currencyMode === 'USD') {
    displayValue = value / 5.5; // Mock rate
    prefix = 'US$ ';
  }

  return prefix + displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

import type { CropStock } from '@/data/cashflow/estoqueData';

interface CropDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cropName: string | null;
  cropStock?: CropStock | null;
  currencyMode: CurrencyMode;
  onAddProjection: (monthIndex: number, value: number, quantity: number, avgPrice: number) => void;
}

export function CropDrawer({ isOpen, onClose, cropName, cropStock, currencyMode, onAddProjection }: CropDrawerProps) {
  const firstFutureMonth = String(currentMonthIndex + 1);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simMonth, setSimMonth] = useState<string>(firstFutureMonth);
  const [simQuantity, setSimQuantity] = useState<string>('');
  const [simPrice, setSimPrice] = useState<string>('');
  const lastCropName = useRef(cropName);

  if (cropName) lastCropName.current = cropName;

  // Reseta o formulário sempre que uma nova cultura for aberta
  useEffect(() => {
    if (cropName) {
      setShowSimulation(false);
      setSimMonth(firstFutureMonth);
      setSimQuantity('');
      setSimPrice('');
    }
  }, [cropName]);

  const stockTotal = cropStock?.initialStock ?? 0;
  const stockSaldo = cropStock ? cropStock.initialStock - cropStock.soldStock : 0;

  const calculatedValue = parseFloat(simQuantity || '0') * parseFloat(simPrice || '0');

  const handleAddProjection = () => {
    if (!simQuantity || !simPrice) return;
    onAddProjection(parseInt(simMonth), calculatedValue, parseFloat(simQuantity), parseFloat(simPrice));
    setShowSimulation(false);
    setSimQuantity('');
    setSimPrice('');
    setSimMonth(firstFutureMonth);
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-slate-900/20 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        key="drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Wheat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cultura: {lastCropName.current}</h2>
              <p className="text-sm text-slate-500">Resumo de Estoque</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Summary Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Resumo de Estoque</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Estoque Total</span>
                <span className="text-base font-bold text-slate-800">{stockTotal.toLocaleString('pt-BR')} scs</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-800">Saldo a Comercializar</span>
                <span className="text-base font-bold text-emerald-700">{stockSaldo.toLocaleString('pt-BR')} scs</span>
              </div>
            </div>
          </div>

          {/* Simulation Form */}
          <div className="space-y-3">
            {!showSimulation ? (
              <button
                onClick={() => setShowSimulation(true)}
                className="w-full py-2.5 px-4 border-2 border-dashed border-emerald-200 text-emerald-700 font-medium rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                + Simular Nova Venda
              </button>
            ) : (
              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-emerald-800">Projetar Venda</h3>
                  <button onClick={() => setShowSimulation(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Mês</label>
                    <Select value={String(simMonth)} onValueChange={setSimMonth}>
                      <SelectTrigger className="h-9 w-full rounded-lg border-border/60 bg-background/70 text-sm shadow-soft">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {months.map((m, i) => {
                          const isRealized = i <= currentMonthIndex;
                          return (
                            <SelectItem key={i} value={String(i)} disabled={isRealized}>
                              {isRealized ? `${m} (Realizado)` : m}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Quantidade</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={simQuantity}
                        onChange={(e) => setSimQuantity(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 pr-8 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">scs</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Preço Médio</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                      <input
                        type="number"
                        value={simPrice}
                        onChange={(e) => setSimPrice(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 pl-7 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500 block">Valor Final Projetado</span>
                    <span
                      className={cn(
                        'text-lg font-bold',
                        simQuantity && simPrice ? 'text-emerald-600' : 'text-slate-400'
                      )}
                    >
                      = {simQuantity && simPrice ? formatFullValue(calculatedValue, currencyMode) : 'R$ 0,00'}
                    </span>
                  </div>
                  <button
                    onClick={handleAddProjection}
                    disabled={!simQuantity || !simPrice}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Adicionar ao Fluxo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  );
}
