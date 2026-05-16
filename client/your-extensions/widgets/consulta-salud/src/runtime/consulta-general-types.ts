import type { React } from 'jimu-core'
import type { ApiResponse } from '../../../shared/models/api-response.model'
import type { ArcgisService } from '../../../shared/services/arcgis.service'
import type { HttpService } from '../../../shared/services/http.service'
import type { ArcGisFeature, ArcGisField, SelectOption } from './types'

export type ExecuteFn = <T>(
    requestFn: (signal: AbortSignal) => Promise<ApiResponse<T>>
) => Promise<ApiResponse<T>>

export interface ConsultaGeneralProps {
    loading: boolean
    execute: ExecuteFn
    url: string
    idMunicipio: string
    setIdMunicipio: React.Dispatch<React.SetStateAction<string>>
    municipios: SelectOption[]
    setMessage: React.Dispatch<React.SetStateAction<string>>
    arcgisService: ArcgisService
    httpService: HttpService
}

export interface ConsultaComponentHandle {
    consultar: () => Promise<{
        features: ArcGisFeature[]
        fields: ArcGisField[]
        spatialReference?: __esri.SpatialReference
        withGraphic?: {
            showGraphic: boolean
            graphicData: any
            graphicType: string
            graphicTitle?: string
        }
    }>
    getFeatures: () => ArcGisFeature[]
    limpiar: () => void
}
