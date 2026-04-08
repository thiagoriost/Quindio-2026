import * as XLSX from 'xlsx'
import { loadModules } from 'esri-loader'
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import Graphic from '@arcgis/core/Graphic'
import { Point, Polygon, Polyline } from "@arcgis/core/geometry"
import type { JimuMapView } from 'jimu-arcgis'
import Query from "@arcgis/core/rest/support/Query"
import { executeQueryJSON } from "@arcgis/core/rest/query"
// import { appActions, getAppStore } from 'jimu-core'


/**
 * Genera un archivo CSV a partir de un arreglo de entidades ArcGIS.
 *
 * Convierte los atributos de cada {@link __esri.Graphic} en una estructura
 * tabular (matriz de filas y columnas) y utiliza `xlsx` para transformarlo
 * en formato CSV.
 *
 * @param {__esri.Graphic[]} features
 * Lista de entidades gráficas provenientes de una consulta ArcGIS.
 *
 * @param {string[]} [fields]
 * Lista opcional de campos a exportar.
 * - Si se proporciona, solo se exportarán esos campos y en ese orden.
 * - Si no se proporciona, se tomarán automáticamente las claves del
 *   primer `feature.attributes`.
 *
 * @returns {string}
 * Contenido del archivo en formato CSV como texto plano.
 * Devuelve cadena vacía si no hay datos.
 *
 * @example
 * ```ts
 * const csv = generateCSV(features, ['NUMERO', 'PROPIETARIO'])
 * downloadBlob(csv, 'predios.csv', 'text/csv;charset=utf-8;')
 * ```
 */
export const generateCSV = (
  features: __esri.Graphic[],
  fields?: string[]
): string => {

  if (!features || features.length === 0) return ''

  const headers = fields?.length
    ? fields
    : Object.keys(features[0].attributes)

  const rows = features.map(feature =>
    headers.map(field => feature.attributes[field] ?? '')
  )

  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    ...rows
  ])

  return XLSX.utils.sheet_to_csv(worksheet)
}


/**
 * Genera un archivo Excel (.xlsx) en memoria a partir de entidades ArcGIS.
 *
 * Construye un `Workbook` utilizando la librería `xlsx`,
 * agregando una hoja llamada **"Datos"**.
 *
 * @param {__esri.Graphic[]} features
 * Lista de entidades gráficas provenientes de una consulta ArcGIS.
 *
 * @param {string[]} [fields]
 * Lista opcional de campos a exportar.
 * - Si se proporciona, solo se exportarán esos campos.
 * - Si no se proporciona, se usarán automáticamente los atributos
 *   del primer elemento.
 *
 * @throws {Error}
 * Lanza error si el arreglo está vacío.
 *
 * @returns {ArrayBuffer}
 * Buffer binario listo para ser descargado como archivo `.xlsx`.
 *
 * @example
 * ```ts
 * const buffer = generateExcelBuffer(features)
 * downloadBlob(
 *   buffer,
 *   'predios.xlsx',
 *   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
 * )
 * ```
 */
export const generateExcelBuffer = (
  features: __esri.Graphic[],
  fields?: string[]
): ArrayBuffer => {

  if (!features || features.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  const headers = fields?.length
    ? fields
    : Object.keys(features[0].attributes)

  const data = features.map(feature => {
    const row: any = {}
    headers.forEach(field => {
      row[field] = feature.attributes[field] ?? ''
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')

  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  })
}


/**
 * Descarga contenido en el navegador creando dinámicamente
 * un objeto `Blob` y un enlace temporal.
 *
 * Esta función es genérica y puede utilizarse para:
 * - CSV
 * - Excel
 * - JSON
 * - TXT
 * - PDF (si se pasa el mimeType correcto)
 *
 * @param {BlobPart} content
 * Contenido del archivo (string, ArrayBuffer, etc.).
 *
 * @param {string} fileName
 * Nombre del archivo que verá el usuario al descargar.
 *
 * @param {string} mimeType
 * Tipo MIME del archivo (ej: `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).
 *
 * @example
 * ```ts
 * downloadBlob(
 *   csvContent,
 *   'reporte.csv',
 *   'text/csv;charset=utf-8;'
 * )
 * ```
 */
export const downloadBlob = (
  content: BlobPart,
  fileName: string,
  mimeType: string
) => {

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()

  URL.revokeObjectURL(url)
}

export const drawFeaturesOnMap = async (response: { features: any; spatialReference: any }, jimuMapView: JimuMapView, zoom = 15) => {
  let geometry: __esri.Point | __esri.Polygon | __esri.Polyline = null
  let symbol: { type: string; color: string; outline: { color: string; width: number } } = null
  if (!response)
    { return }
  const { features, spatialReference } = response
  if (!jimuMapView || features.length === 0 || !response) return

  const [PopupTemplate,
        SimpleMarkerSymbol,
        SimpleLineSymbol,
        ] =
        await loadModules(
          ['esri/PopupTemplate',
          'esri/symbols/SimpleMarkerSymbol',
          'esri/symbols/SimpleLineSymbol'])

  const graphicsLayer = new GraphicsLayer()

  for (const feature of features as Array<{ geometry: { rings: any; x: any; y: any; paths: any }; attributes: { [x: string]: any } }>) {
    if (validaLoggerLocalStorage('logger')) console.log("Tipo geometría =>",feature.geometry)
    //Validación de un Polígono
    if (feature.geometry.rings) {
      // setTypeGraphMap("polygon")

      const polygon = new Polygon({
        rings: feature.geometry.rings,
        spatialReference: spatialReference
      })

      const symbolGraph = {
        type: 'simple-fill',
        color: "orange",
        outline: {
          color: "magenta",
          width: 0.5
        }
      }
      geometry = polygon
      symbol = symbolGraph
    }
    //Validación de un Punto
    if (feature.geometry.x || feature.geometry.y)
    {

      const point = new Point({
        x: feature.geometry.x,
        y: feature.geometry.y,
        spatialReference: spatialReference
      })

      if (validaLoggerLocalStorage('logger')) console.log("Objeto Point =>",point)

      const outlPoint = new SimpleLineSymbol({
        color: [255, 255, 0], // Amarillo
        width: 1
      })
    const symbPoint = new SimpleMarkerSymbol({
        color: [255, 0, 0], // Rojo
        outline:outlPoint,
        size: '8px'
    })
    geometry = point
    symbol = symbPoint
  }
  //Validación del tipo polilinea
  if (feature.geometry.paths) {


    const polyline = new Polyline({
      paths: feature.geometry.paths,
      spatialReference: spatialReference
    })

    const symbolGraph = {
      type: 'simple-fill',
      color: "orange",
      outline: {
        color: "magenta",
        width: 0.5
      }
    }
    geometry = polyline
    symbol = symbolGraph
  }
    const popupTemplate = new PopupTemplate({
      title: "Feature Info",
      content: `
          <ul>
            ${Object.keys(feature.attributes).map(key => `<li><strong>${key}:</strong> ${feature.attributes[key]}</li>`).join('')}
          </ul>
        `
    })

    const graphic = new Graphic({
      //geometry: polygon,
      geometry: geometry,
      //symbol: symbolGraph,
      symbol: symbol,
      attributes: feature.attributes,
      popupTemplate: popupTemplate
    })

    graphicsLayer.add(graphic)
  }

  jimuMapView.view.map.add(graphicsLayer)

  //Extent y zoom de la geometría en el mapa
  jimuMapView.view.goTo({
    target: graphicsLayer.graphics.getItemAt(0).geometry,
    zoom // Ajusta el nivel de zoom según sea necesario
  })
  return graphicsLayer
}

/**
 * Restaura la vista del mapa a la extensión y zoom iniciales.
 * @returns {void}
 */
export const goToInitialExtent = (varJimuMapView: JimuMapView, initialExtent: any, initialZoom: number) => {

    if (!varJimuMapView || !initialExtent) return

    varJimuMapView.view.goTo({
      target: initialExtent,
      zoom: initialZoom
    })

  }

export interface QueryOptions {
    url?: string;
    where?: string;
    campos?: string[];
    returnGeometry?: boolean;
    spatialReference?: __esri.SpatialReference;
    varJimuMapView?: JimuMapView;
  }

export const ejecutarConsulta = async ({
    url,
    where,
    campos,
    returnGeometry = true,
    spatialReference
  }: QueryOptions): Promise<__esri.Graphic[]> => {

    if (!url || !where) {
      throw new Error("URL o condición WHERE inválida")
    }

    try {

      const query = new Query({
        where,
        outFields: campos?.length ? campos : ["*"],
        returnGeometry,
        outSpatialReference: spatialReference,
        spatialRelationship: "intersects"
      })

      const response = await executeQueryJSON(url, query)
     if (validaLoggerLocalStorage('logger')) console.log({response})
      return response.features

    } catch (error) {

      console.error("Error ejecutando consulta:", error)

      if (validaLoggerLocalStorage('logger')) { console.log(
        "<B> Info </B>",
        "No se logró completar la operación"
      ) }

      throw error
    }
  }

  export const validaLoggerLocalStorage = (key: string): boolean => {
    let loggerParsed = null
    try {
      loggerParsed = JSON.parse(localStorage.getItem(key))?.logger
    } catch (e) {
      loggerParsed = localStorage.getItem(key)
    }
    return loggerParsed === true
  }