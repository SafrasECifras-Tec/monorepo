import React from 'react';
import { motion } from 'motion/react';
import { Warehouse } from 'lucide-react';
import type { CropStock } from '@/data/cashflow/estoqueData';
import { SummaryCards, CropCard } from './components';

// ─── Main Export ──────────────────────────────────────────────────────────────

interface EstoqueTabProps {
  stockData: CropStock[];
}

export function EstoqueTab({ stockData }: EstoqueTabProps) {
  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {/* Summary cards com entrada escalonada */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <SummaryCards stockData={stockData} />
      </motion.div>

      <motion.div
        className="space-y-4"
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Culturas
          </h3>
        </div>

        <motion.div
          className="space-y-4"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
        >
          {stockData.map((crop) => (
            <motion.div
              key={crop.name}
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <CropCard crop={crop} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
