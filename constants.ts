import { Employee, ProductType, ProcessStatus, ReactorState, ReactorId } from './types';

export const EMPLOYEES: Employee[] = [
  { id: 'jv-01', name: 'João Victor', role: 'Operador de Produção' },
  { id: 'jc-02', name: 'José Carlos', role: 'Operador de Produção' },
  { id: 'vd-03', name: 'Vanderlei', role: 'Auxiliar de Produção' },
  { id: 'fp-04', name: 'Felipe', role: 'Auxiliar de Produção' },
  { id: 'ts-05', name: 'Tailson', role: 'Auxiliar de Produção' },
  { id: 'jr-06', name: 'Juan Rodrigues', role: 'Operador de Produção' },
];

export const PRODUCTS: ProductType[] = [
  'Cleanner Top',
  'Cleanner Fly',
  'Geo Mangânes',
  'Geo Complex Mn RR',
  'Geo Complex Zn',
  'Cleanner Star',
  'Geo Como',
  'Potence 11',
  'Potence Cobre',
  'Potence Raiz',
  'Potence Complex',
  'Cleanner Nitro 21',
  'Super King',
  'Sirius',
  'Potence Nitro',
  'Potence Nitro + H',
  'Potence Manganês',
  'Geo Potassio',
  'Geo Cobre',
  'Geo Zinco',
  'Geo Cab2',
  'Geo Raiz Leg Como',
  'Clean Cálcio',
  'Geo Boro',
  'Geo Como15',
  'Protege Crops',
  'Geo Fosfito',
  'Manganês RR',
  'Geo Magnésio',
  'Geo Kphos',
  'Geo Comoni',
  'Cleanner Cit',
  'Cleanner Neem',
  'Cleanner Mix',
  'Geo Molibdênio',
  'Potence Boro',
  'Potence Cálcio',
  'Inoculante',
  'Geo Ferro',
  'Inoculante Nitrogeo AZ',
  'Inoculante Soja (+/S/)',
  'Monarca',
  'Inoculante Panta Premium',
  '',

];

export const STATUS_OPTIONS: ProcessStatus[] = [
  'Pendente',
  'Em Andamento',
  'Controle de Qualidade',
  'Concluído',
  'Atrasado',
  'Colaborador de Férias'
];

export const MOCK_LOGS = [
  { id: '1', date: '2023-10-25', product: 'Cleanner Top' as ProductType, quantityM3: 120, shift: 'Matutino' as const, notes: 'Produção normal.' },
  { id: '2', date: '2023-10-25', product: 'Geo Mangânes' as ProductType, quantityM3: 85, shift: 'Matutino' as const, notes: 'Manutenção rápida na misturadora.' },
  { id: '3', date: '2023-10-26', product: 'Potence 11' as ProductType, quantityM3: 200, shift: 'Matutino' as const, notes: 'Alta eficiência.' },
];

export const MOCK_TASKS = [
  { id: 't1', title: 'Mistura Inicial Cleanner', description: 'Realizar mistura base conforme fórmula', assignedTo: 'jv-01', product: 'Cleanner Top' as ProductType, status: 'Em Andamento' as ProcessStatus, deadline: '2023-10-27T10:00' },
  { id: 't2', title: 'Ensacamento Geo', description: 'Operar linha de ensacamento 50kg', assignedTo: 'vd-03', product: 'Geo Mangânes' as ProductType, status: 'Pendente' as ProcessStatus, deadline: '2023-10-27T14:00' },
  { id: 't3', title: 'Controle de Qualidade Potence', description: 'Coletar amostras do lote 402', assignedTo: 'jc-02', product: 'Potence 11' as ProductType, status: 'Controle de Qualidade' as ProcessStatus, deadline: '2023-10-27T11:00' },
];

export const MOCK_REACTORS: ReactorState[] = [
  { id: 'R1', status: 'Operando', currentProduct: 'Cleanner Top', temperature: 65, lastUpdate: new Date().toISOString() },
  { id: 'R2', status: 'Parado', currentProduct: null, temperature: 25, lastUpdate: new Date().toISOString() },
  { id: 'R3', status: 'Manutenção', currentProduct: null, temperature: 22, lastUpdate: new Date().toISOString() },
  { id: 'R4', status: 'Operando', currentProduct: 'Geo Complex Zn', temperature: 72, lastUpdate: new Date().toISOString() },
  { id: 'R5', status: 'Limpeza', currentProduct: null, temperature: 30, lastUpdate: new Date().toISOString() },
  { id: 'R6', status: 'Parado', currentProduct: null, temperature: 24, lastUpdate: new Date().toISOString() },
];