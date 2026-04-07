export interface BancoItem {
  name: string;
  endividamento: number;
  principal: number;
  juros: number;
  taxa: number;
  logoUrl: string;
}

export const bancosData: BancoItem[] = [
  {
    name: 'Banco Da Amazônia',
    endividamento: 38436675,
    principal: 32861317,
    juros: 5575358,
    taxa: 14.51,
    logoUrl: 'data:image/png;base64,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',
  },
  {
    name: 'Banco Do Brasil',
    endividamento: 17563410,
    principal: 14715197,
    juros: 2848212,
    taxa: 16.22,
    logoUrl: 'https://play-lh.googleusercontent.com/Ctl2nEe1onPHIxCjU4hnGrt_eGpld9GqYYyVQ02kWKeGqShlkzXppxlxBCwDvzjP6qzb',
  },
  {
    name: 'Caixa Econômica Federal',
    endividamento: 4550858,
    principal: 2956050,
    juros: 1594808,
    taxa: 35.04,
    logoUrl: 'https://informaq.abimaq.org.br/wp-content/uploads/2022/10/inf270-logo-caixa.jpg',
  },
  {
    name: 'Rabobank',
    endividamento: 4483705,
    principal: 3375588,
    juros: 1108117,
    taxa: 24.71,
    logoUrl: 'https://bancodealimentos.org.br/wp-content/uploads/2021/04/Rabobank-400x360.png',
  },
  {
    name: 'Banco Bradesco',
    endividamento: 232325,
    principal: 182400,
    juros: 49925,
    taxa: 21.49,
    logoUrl: 'https://yt3.googleusercontent.com/NzC_nWNvfoixhqwscQ9VhRPEowevFOxR06PmGzGKwyyDyT8khCZeY3s5w6Pk6YGvmwrVqA6jdg=s900-c-k-c0x00ffffff-no-rj',
  },
  {
    name: 'John Deere',
    endividamento: 203175,
    principal: 189000,
    juros: 14175,
    taxa: 6.98,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/John_Deere_logo.svg/1280px-John_Deere_logo.svg.png',
  },
];
