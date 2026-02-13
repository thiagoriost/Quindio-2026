// -----------------------------------------
// Record fijo de Municipios → LayerId
// -----------------------------------------

export interface MunicipioRecord {
  dane: string
  nombre: string
  layerId: number
}

export interface MunicipioConfig {
  dane: string;
  nombre: string;
  layerId_predial: number | null;
  layerId_matricula: number | null;
}

// -----------------------------------------
// Catálogo oficial de municipios
// El layerId corresponde al índice del MapServer
// -----------------------------------------

export const MUNICIPIOS: MunicipioRecord[] = [
  { dane: '63001', nombre: 'Armenia', layerId: 0 },
  { dane: '63111', nombre: 'Buenavista', layerId: 1 },
  { dane: '63130', nombre: 'Calarcá', layerId: 2 },
  { dane: '63130', nombre: 'Circasia', layerId: 3 },
  { dane: '63212', nombre: 'Córdoba', layerId: 4 },
  { dane: '63272', nombre: 'Filandia', layerId: 5 },
  { dane: '63302', nombre: 'Génova', layerId: 6 },
  { dane: '63401', nombre: 'La Tebaida', layerId: 7 },
  { dane: '63470', nombre: 'Montenegro', layerId: 8 },
  { dane: '63548', nombre: 'Pijao', layerId: 9 },
  { dane: '63594', nombre: 'Quimbaya', layerId: 10 },
  { dane: '63690', nombre: 'Salento', layerId: 11 }
]

// -----------------------------------------
// Helpers (opcionales pero recomendados)
// -----------------------------------------

export const getMunicipioByDane = (dane: string): MunicipioRecord | undefined =>
  MUNICIPIOS.find(m => m.dane === dane)

export const getMunicipioByLayerId = (layerId: number): MunicipioRecord | undefined =>
  MUNICIPIOS.find(m => m.layerId === layerId)


export const MUNICIPIOS_CONFIG: MunicipioConfig[] = [
  {
    dane: '63001',
    nombre: 'Armenia',
    layerId_predial: 0,
    layerId_matricula: 12
  },
  {
    dane: '63111',
    nombre: 'Buenavista',
    layerId_predial: 1,
    layerId_matricula: 13
  },
  {
    dane: '63130',
    nombre: 'Calarcá',
    layerId_predial: 2,
    layerId_matricula: 14
  },
  {
    dane: '63190',
    nombre: 'Circasia',
    layerId_predial: 3,
    layerId_matricula: 15
  },
  {
    dane: '63212',
    nombre: 'Córdoba',
    layerId_predial: 4,
    layerId_matricula: 16
  },
  {
    dane: '63272',
    nombre: 'Filandia',
    layerId_predial: 5,
    layerId_matricula: 17
  },
  {
    dane: '63302',
    nombre: 'Génova',
    layerId_predial: 6,
    layerId_matricula: 18
  },
  {
    dane: '63401',
    nombre: 'La Tebaida',
    layerId_predial: 7,
    layerId_matricula: 19
  },
  {
    dane: '63470',
    nombre: 'Montenegro',
    layerId_predial: 8,
    layerId_matricula: 20
  },
  {
    dane: '63548',
    nombre: 'Pijao',
    layerId_predial: 8,
    layerId_matricula: 21
  },
  {
    dane: '63594',
    nombre: 'Quimbaya',
    layerId_predial: 10,
    layerId_matricula: 22
  },
  {
    dane: '63690',
    nombre: 'Salento',
    layerId_predial: 11,
    layerId_matricula: 23
  }
];
