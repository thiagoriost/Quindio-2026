export type ArcGisFeature = {
    attributes?: Record<string, unknown>
    geometry?: Record<string, unknown>
}

export type ArcGisField = {
    name: string
    alias?: string
    type: __esri.FieldProperties['type']
}

export type ArcGisQueryResponse = {
    features?: ArcGisFeature[]
    fields?: ArcGisField[]
    spatialReference?: __esri.SpatialReference
}

export type SelectOption = {
    value: string
    label: string
}
/*
export type ConsultaIndicadoresProps = {
    loading: boolean
    loadingIndicadores: boolean
    loadingCategoriasIndicadores: boolean
    indicador: string
    setIndicador: React.Dispatch<React.SetStateAction<string>>
    indicadores: SelectOption[]
    idCategoria: string
    setIdCategoria: React.Dispatch<React.SetStateAction<string>>
    categoriasIndicadores: SelectOption[]
    anio: string
    setAnio: React.Dispatch<React.SetStateAction<string>>
}*/

export type ConsultaTematicasProps = {
    loading: boolean
    tematica: string
    setTematica: React.Dispatch<React.SetStateAction<string>>
    idMunicipioTematica: string
    setIdMunicipioTematica: React.Dispatch<React.SetStateAction<string>>
    municipios: SelectOption[]
    rangoEdad: string
    setRangoEdad: React.Dispatch<React.SetStateAction<string>>
    anioTematica: string
    setAnioTematica: React.Dispatch<React.SetStateAction<string>>
}
