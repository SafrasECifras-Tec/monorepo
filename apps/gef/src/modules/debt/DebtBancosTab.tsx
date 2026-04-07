import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
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
          <GlassCard className="flex flex-col overflow-hidden hover:shadow-card transition-all duration-300 p-0 h-full">
            <div className="p-5 flex flex-col gap-4 h-full">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-base">{banco.name}</h3>
                <div className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center overflow-hidden shrink-0 shadow-soft p-1">
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
                <span className="text-sm font-medium text-muted-foreground">Endividamento</span>
                <span className="text-2xl font-bold text-foreground">{formatCurrency(banco.endividamento, currencyMode)}</span>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500"  style={{ width: `${(banco.principal / banco.endividamento) * 100}%` }} />
                  <div className="h-full bg-muted-foreground" style={{ width: `${(banco.juros    / banco.endividamento) * 100}%` }} />
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Principal: {((banco.principal / banco.endividamento) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span>Juros: {((banco.juros / banco.endividamento) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="flex items-center justify-between text-sm mt-2 pt-4 border-t border-border/50">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Principal</span>
                  <span className="font-semibold text-foreground">{formatCurrency(banco.principal, currencyMode)}</span>
                </div>
                <div className="w-px h-8 bg-muted" />
                <div className="flex flex-col text-right">
                  <span className="text-muted-foreground text-xs">Juros</span>
                  <span className="font-semibold text-foreground">{formatCurrency(banco.juros, currencyMode)}</span>
                </div>
              </div>

              {/* Taxa */}
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Taxa Efetiva</span>
                <span className="text-sm font-bold text-foreground bg-muted px-2.5 py-1 rounded-md">{banco.taxa.toFixed(2)}%</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
