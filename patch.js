const fs = require('fs');
const content = fs.readFileSync('src/components/OwnerCommandCenterView.tsx', 'utf8');
const search = `  const advisors: AdvisorPerformance[] = [`;
const inject = `  // Audit History Mock
  const auditLogs = [
    {
      id: 'audit-1',
      date: '13/Set/2026 14:22',
      user: 'Carlos Eduardo Mendes',
      portfolio: 'Holding Morumbi',
      action: 'Rebalanceamento Tático',
      details: 'Redução de Exposição em FIIs (-2.5%)',
      status: 'Sucesso'
    },
    {
      id: 'audit-2',
      date: '12/Set/2026 09:15',
      user: 'Marina Fagundes',
      portfolio: 'Prev Institucional Alpha',
      action: 'Ajuste de Caixa (D+0)',
      details: 'Resgate de NTN-B para Cobertura de Saques',
      status: 'Sucesso'
    },
    {
      id: 'audit-3',
      date: '10/Set/2026 16:40',
      user: 'Sistema Automático',
      portfolio: 'Tech Growth',
      action: 'Alerta de Desenquadramento',
      details: 'Limite CVM excedido em 12% (PETR4)',
      status: 'Parcial'
    },
    {
      id: 'audit-4',
      date: '08/Set/2026 11:05',
      user: 'Renata Vasconcellos',
      portfolio: 'Fundo Exclusivo Delta',
      action: 'Adequação de Risco',
      details: 'Troca de emissor de Crédito Privado',
      status: 'Sucesso'
    }
  ];

`;
const newContent = content.replace(search, inject + search);
fs.writeFileSync('src/components/OwnerCommandCenterView.tsx', newContent);
