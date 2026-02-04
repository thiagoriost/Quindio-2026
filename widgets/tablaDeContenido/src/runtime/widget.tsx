import { React, type AllWidgetProps } from "jimu-core"
import { useState, useEffect } from "react"
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis' // The map object can be accessed using the JimuMapViewComponent
import '../styles/style.css'
import type { CapasTematicas, ItemResponseTablaContenido, TablaDeContenidoInterface, datosBasicosInterface, interfaceCapasNietos } from "../types/interfaces"
import Widget_Tree from "./components/widgetTree"

/**
 * Widget que se encarga de consultar la data de la tabla de contenido y renderizar el arbol de capas
 * @author Rigoberto Rios rigoriosh@gmail.com
 * @param props
 * @returns Widget
 */
const Widget = (props: AllWidgetProps<any>) => {

  const [varJimuMapView, setJimuMapView] = useState<JimuMapView>() // To add the layer to the Map, a reference to the Map must be saved into the component state.
  const [groupedLayers, setGroupedLayers] = useState<CapasTematicas[]>([]) // arreglo donde se almacenara la tabla de contenido ordenada
  const [servicios, setServicios] = useState(null)
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

  const TraerDataTablaContenido = async (modulo: typeof import("../../../api/servicios")) => {
    setTimeout(async () => {
      const tematicas = await getDataTablaContenido(modulo)
      if (utilsModule?.logger()) console.log(tematicas)
      if(!tematicas) return
      setGroupedLayers(tematicas)
    }, 3000)
  }

  /**
   * realiza la consulta de la data tabla de contenido la primera vez que se renderiza el componente
   */
  useEffect(() => {
    import('../../../api/servicios').then(modulo => {
      setServicios(modulo)
      TraerDataTablaContenido(modulo)
    })
    import('../../../utils/module').then(modulo => { setUtilsModule(modulo) })


  }, [])

  return (
    <div className="w-100 p-3 bg-primary text-white contenedorTablaContenido">
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}

      {
        varJimuMapView && <Widget_Tree dataTablaContenido={groupedLayers} setDataTablaContenido={setGroupedLayers} varJimuMapView={varJimuMapView}/>
      }

    </div>
  )
}

export default Widget

/**
   * En este meto se realiza la consulta del jeison de la tabla de contenido
   */
export const getDataTablaContenido = async (servicios: { urls: { tablaContenido: string; }; }) => {

  // const url = 'https://sigquindio.gov.co:8443/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenidoJsTree/public';
  const url = servicios.urls.tablaContenido
  let responseTablaDeContenido: TablaDeContenidoInterface[] = []
  // let responseTablaDeContenido: any[] = [];
  try {
    // const response = await fetch(url);
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    responseTablaDeContenido = await response.json()
    const tematicas = ordenarDataTablaContenido(responseTablaDeContenido)
    return tematicas
  } catch (error) {
    console.error('Error fetching layers:', error)
  }
}

/**
   * En este metodo se separa las capas padres, hijas, nietas y bisnietas.
   * @param responseTablaDeContenido
   */
const ordenarDataTablaContenido = (responseTablaDeContenido: any[] | TablaDeContenidoInterface) => {
  const tematicas:CapasTematicas[] = []
  let capasNietos: interfaceCapasNietos = { capas: [], tematicasNietas: [] }

  const addTematica = (tematicas:CapasTematicas[], datosBasicos: datosBasicosInterface, itemResponseTablaContenido: ItemResponseTablaContenido) => {
    if (!itemResponseTablaContenido.URL) {
      tematicas.push({ ...datosBasicos, capasHijas: [] })
    } else {
      tematicas.push({
        ...datosBasicos,
        capasHijas: [{ ...datosBasicos, capasNietas: itemResponseTablaContenido.NOMBRECAPA ? [itemResponseTablaContenido] : [] }],
      })
    }
  }

  /**
   * Con este for se separa las capas padre con IDTEMATICAPADRE === 0
   */
  responseTablaDeContenido.forEach((itemResponseTablaContenido: ItemResponseTablaContenido) => {
    const datosBasicos:datosBasicosInterface = {
      IDTEMATICAPADRE: itemResponseTablaContenido.IDTEMATICAPADRE,
      IDTEMATICA: itemResponseTablaContenido.IDTEMATICA,
      NOMBRETEMATICA: itemResponseTablaContenido.NOMBRETEMATICA,
      TITULOCAPA: itemResponseTablaContenido.TITULOCAPA,
    }

    if (itemResponseTablaContenido.IDTEMATICAPADRE === 0 && itemResponseTablaContenido.NOMBRETEMATICA) {
      const tematicaExistente = tematicas.find(t => t.IDTEMATICA === itemResponseTablaContenido.IDTEMATICA)
      if (!tematicaExistente) {
        addTematica(tematicas, datosBasicos, itemResponseTablaContenido)
      } else if (itemResponseTablaContenido.NOMBRECAPA) {
        tematicaExistente.capasHijas.push({ ...datosBasicos, capasNietas: [itemResponseTablaContenido] })
      }
    }
  })

  /**
   * En este for se separa las capas nietas, capasBisnietos, y las hijas se agregan directamente al padre
   */
  responseTablaDeContenido.forEach((itemResponseTablaContenido: ItemResponseTablaContenido) => {
    const datosBasicos:datosBasicosInterface = {
      IDTEMATICAPADRE: itemResponseTablaContenido.IDTEMATICAPADRE,
      IDTEMATICA: itemResponseTablaContenido.IDTEMATICA,
      NOMBRETEMATICA: itemResponseTablaContenido.NOMBRETEMATICA,
      TITULOCAPA: itemResponseTablaContenido.TITULOCAPA,
    }

    if (itemResponseTablaContenido.IDTEMATICAPADRE > 1) {
      const tematicaPadre = tematicas.find(tematica => tematica.IDTEMATICA === itemResponseTablaContenido.IDTEMATICAPADRE)
      if (tematicaPadre) {
        const capaHija = tematicaPadre.capasHijas.find((capaHija: { IDTEMATICA: number; }) => capaHija.IDTEMATICA === itemResponseTablaContenido.IDTEMATICA)
        if (!capaHija) {
          tematicaPadre.capasHijas.push({ ...datosBasicos, capasNietas: itemResponseTablaContenido.URL ? [itemResponseTablaContenido] : [] })
        } else {
          capaHija.capasNietas.push(itemResponseTablaContenido)
        }
      } else if (validaSiExisteCApaNieto(capasNietos, itemResponseTablaContenido)) {
        const tematicaNieta = capasNietos.tematicasNietas.find(tn => tn.IDTEMATICA === itemResponseTablaContenido.IDTEMATICA)
        if (tematicaNieta) {
          tematicaNieta.capasBisnietos.push(itemResponseTablaContenido)
        } else {
          capasNietos = agregarTematicaNietaNueva(capasNietos, itemResponseTablaContenido, datosBasicos)
        }
      }
    }
  })

  /**
   * En este for se asignan las capas hijas pendientes
   */
  capasNietos.tematicasNietas.forEach(itemCapaNieta => {
    tematicas.forEach(itemTematica => {
      itemTematica.capasHijas.forEach(capaHija => {
        if (itemCapaNieta.IDTEMATICAPADRE === capaHija.IDTEMATICA) {
          capaHija.capasNietas.push(itemCapaNieta)
        }
      })
    })
  })

  // setGroupedLayers(tematicas);
  return tematicas
}

/**
 * Metodo que crea un objeto nuevo de capas y tematicas nietas
 * @param capasNietos
 * @param ItemResponseTablaContenido
 * @param datosBasicos
 * @returns
 */
const agregarTematicaNietaNueva = (capasNietos, ItemResponseTablaContenido: ItemResponseTablaContenido, datosBasicos:datosBasicosInterface) => {

  //Define una nueva capa basada en ItemResponseTablaContenido.
  const nuevaCapa = {
    IDCAPA: ItemResponseTablaContenido.IDCAPA,
    IDTEMATICA: ItemResponseTablaContenido.IDTEMATICA,
  }

  //Define una nueva temática nieta basada en datosBasicos y agrega capasBisnietos.
  const nuevaTematicaNieta = {
    ...datosBasicos,
    capasBisnietos: ItemResponseTablaContenido.URL ? [ItemResponseTablaContenido] : ['']
  }

  return {
    capas: [...capasNietos.capas, nuevaCapa],
    tematicasNietas: [...capasNietos.tematicasNietas, nuevaTematicaNieta]
  }
}

/**
 * Metodo para validar si existe capa nieto
 * @param capasNietos
 * @param ItemResponseTablaContenido
 * @returns
 */
const validaSiExisteCApaNieto = (capasNietos: interfaceCapasNietos, ItemResponseTablaContenido:ItemResponseTablaContenido) => {
  return !capasNietos.capas.some(capaNieta =>
    capaNieta.IDCAPA === ItemResponseTablaContenido.IDCAPA &&
    capaNieta.IDTEMATICA === ItemResponseTablaContenido.IDTEMATICA
  )
}


