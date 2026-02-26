/**
 * @fileoverview Widget principal de Tabla de Contenido.
 * Se encarga de consultar la data del servicio y renderizar el árbol de capas.
 *
 * @module tablaContenido4/widget
 * @requires jimu-core
 * @requires jimu-arcgis
 */

import { React, type AllWidgetProps } from "jimu-core"
import { useState, useEffect } from "react"
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import '../styles/style.css'
import type { ItemResponseTablaContenido, TablaDeContenidoInterface } from "../types/interfaces"
import Widget_Tree from "./components/widgetTree"
import { fallbackTablaContenido } from "../data/fallbackTablaContenido"

/**
 * Widget principal que gestiona la Tabla de Contenido.
 * Consulta los datos del servicio y los pasa al componente Widget_Tree
 * para construir la estructura jerárquica del árbol.
 *
 * @component
 * @param {AllWidgetProps<any>} props - Propiedades del widget de Experience Builder
 * @returns {JSX.Element} Widget con el mapa y la tabla de contenido
 *
 * @author Rigoberto Rios - rigoriosh@gmail.com
 * @since 2024
 */
const Widget = (props: AllWidgetProps<any>) => {

  /** @type {JimuMapView|undefined} Referencia al mapa de Jimu */
  const [varJimuMapView, setJimuMapView] = useState<JimuMapView>()

  /** @type {ItemResponseTablaContenido[]} Datos planos de la tabla de contenido (sin jerarquía) */
  const [dataTablaContenido, setDataTablaContenido] = useState<ItemResponseTablaContenido[]>([])

  /** @type {any} Módulo de utilidades cargado dinámicamente */
  const [utilsModule, setUtilsModule] = useState<any>(null)

  /**
   * Manejador del cambio de vista activa del mapa.
   * Guarda la referencia al mapa en el estado del componente.
   *
   * @param {JimuMapView} jmv - Vista del mapa de Jimu
   * @returns {void}
   */
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
    }
  }

  /**
   * Inicia la consulta de datos de la tabla de contenido con un delay.
   * Espera 3 segundos antes de consultar para asegurar que el módulo de servicios esté listo.
   *
   * @param {Object} modulo - Módulo de servicios con las URLs de los endpoints
   * @returns {void}
   */
  const TraerDataTablaContenido = (modulo: any) => {

    setTimeout(async () => {
      const data = await getDataTablaContenido(modulo)
      if (utilsModule?.logger()) console.log("Data tabla contenido:", data)
      if(!data) return
      setDataTablaContenido(data)
    }, 3000)
  }

  /**
   * realiza la consulta de la data tabla de contenido la primera vez que se renderiza el componente
   */
  useEffect(() => {
    if (utilsModule?.logger()) console.log(" Tabla de contenido - useEffect inicial => ", {props})
    import('../../../api/servicios').then(modulo => {
      TraerDataTablaContenido(modulo)
    })
    import('../../../utils/module').then(modulo => { setUtilsModule(modulo) })


  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-100  contenedorTablaContenido"
    style={{backgroundColor:'var(--sys-color-primary)'}}>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}

      {
        varJimuMapView && <Widget_Tree dataTablaContenido={dataTablaContenido} setDataTablaContenido={setDataTablaContenido} varJimuMapView={varJimuMapView}/>
      }

    </div>
  )
}

export default Widget

/**
 * Consulta los datos de la tabla de contenido desde el servicio REST.
 * Retorna datos planos (sin jerarquía) que luego son transformados
 * por la función `buildTree` en widgetTree.tsx para construir el árbol.
 * Si el servicio no responde o falla, utiliza los datos de fallback.
 *
 * @async
 * @param {Object} servicios - Módulo con las URLs de los servicios
 * @param {Object} servicios.urls - Objeto con las URLs
 * @param {string} servicios.urls.tablaContenido - URL del endpoint de tabla de contenido
 * @returns {Promise<ItemResponseTablaContenido[]|undefined>} Array plano de datos o undefined si hay error
 *
 * @example
 * const data = await getDataTablaContenido(serviciosModule)
 * // data contiene registros con IDTEMATICA, IDTEMATICAPADRE, URL, etc.
 * // Los que tienen URL son capas, los que no tienen URL son temáticas/carpetas
 *
 * @author IGAC - DIP
 * @since 2024
 */
export const getDataTablaContenido = async (servicios: { urls: { tablaContenido: string; }; }): Promise<ItemResponseTablaContenido[] | undefined> => {
  const url = servicios.urls.tablaContenido

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData: TablaDeContenidoInterface[] = await response.json()

    // Verificar si la respuesta tiene datos válidos
    if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
      console.warn('Servicio sin datos, usando datos de fallback')
      return fallbackTablaContenido
    }

    // Mapear y normalizar los datos para asegurar consistencia de tipos
    const normalizedData: ItemResponseTablaContenido[] = responseData.map(item => ({
      ATRIBUTO: item.ATRIBUTO || '',
      DESCRIPCIONSERVICIO: item.DESCRIPCIONSERVICIO || '' as any,
      IDCAPA: Number(item.IDCAPA) || 0,
      IDTEMATICA: Number(item.IDTEMATICA) || 0,
      IDTEMATICAPADRE: Number(item.IDTEMATICAPADRE) || 0,
      METADATOCAPA: item.METADATOCAPA || '',
      METADATOSERVICIO: item.METADATOSERVICIO || '',
      NOMBRECAPA: item.NOMBRECAPA || '',
      NOMBRETEMATICA: item.NOMBRETEMATICA || '',
      TITULOCAPA: item.TITULOCAPA || '',
      URL: item.URL || '',
      URLSERVICIOWFS: item.URLSERVICIOWFS || '',
      VISIBLE: item.VISIBLE || false
    }))

    return normalizedData
  } catch (error) {
    console.error('Error fetching layers, usando datos de fallback:', error)
    return fallbackTablaContenido
  }
}


