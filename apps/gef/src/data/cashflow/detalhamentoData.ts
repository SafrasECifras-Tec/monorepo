export const detalhamentoData = [
  // JANEIRO
  { id: 22, data: '2026-01-10', descricao: 'Venda Milho Safrinha', fornecedor: 'Cargill Agricola', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Santa Maria', valor: 350000, status: 'recebido', tipo: 'entrada' },
  { id: 45, data: '2026-01-20', descricao: 'Venda Trator Antigo (Ford 6600)', fornecedor: 'Leilão Agrícola', categoria: 'Venda de Ativos', centroCusto: 'Geral', valor: 85000, status: 'recebido', tipo: 'entrada' },
  { id: 23, data: '2026-01-15', descricao: 'Compra de Herbicidas', fornecedor: 'Bayer', categoria: 'Insumos', centroCusto: 'Fazenda Boa Vista', valor: -42000, status: 'pago', tipo: 'saida' },
  { id: 24, data: '2026-01-28', descricao: 'Folha de Pagamento - Janeiro', fornecedor: 'Colaboradores', categoria: 'Mão de Obra', centroCusto: 'Geral', valor: -85000, status: 'pago', tipo: 'saida' },

  // FEVEREIRO
  { id: 25, data: '2026-02-05', descricao: 'Venda Soja Disponível', fornecedor: 'ADM do Brasil', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Santa Maria', valor: 620000, status: 'recebido', tipo: 'entrada' },
  { id: 46, data: '2026-02-25', descricao: 'Rendimento Aplicação CDB', fornecedor: 'Banco do Brasil', categoria: 'Receita Financeira', centroCusto: 'Geral', valor: 12400, status: 'recebido', tipo: 'entrada' },
  { id: 26, data: '2026-02-12', descricao: 'Diesel S10 - 3000L', fornecedor: 'Posto Agro', categoria: 'Combustíveis', centroCusto: 'Fazenda Santa Maria', valor: -21000, status: 'pago', tipo: 'saida' },
  { id: 27, data: '2026-02-20', descricao: 'Manutenção Caminhão Scania', fornecedor: 'Mecânica Diesel', categoria: 'Manutenção', centroCusto: 'Geral', valor: -15800, status: 'pago', tipo: 'saida' },

  // MARÇO
  { id: 21, data: '2026-03-17', descricao: 'Venda Soja Spot (Teste Hoje)', fornecedor: 'Cargill Agricola', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Santa Maria', valor: 250000, status: 'recebido', tipo: 'entrada' },
  { id: 47, data: '2026-03-25', descricao: 'Locação de Pasto (Gado Terceiros)', fornecedor: 'Pecuária Silva', categoria: 'Serviços Prestados', centroCusto: 'Fazenda Boa Vista', valor: 15000, status: 'recebido', tipo: 'entrada' },
  { id: 28, data: '2026-03-20', descricao: 'Peças para Plantadeira', fornecedor: 'John Deere', categoria: 'Manutenção', centroCusto: 'Fazenda Santa Maria', valor: -8400, status: 'pago', tipo: 'saida' },
  { id: 29, data: '2026-03-28', descricao: 'Folha de Pagamento - Março', fornecedor: 'Colaboradores', categoria: 'Mão de Obra', centroCusto: 'Geral', valor: -85000, status: 'pago', tipo: 'saida' },

  // ABRIL
  { id: 48, data: '2026-04-10', descricao: 'Indenização Sinistro Granizo', fornecedor: 'Mapfre Seguros', categoria: 'Seguros', centroCusto: 'Fazenda Boa Vista', valor: 110000, status: 'recebido', tipo: 'entrada' },
  { id: 31, data: '2026-04-15', descricao: 'Venda Milho Spot', fornecedor: 'Amaggi', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Boa Vista', valor: 185000, status: 'recebido', tipo: 'entrada' },
  { id: 30, data: '2026-04-05', descricao: 'Prêmio Seguro Agrícola', fornecedor: 'Allianz', categoria: 'Seguros', centroCusto: 'Geral', valor: -28000, status: 'pago', tipo: 'saida' },
  { id: 32, data: '2026-04-20', descricao: 'Energia Elétrica - Irrigação', fornecedor: 'Enel', categoria: 'Despesas Fixas', centroCusto: 'Fazenda Santa Maria', valor: -12500, status: 'pago', tipo: 'saida' },

  // MAIO
  { id: 33, data: '2026-05-10', descricao: 'Adiantamento Safra Inverno', fornecedor: 'Banco Sicredi', categoria: 'Financiamentos', centroCusto: 'Geral', valor: 300000, status: 'recebido', tipo: 'entrada' },
  { id: 49, data: '2026-05-25', descricao: 'Venda de Silagem', fornecedor: 'Laticínios Vale', categoria: 'Venda de Outros Insumos', centroCusto: 'Fazenda Santa Maria', valor: 45000, status: 'recebido', tipo: 'entrada' },
  { id: 34, data: '2026-05-18', descricao: 'Fertilizante Cobertura', fornecedor: 'Yara Brasil', categoria: 'Insumos', centroCusto: 'Fazenda Boa Vista', valor: -95000, status: 'pago', tipo: 'saida' },

  // JUNHO
  { id: 35, data: '2026-06-12', descricao: 'Venda de Trigo', fornecedor: 'Cooperativa Local', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Santa Maria', valor: 210000, status: 'recebido', tipo: 'entrada' },
  { id: 50, data: '2026-06-20', descricao: 'Restituição ICMS Insumos', fornecedor: 'Gov Estado', categoria: 'Créditos Tributários', centroCusto: 'Geral', valor: 28400, status: 'recebido', tipo: 'entrada' },
  { id: 36, data: '2026-06-25', descricao: 'Revisão Colheitadeira', fornecedor: 'MaqCampo', categoria: 'Manutenção', centroCusto: 'Geral', valor: -35000, status: 'pago', tipo: 'saida' },

  // JULHO
  { id: 37, data: '2026-07-08', descricao: 'Venda Milho Futuro', fornecedor: 'Cargill Agricola', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Santa Maria', valor: 400000, status: 'recebido', tipo: 'entrada' },
  { id: 51, data: '2026-07-15', descricao: 'Dividendos Cooperativa', fornecedor: 'Coopercitrus', categoria: 'Receita Financeira', centroCusto: 'Geral', valor: 55000, status: 'recebido', tipo: 'entrada' },
  { id: 38, data: '2026-07-20', descricao: 'Compra de Calcário', fornecedor: 'Mineradora Sul', categoria: 'Insumos', centroCusto: 'Fazenda Boa Vista', valor: -65000, status: 'pago', tipo: 'saida' },

  // AGOSTO
  { id: 1, data: '2026-08-10', descricao: 'Fertilizante NPK 04-14-08', fornecedor: 'Bunge Alimentos', categoria: 'Insumos', centroCusto: 'Fazenda Santa Maria', valor: -450000, status: 'pago', tipo: 'saida' },
  { id: 2, data: '2026-08-12', descricao: 'Semente de Soja M6410 IPRO', fornecedor: 'Monsoy', categoria: 'Insumos', centroCusto: 'Fazenda Santa Maria', valor: -320000, status: 'pago', tipo: 'saida' },
  { id: 3, data: '2026-08-15', descricao: 'Venda Soja Contrato #882', fornecedor: 'Cargill Agricola', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Santa Maria', valor: 1800000, status: 'recebido', tipo: 'entrada' },
  { id: 4, data: '2026-08-20', descricao: 'Diesel S10 - 5000L', fornecedor: 'Posto Agro', categoria: 'Combustíveis', centroCusto: 'Fazenda Santa Maria', valor: -35000, status: 'pendente', tipo: 'saida' },
  { id: 5, data: '2026-08-25', descricao: 'Manutenção Trator JD 6125J', fornecedor: 'MaqCampo', categoria: 'Manutenção', centroCusto: 'Fazenda Santa Maria', valor: -12500, status: 'atrasado', tipo: 'saida' },
  { id: 6, data: '2026-08-28', descricao: 'Folha de Pagamento - Agosto', fornecedor: 'Colaboradores', categoria: 'Mão de Obra', centroCusto: 'Geral', valor: -85000, status: 'pago', tipo: 'saida' },

  // SETEMBRO
  { id: 7, data: '2026-09-05', descricao: 'Venda Milho Spot', fornecedor: 'ADM do Brasil', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Santa Maria', valor: 450000, status: 'pendente', tipo: 'entrada' },
  { id: 10, data: '2026-09-15', descricao: 'Adiantamento Safra', fornecedor: 'Banco Sicredi', categoria: 'Financiamentos', centroCusto: 'Geral', valor: 500000, status: 'recebido', tipo: 'entrada' },
  { id: 8, data: '2026-09-10', descricao: 'Parcela Trator 4/12', fornecedor: 'Banco do Brasil', categoria: 'Maquinário', centroCusto: 'Geral', valor: -45000, status: 'pendente', tipo: 'saida' },
  { id: 9, data: '2026-09-12', descricao: 'Energia Elétrica', fornecedor: 'Enel', categoria: 'Despesas Fixas', centroCusto: 'Geral', valor: -8500, status: 'pendente', tipo: 'saida' },
  { id: 11, data: '2026-09-18', descricao: 'Defensivos Agrícolas', fornecedor: 'Syngenta', categoria: 'Insumos', centroCusto: 'Fazenda Boa Vista', valor: -210000, status: 'pendente', tipo: 'saida' },
  { id: 12, data: '2026-09-20', descricao: 'Seguro Agrícola', fornecedor: 'Mapfre', categoria: 'Seguros', centroCusto: 'Geral', valor: -65000, status: 'pago', tipo: 'saida' },
  { id: 13, data: '2026-09-22', descricao: 'Peças Colheitadeira', fornecedor: 'John Deere', categoria: 'Manutenção', centroCusto: 'Fazenda Santa Maria', valor: -18500, status: 'pago', tipo: 'saida' },
  { id: 14, data: '2026-09-25', descricao: 'Consultoria Agronômica', fornecedor: 'AgroConsult', categoria: 'Serviços', centroCusto: 'Geral', valor: -15000, status: 'pendente', tipo: 'saida' },
  { id: 15, data: '2026-09-28', descricao: 'Folha de Pagamento - Setembro', fornecedor: 'Colaboradores', categoria: 'Mão de Obra', centroCusto: 'Geral', valor: -85000, status: 'pendente', tipo: 'saida' },

  // OUTUBRO
  { id: 16, data: '2026-10-02', descricao: 'Venda Soja Futuro', fornecedor: 'Amaggi', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Boa Vista', valor: 1200000, status: 'pendente', tipo: 'entrada' },
  { id: 52, data: '2026-10-25', descricao: 'Empréstimo Custeio BNDES', fornecedor: 'Banco do Brasil', categoria: 'Empréstimos', centroCusto: 'Geral', valor: 850000, status: 'recebido', tipo: 'entrada' },
  { id: 17, data: '2026-10-05', descricao: 'Arrendamento Terra', fornecedor: 'Espólio Silva', categoria: 'Arrendamento', centroCusto: 'Fazenda Boa Vista', valor: -150000, status: 'pendente', tipo: 'saida' },
  { id: 18, data: '2026-10-10', descricao: 'Parcela Trator 5/12', fornecedor: 'Banco do Brasil', categoria: 'Maquinário', centroCusto: 'Geral', valor: -45000, status: 'pendente', tipo: 'saida' },
  { id: 19, data: '2026-10-12', descricao: 'Calcário Agrícola', fornecedor: 'Mineradora Sul', categoria: 'Insumos', centroCusto: 'Fazenda Santa Maria', valor: -55000, status: 'pago', tipo: 'saida' },
  { id: 20, data: '2026-10-15', descricao: 'Frete Grãos', fornecedor: 'Transportadora Rápido', categoria: 'Logística', centroCusto: 'Geral', valor: -32000, status: 'pendente', tipo: 'saida' },

  // NOVEMBRO
  { id: 39, data: '2026-11-05', descricao: 'Venda Soja Contrato #885', fornecedor: 'Cargill Agricola', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Santa Maria', valor: 950000, status: 'pendente', tipo: 'entrada' },
  { id: 53, data: '2026-11-15', descricao: 'Frete Terceirizado Realizado', fornecedor: 'Vizinho João', categoria: 'Serviços Prestados', centroCusto: 'Geral', valor: 8200, status: 'recebido', tipo: 'entrada' },
  { id: 40, data: '2026-11-12', descricao: 'Diesel S10 - 4000L', fornecedor: 'Posto Agro', categoria: 'Combustíveis', centroCusto: 'Fazenda Santa Maria', valor: -28000, status: 'pendente', tipo: 'saida' },
  { id: 41, data: '2026-11-20', descricao: 'Insumos Proteção Culturas', fornecedor: 'Syngenta', categoria: 'Insumos', centroCusto: 'Fazenda Boa Vista', valor: -120000, status: 'pendente', tipo: 'saida' },

  // DEZEMBRO
  { id: 42, data: '2026-12-10', descricao: 'Venda Milho Safrinha', fornecedor: 'Amaggi', categoria: 'Venda de Grãos', centroCusto: 'Fazenda Santa Maria', valor: 420000, status: 'pendente', tipo: 'entrada' },
  { id: 54, data: '2026-12-28', descricao: 'Ajuste Saldo Safra', fornecedor: 'ADM do Brasil', categoria: 'Ajuste de Saldo', centroCusto: 'Geral', valor: 4500, status: 'recebido', tipo: 'entrada' },
  { id: 43, data: '2026-12-15', descricao: 'Décimo Terceiro Salário', fornecedor: 'Colaboradores', categoria: 'Mão de Obra', centroCusto: 'Geral', valor: -95000, status: 'pendente', tipo: 'saida' },
  { id: 44, data: '2026-12-20', descricao: 'Parcela Trator 7/12', fornecedor: 'Banco do Brasil', categoria: 'Maquinário', centroCusto: 'Geral', valor: -45000, status: 'pendente', tipo: 'saida' },
];