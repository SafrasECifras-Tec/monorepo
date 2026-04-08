import React from 'react';
import { GlassCard } from '@socios/ui';
import { formatCurrency } from '@/lib/formatters';
import { motion } from 'motion/react';
import type { BancoItem } from '@/data/debt/debtBancosData';

export type { BancoItem } from '@/data/debt/debtBancosData';

interface Props {
  currencyMode: 'BRL' | 'SOJA';
  data: BancoItem[];
}

export function DebtBancosTab({ currencyMode, data }: Props) {
  const filteredBancos = data;

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {filteredBancos.map((banco, index) => (
        <motion.div
          key={banco.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <GlassCard className="flex flex-col overflow-hidden hover:shadow-md transition-all duration-300 p-0 h-full">
            <div className="p-5 flex flex-col gap-4 h-full">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-base">{banco.name}</h3>
                <div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                  <img
                    src={banco.logoUrl}
                    alt={`Logo ${banco.name}`}
                    className="w-full h-full object-contain"
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(banco.name)}&background=f1f5f9&color=475569`; }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Endividamento */}
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-sm font-medium text-slate-500">Endividamento</span>
                <span className="text-2xl font-bold text-slate-800">{formatCurrency(banco.endividamento, currencyMode)}</span>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500"  style={{ width: `${(banco.principal / banco.endividamento) * 100}%` }} />
                  <div className="h-full bg-slate-500" style={{ width: `${(banco.juros    / banco.endividamento) * 100}%` }} />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Principal: {((banco.principal / banco.endividamento) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Juros: {((banco.juros / banco.endividamento) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="flex items-center justify-between text-sm mt-2 pt-4 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Principal</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(banco.principal, currencyMode)}</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="flex flex-col text-right">
                  <span className="text-slate-500 text-xs">Juros</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(banco.juros, currencyMode)}</span>
                </div>
              </div>

              {/* Taxa */}
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Taxa Efetiva</span>
                <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">{banco.taxa.toFixed(2)}%</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
