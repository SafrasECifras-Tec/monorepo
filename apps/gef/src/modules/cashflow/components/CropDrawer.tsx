import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wheat, X } from 'lucide-react';
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
        className="fixed inset-0 bg-foreground/20 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        key="drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-card shadow-2xl z-50 flex flex-col border-l border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-accent/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Wheat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Cultura: {lastCropName.current}</h2>
              <p className="text-sm text-muted-foreground">Resumo de Estoque</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Summary Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Resumo de Estoque</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-accent border border-border/50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Estoque Total</span>
                <span className="text-base font-bold text-foreground">{stockTotal.toLocaleString('pt-BR')} scs</span>
              </div>
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Saldo a Comercializar</span>
                <span className="text-base font-bold text-primary">{stockSaldo.toLocaleString('pt-BR')} scs</span>
              </div>
            </div>
          </div>

          {/* Simulation Form */}
          <div className="space-y-3">
            {!showSimulation ? (
              <button
                onClick={() => setShowSimulation(true)}
                className="w-full py-2.5 px-4 border-2 border-dashed border-primary/20 text-primary font-medium rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                + Simular Nova Venda
              </button>
            ) : (
              <div className="bg-card border border-primary/20 rounded-xl p-4 shadow-soft space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-primary">Projetar Venda</h3>
                  <button onClick={() => setShowSimulation(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Mês</label>
                    <select
                      value={simMonth}
                      onChange={(e) => setSimMonth(e.target.value)}
                      className="w-full text-sm border border-border rounded-lg p-2 bg-accent focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    >
                      {months.map((m, i) => {
                        const isRealized = i <= currentMonthIndex;
                        return (
                          <option key={i} value={i} disabled={isRealized}>
                            {isRealized ? `${m} (Realizado)` : m}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={simQuantity}
                        onChange={(e) => setSimQuantity(e.target.value)}
                        className="w-full text-sm border border-border rounded-lg p-2 pr-8 bg-accent focus:ring-2 focus:ring-primary focus:border-primary outline-none text-right"
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">scs</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Preço Médio</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <input
                        type="number"
                        value={simPrice}
                        onChange={(e) => setSimPrice(e.target.value)}
                        className="w-full text-sm border border-border rounded-lg p-2 pl-7 bg-accent focus:ring-2 focus:ring-primary focus:border-primary outline-none text-right"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div>
                    <span className="text-xs text-muted-foreground block">Valor Final Projetado</span>
                    <span
                      className={cn(
                        'text-lg font-bold',
                        simQuantity && simPrice ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      = {simQuantity && simPrice ? formatFullValue(calculatedValue, currencyMode) : 'R$ 0,00'}
                    </span>
                  </div>
                  <button
                    onClick={handleAddProjection}
                    disabled={!simQuantity || !simPrice}
                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
