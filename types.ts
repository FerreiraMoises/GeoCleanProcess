export type Role = 'Operador de Produção' | 'Auxiliar de Produção';

export interface Employee {
  id: string;
  name: string;
  role: Role;
}

export type ProductType =
  | 'Cleanner Top'
  | 'Cleanner Fly'
  | 'Geo Mangânes'
  | 'Geo Complex Mn RR'
  | 'Geo Complex Zn'
  | 'Cleanner Star'
  | 'Geo Como'
  | 'Potence 11'
  | 'Potence Cobre'
  | 'Potence Raiz'
  | 'Potence Complex'
  | 'Cleanner Nitro 21'
  | 'Super King'
  | 'Sirius'
  | 'Potence Nitro'
  | 'Potence Nitro + H'
  | 'Potence Manganês'
  | 'Geo Potassio'
  | 'Geo Cobre'
  | 'Geo Zinco'
  | 'Geo Cab2'
  | 'Geo Raiz Leg Como'
  | 'Clean Cálcio'
  | 'Geo Boro'
  | 'Geo Como15'
  | 'Protege Crops'
  | 'Geo Fosfito'
  | 'Manganês RR'
  | 'Geo Magnésio'
  | 'Geo Kphos'
  | 'Geo Comoni'
  | 'Cleanner Cit'
  | 'Cleanner Neem'
  | 'Cleanner Mix'
  | 'Geo Molibdênio'
  | 'Potence Boro'
  | 'Potence Cálcio';

export type ProcessStatus = 'Pendente' | 'Em Andamento' | 'Controle de Qualidade' | 'Concluído' | 'Atrasado' | 'Colaborador de Férias';

export interface ProductionLog {
  id: string;
  date: string;
  product: ProductType;
  quantityM3: number;
  shift: 'Matutino';
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Employee ID
  product: ProductType;
  status: ProcessStatus;
  deadline: string;
}

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  efficiencyScore: number;
}

export type ReactorId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6';
export type ReactorStatus = 'Operando' | 'Parado' | 'Manutenção' | 'Limpeza';

export interface ReactorState {
  id: ReactorId;
  status: ReactorStatus;
  currentProduct: ProductType | null;
  temperature: number;
  lastUpdate: string;
}

export type ObservacaoTipo = 'quebra_equipamento' | 'falta_materia_prima';

export interface Observacao {
  id: string;
  tipo: ObservacaoTipo;
  descricao: string;
  timestamp: string;
}