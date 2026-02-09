import { React, type AllWidgetProps } from "jimu-core"
import { useState, useEffect } from "react"
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis' // The map object can be accessed using the JimuMapViewComponent
import '../styles/style.css'
import type { ItemResponseTablaContenido, TablaDeContenidoInterface } from "../types/interfaces"
import Widget_Tree from "./components/widgetTree"

/**
 * Widget que se encarga de consultar la data de la tabla de contenido y renderizar el arbol de capas
 * @author Rigoberto Rios rigoriosh@gmail.com
 * @param props
 * @returns Widget
 */
const Widget = (props: AllWidgetProps<any>) => {

  const [varJimuMapView, setJimuMapView] = useState<JimuMapView>() // To add the layer to the Map, a reference to the Map must be saved into the component state.
  const [dataTablaContenido, setDataTablaContenido] = useState<ItemResponseTablaContenido[]>([]) // arreglo donde se almacenara la tabla de contenido (datos planos)
  const [utilsModule, setUtilsModule] = useState<any>(null)


  /**
   * En este metodo se referencia el mapa base
   * @param jmv
   */
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
    }
  }

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
    console.log(444)
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
 * Consulta la data de la tabla de contenido desde el servicio
 * Retorna los datos planos para que buildTree en widgetTree construya el árbol jerárquico
 * @param servicios Módulo con las URLs de los servicios
 * @returns Array plano de ItemResponseTablaContenido
 */
export const getDataTablaContenido = async (servicios: { urls: { tablaContenido: string; }; }): Promise<ItemResponseTablaContenido[] | undefined> => {
  const url = servicios.urls.tablaContenido

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData: TablaDeContenidoInterface[] = await response.json()

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
    console.error('Error fetching layers:', error)
    return undefined
  }
}


