import React from 'react';
import { Warehouse, TrendingUp, Package, PackageCheck } from 'lucide-react';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import { formatSacas } from '@/lib/formatters';
import type { CropStock } from '@/data/cashflow/estoqueData';

const fmtCurrency = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

interface SummaryCardsProps {
  stockData: CropStock[];
}

export function SummaryCards({ stockData }: SummaryCardsProps) {
  const totalInicial = stockData.reduce((s, c) => s + c.initialStock, 0);
  const totalVendido = stockData.reduce((s, c) => s + c.soldStock, 0);
  const totalSaldo   = totalInicial - totalVendido;
  const totalReceita = stockData.reduce(
    (s, c) => s + c.sales.reduce((ss, v) => ss + v.totalValue, 0), 0
  );

  const cards = [
    {
      label: 'Estoque Total',
      value: formatSacas(totalInicial),
      icon: <Package className="h-5 w-5" />,
      iconBg: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'Total Vendido',
      value: formatSacas(totalVendido),
      icon: <PackageCheck className="h-5 w-5" />,
      iconBg: 'bg-[#f59e0b]/10 text-[#f59e0b]',
    },
    {
      label: 'Saldo a Comercializar',
      value: formatSacas(totalSaldo),
      icon: <Warehouse className="h-5 w-5" />,
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Receita Total',
      value: fmtCurrency(totalReceita),
      icon: <TrendingUp className="h-5 w-5" />,
      iconBg: 'bg-blue-50 text-blue-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <GlassCard key={c.label} className="p-5 flex items-center gap-4">
          <div className={cn('p-2.5 rounded-xl', c.iconBg)}>{c.icon}</div>
          <div className="min-w-0">
            <p className="text-[14px] text-slate-500 font-medium">{c.label}</p>
            <p className="text-[24px] font-bold text-slate-800 truncate leading-tight">{c.value}</p>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
