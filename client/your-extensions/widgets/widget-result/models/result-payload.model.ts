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
  withGraphic?: {
    showGraphic: boolean
    graphicData: ChartDataItem[]
    graphicType: string
    graphicTitle?: string
    selectedIndicador?: number, // para manejar diferentes indicadores que pueden venir con la gráficafeaturesDibujados?: any[] // para manejar casos como el indicador 3 donde se dibujan características en el mapa además de mostrar la gráfica
    fieldToFilter?: string, // campo que se emplea para renderizar el grafico, se asume que es el campo principal para mostrar en el gráfico, por ejemplo "ESTUDIANTESMATRICULADOS" para el caso de cobertura educativa
    dataCoropletico?: {
      fieldsToFilter: any[] // lista de campos disponibles para mostrar en el gráfico, se asume que el primer campo es el principal para mostrar inicialmente
      label: string // etiqueta para mostrar en la leyenda
      leyenda: Array<{ minimo: number; maximo: number; colorFondo: string; colorLine: string }>
    }
  }

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