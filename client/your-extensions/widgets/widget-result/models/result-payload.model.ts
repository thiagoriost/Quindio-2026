/**
 * Payload de resultados enviado al WidgetResult.
 *
 * Usado para transferir resultados entre widgets
 * mediante el store global de Experience Builder.
 */

export interface ChartDataItem {// cef 20260320
  name: string;
  value: number;
}

export interface ResultPayload {
  /** Widget que envía los resultados */
  sourceWidgetId: string

  /** Título a mostrar en el header */
  title: string

  /** Feactures devueltas por la consulta */
  features: __esri.Graphic[]

  /** Campos a mostrar en la tabla */
  fields: ResultField[]

  /** Referencia espacial de los features */
   spatialReference?: __esri.SpatialReference

  /** Permite zoom al seleccionar fila */
  enableZoom?: boolean

  /** Texto del botón de retorno */
  returnLabel?: string

/** Indica si la capa es temporal */
  temporalLayer?: boolean

  /** Indica si la capa es temporal */
  valorBusqueda?: string

  /** Indica si muestra grafico cef 20260320 */
  withGraphic?: boolean

   // cef 20260320
  graphicData?: ChartDataItem[];
  graphicType?: "bar" | "pie";
  graphicTitle?: string
}

export interface ResultField {
  name: string // nombre del atributo
  alias?: string // etiqueta visible
//  type?: 'string' | 'number' | 'date'
   type: __esri.FieldProperties['type'] // obligatorio y compatible con tipos de campo de ArcGIS
}