import { React } from 'jimu-core'

export type ConsultaAmbientalFilters = {
  area: number | null
  tematica: number | null
  categoria: number | null
  subcategoria: string | null
  nombre: string | null
  municipio: string | null
  anio: string | null
  fechaInicio: number | null
  fechaFin: number | null
  idMunicipio: string | null
}

const INITIAL_FILTERS: ConsultaAmbientalFilters = {
  area: null,
  tematica: null,
  categoria: null,
  subcategoria: null,
  nombre: null,
  municipio: null,
  anio: null,
  fechaInicio: null,
  fechaFin: null,
  idMunicipio: null
}

export const useCascadingFilters = () => {

  const [filters, setFilters] = React.useState<ConsultaAmbientalFilters>(INITIAL_FILTERS)

  const setFilter = <K extends keyof ConsultaAmbientalFilters>(
    campo: K,
    valor: ConsultaAmbientalFilters[K]
  ) => {

    setFilters(prev => {

//      console.log("PREV STATE:", prev)

      const updated: ConsultaAmbientalFilters = {
        ...prev,
        [campo]: valor
      }

//      console.log("SET:", campo, valor)

      // Cascada de limpieza
      if (campo === "area") {
        updated.tematica = null
        updated.categoria = null
        updated.subcategoria = null
        updated.nombre = null
        updated.municipio = null
        updated.fechaInicio = null
        updated.fechaFin = null
      }

      if (campo === "tematica") {
        updated.categoria = null
        updated.subcategoria = null
        updated.nombre = null
      }

      if (campo === "categoria") {
        updated.subcategoria = null
        updated.nombre = null
      }

      if (campo === "subcategoria") {
        updated.nombre = null
      }

      if (campo === "municipio") {
        updated.fechaInicio = null
        updated.fechaFin = null
      }

      return updated
    })

  }

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS)
  }

  return {
    filters,
    setFilter,
    clearFilters
  }

}