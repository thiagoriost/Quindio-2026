/**
 * Payload de resultados enviado al WidgetResult.
 *
 * Usado para transferir resultados entre widgets
 * mediante el store global de Experience Builder.
 */
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
}

export interface ResultField {
  name: string        // nombre del atributo
  alias?: string      // etiqueta visible
  type?: 'string' | 'number' | 'date'
}