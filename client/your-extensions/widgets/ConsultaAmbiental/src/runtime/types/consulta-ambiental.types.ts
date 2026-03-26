export interface ConsultaAmbientalFilters {

  area?: string

  tematica?: string

  categoria?: string

  subcategoria?: string

  nombre?: string

  anio?: number

  municipio?: string

  fechaInicio?: Date

  fechaFin?: Date

   idMunicipio?: string // cef 20260324
}

export interface OptionItem {

  label: string
  value: string
}
