export interface SaleRecord {
  date: string;
  quantity: number;   // sacas vendidas
  avgPrice: number;   // preço médio por saca (R$)
  totalValue: number; // quantity × avgPrice
}

export interface CropStock {
  name: string;
  color: string;        // cor da badge
  bgColor: string;      // fundo do ícone
  initialStock: number; // estoque inicial (sacas)
  soldStock: number;    // total já vendido (sacas)
  sales: SaleRecord[];
}

export const cropStockData: CropStock[] = [
  {
    name: 'Soja',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    initialStock: 120000,
    soldStock: 68000,
    sales: [
      { date: '15/06/2026', quantity: 20000, avgPrice: 145.00, totalValue: 2900000 },
      { date: '28/05/2026', quantity: 18000, avgPrice: 142.50, totalValue: 2565000 },
      { date: '10/05/2026', quantity: 15000, avgPrice: 138.00, totalValue: 2070000 },
      { date: '22/04/2026', quantity: 10000, avgPrice: 140.00, totalValue: 1400000 },
      { date: '05/04/2026', quantity: 5000,  avgPrice: 135.00, totalValue: 675000  },
    ],
  },
  {
    name: 'Milho',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-200',
    initialStock: 92000,
    soldStock: 31000,
    sales: [
      { date: '22/06/2026', quantity: 4000,  avgPrice: 135.00, totalValue: 540000  },
      { date: '10/06/2026', quantity: 10000, avgPrice: 140.00, totalValue: 1400000 },
      { date: '30/05/2026', quantity: 7000,  avgPrice: 125.00, totalValue: 875000  },
      { date: '24/04/2026', quantity: 5000,  avgPrice: 135.00, totalValue: 675000  },
      { date: '24/04/2026', quantity: 5000,  avgPrice: 135.00, totalValue: 675000  },
    ],
  },
  {
    name: 'Milho Safrinha',
    color: 'text-lime-700',
    bgColor: 'bg-lime-50 border-lime-200',
    initialStock: 48000,
    soldStock: 4000,
    sales: [
      { date: '27/06/2026', quantity: 2500, avgPrice: 78.00, totalValue: 195000 },
      { date: '23/06/2026', quantity: 1500, avgPrice: 78.00, totalValue: 117000 },
    ],
  },
  {
    name: 'Feijão',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    initialStock: 18000,
    soldStock: 8000,
    sales: [
      { date: '18/06/2026', quantity: 3000, avgPrice: 320.00, totalValue: 960000  },
      { date: '02/06/2026', quantity: 3000, avgPrice: 315.00, totalValue: 945000  },
      { date: '14/05/2026', quantity: 2000, avgPrice: 310.00, totalValue: 620000  },
    ],
  },
  {
    name: 'Trigo',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    initialStock: 35000,
    soldStock: 20000,
    sales: [
      { date: '20/06/2026', quantity: 8000,  avgPrice: 98.00,  totalValue: 784000  },
      { date: '08/06/2026', quantity: 7000,  avgPrice: 95.00,  totalValue: 665000  },
      { date: '25/05/2026', quantity: 5000,  avgPrice: 92.00,  totalValue: 460000  },
    ],
  },
];
