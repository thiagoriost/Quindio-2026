import type { AllWidgetProps } from 'jimu-core'
import React, { useState, useEffect } from 'react'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis' // The map object can be accessed using the JimuMapViewComponent
import '../styles/style.css'
import type { CapasTematicas, ItemResponseTablaContenido, TablaDeContenidoInterface, datosBasicosInterface, interfaceCapasNietos } from '../types/interfaces'
import WidgetTree from './components/widgetTree'
import * as projection from "@arcgis/core/geometry/projection"

interface ServiciosModule {
  //  urls: { tablaContenido: string }
  urls: { SERVICIO_TABLA_CONTENIDO: string }
}

/**
 * Widget que se encarga de consultar la data de la tabla de contenido y renderizar el arbol de capas
 * @author Rigoberto Rios rigoriosh@gmail.com
 * @param props
 * @returns Widget
 */
const Widget = (props: AllWidgetProps<any>) => {
  const [varJimuMapView, setJimuMapView] = useState<JimuMapView>() // To add the layer to the Map, a reference to the Map must be saved into the component state.
  const [groupedLayers, setGroupedLayers] = useState<CapasTematicas[]>([]) // arreglo donde se almacenara la tabla de contenido ordenada
  const [servicios, setServicios] = useState<ServiciosModule | null>(null)
  const [utilsModule, setUtilsModule] = useState<any>(null)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false) // Estado para controlar si el widget está colapsado
  const initialExtentRef = React.useRef<__esri.Extent | null>(null) // cef 20260310 Extent inicial del mapa.

  /**
   * En este metodo se referencia el mapa base
   * @param jmv
   */
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
    }
  }

  useEffect(() => {
    const traerDataTablaContenido = async (modulo: ServiciosModule) => {
      const tematicas = await getDataTablaContenido(modulo)
      await projection.load()
      setTimeout(() => {
        if (utilsModule?.logger()) console.log(tematicas)

        if (!tematicas) return
        setGroupedLayers(tematicas)
      }, 3000)
      setTimeout(() => {
        setIsCollapsed(prev => !prev)
      }, 5000)
    }

    if (servicios) {
      traerDataTablaContenido(servicios)
    }
  }, [servicios, utilsModule])


  /**
   * realiza la consulta de la data tabla de contenido la primera vez que se renderiza el componente
   */
  useEffect(() => {
    import('../../../api/serviciosQuindio').then(modulo => {
      setServicios(modulo) // Asigna el módulo importado al estado servicios
      // TraerDataTablaContenido(modulo)
    })
    import('../../../utils/module').then(modulo => { setUtilsModule(modulo) })

  }, [])

  React.useEffect(() => { // cef 20260307
    console.log("TOC layers:", groupedLayers)
  }, [groupedLayers])


  // escuchar cuando se agregan capas al mapa cef 20260307, ahora solo se agregan las capas que se añadan al grupo "Capas Temporales"
  React.useEffect(() => {

    const view = varJimuMapView?.view
    if (!view) return

    const map = view.map

    const escucharGrupo = (group) => {

      if (!group || group.type !== "group") return

      const handle = group.layers.on("after-add", (event) => {

        const layer = event.item

        if (!layer) return

        console.log("Capa temporal detectada:", layer.id)

        agregarCapaTemporal(layer)

      })

      return handle
    }

    // escuchar cuando se agregue el grupo
    const mapHandle = map.layers.on("after-add", (event) => {

      const layer = event.item

      if (layer.id === "capas-temporales") {
        escucharGrupo(layer)
      }

    })

    // si el grupo ya existe
    const grupoExistente = map.findLayerById("capas-temporales")

    let grupoHandle
    if (grupoExistente) {
      grupoHandle = escucharGrupo(grupoExistente)
    }

    return () => {
      mapHandle.remove()
      if (grupoHandle) grupoHandle.remove()
    }

  }, [varJimuMapView])

  /**
   * cef 20260310
   * Guarda el extent inicial del mapa cuando la vista
   * del mapa está disponible.
   */
  React.useEffect(() => {
    const view = varJimuMapView?.view
    if (!view) return

    if (!initialExtentRef.current) {
      initialExtentRef.current = view.extent.clone()
    }
  }, [varJimuMapView])


  // insertar capa en "Capas Temporales"

  const agregarCapaTemporal = (layer) => {

    console.log("Insertando en TOC:", layer.title)

    setGroupedLayers(prev => {

      if (!prev) return prev

      const grupo = prev.find(
        t => t.NOMBRETEMATICA === "Capas Temporales"
      )

      const nuevaCapa = {
        IDTEMATICA: Date.now(),
        IDTEMATICAPADRE: grupo?.IDTEMATICA ?? -999,
        IDCAPA: layer.id,
        TITULOCAPA: layer.title,
        URL: "temporal",
        capasHijas: [],
        capasNietas: [],
        capasBisnietos: []
      }

      // 🟢 Si no existe el grupo lo creamos
      if (!grupo) {

        const nuevoGrupo = {
          IDTEMATICA: -999,
          NOMBRETEMATICA: "Capas Temporales",
          IDTEMATICAPADRE: -1,
          IDCAPA: null,
          TITULOCAPA: "Capas Temporales",
          URL: null,
          capasHijas: [nuevaCapa],
          capasNietas: [],
          capasBisnietos: []
        }

        return [...prev, nuevoGrupo]
      }

      // evitar duplicados
      if (grupo.capasHijas?.some(c => c.IDCAPA === layer.id)) {
        return prev
      }

      return prev.map(t => {

        if (t.NOMBRETEMATICA !== "Capas Temporales") return t

        return {
          ...t,
          capasHijas: [...(t.capasHijas || []), nuevaCapa]
        }

      })

    })

  }

  // cef 20260309
  const eliminarCapaTemporal = (layerId: string) => {

    const view = varJimuMapView?.view
    if (!view) return

    const map = view.map

    const grupo = map.findLayerById("capas-temporales") as __esri.GroupLayer

    if (grupo) {

      const layer = grupo.layers.find(l => l.id === layerId)

      if (layer) {
        console.log("Eliminando capa del mapa:", layer.id)

        grupo.remove(layer)
      }

      // si el grupo queda vacío lo eliminamos del mapa
      if (grupo.layers.length === 0) {
        console.log("Eliminando grupo capas-temporales")
        map.remove(grupo)

        // cef 20260310 restaurar extent inicial
        const extent = initialExtentRef.current
        if (extent) {
          view.goTo(extent)
        }

      }
    }

    // actualizar TOC
    setGroupedLayers(prev => {

      if (!prev) return prev

      const resultado = prev
        .map(t => {

          if (t.NOMBRETEMATICA !== "Capas Temporales") return t

          const nuevasCapas = (t.capasHijas || []).filter(
            c => c.IDCAPA !== layerId
          )

          return {
            ...t,
            capasHijas: nuevasCapas
          }

        })
        // eliminar temática si queda vacía
        .filter(t => {

          if (t.NOMBRETEMATICA !== "Capas Temporales") return true

          return (t.capasHijas?.length ?? 0) > 0

        })

      return resultado

    })

  }


  return (
    <div>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}

      {
        varJimuMapView && <div className={`colapsarWidget ${isCollapsed ? 'colapsarWidget--collapsed' : ''}`}>
          <button
            className={`btn-colapsar ${isCollapsed ? 'btn-colapsar--floating' : ''}`}
            onClick={() => { setIsCollapsed(!isCollapsed) }}
            title={isCollapsed ? 'Expandir tabla de contenido' : 'Minimizar tabla de contenido'}
          >
            {isCollapsed ? '☰' : '▲'}
          </button>
          {!isCollapsed && (
            <div className="w-100 p-3 contenedorTablaContenido" style={{ backgroundColor: 'var(--sys-color-primary)', color: 'var(--sys-color-on-primary)' }}>
              <WidgetTree
                dataTablaContenido={groupedLayers}
                setDataTablaContenido={setGroupedLayers}
                eliminarCapaTemporal={eliminarCapaTemporal} //cef 20260309
                varJimuMapView={varJimuMapView} />
            </div>
          )}
        </div>
      }

    </div>
  )
}

export default Widget

/**
   * En este meto se realiza la consulta del jeison de la tabla de contenido
   */
export const getDataTablaContenido = async (servicios: { urls: { SERVICIO_TABLA_CONTENIDO: string } }) => {
  const url = servicios.urls.SERVICIO_TABLA_CONTENIDO
  let responseTablaDeContenido: TablaDeContenidoInterface[] = []
  // let responseTablaDeContenido: any[] = [];
  try {
    // const response = await fetch(url);
    console.log('url tabla de contenido', url)
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
  const tematicas: CapasTematicas[] = []
  let capasNietos: interfaceCapasNietos = { capas: [], tematicasNietas: [] }

  const addTematica = (tematicas: CapasTematicas[], datosBasicos: datosBasicosInterface, itemResponseTablaContenido: ItemResponseTablaContenido) => {
    if (!itemResponseTablaContenido.URL) {
      tematicas.push({ ...datosBasicos, capasHijas: [] })
    } else {
      tematicas.push({
        ...datosBasicos,
        capasHijas: [{ ...datosBasicos, capasNietas: itemResponseTablaContenido.NOMBRECAPA ? [itemResponseTablaContenido] : [] }]
      })
    }
  }

  /**
   * Con este for se separa las capas padre con IDTEMATICAPADRE === 0
   */
  responseTablaDeContenido.forEach((itemResponseTablaContenido: ItemResponseTablaContenido) => {
    const datosBasicos: datosBasicosInterface = {
      IDTEMATICAPADRE: itemResponseTablaContenido.IDTEMATICAPADRE,
      IDTEMATICA: itemResponseTablaContenido.IDTEMATICA,
      NOMBRETEMATICA: itemResponseTablaContenido.NOMBRETEMATICA,
      TITULOCAPA: itemResponseTablaContenido.TITULOCAPA
    }

    if (itemResponseTablaContenido.IDTEMATICAPADRE === 0 && itemResponseTablaContenido.NOMBRETEMATICA) {
      const tematicaExistente = tematicas.find(t => t.IDTEMATICA === itemResponseTablaContenido.IDTEMATICA)
      if (!tematicaExistente) {
        addTematica(tematicas, datosBasicos, itemResponseTablaContenido)
      } else if (itemResponseTablaContenido.NOMBRECAPA && tematicaExistente.capasHijas) {
        tematicaExistente.capasHijas.push({ ...datosBasicos, capasNietas: [itemResponseTablaContenido] })
      }
    }
  })

  /**
   * En este for se separa las capas nietas, capasBisnietos, y las hijas se agregan directamente al padre
   */
  responseTablaDeContenido.forEach((itemResponseTablaContenido: ItemResponseTablaContenido) => {
    const datosBasicos: datosBasicosInterface = {
      IDTEMATICAPADRE: itemResponseTablaContenido.IDTEMATICAPADRE,
      IDTEMATICA: itemResponseTablaContenido.IDTEMATICA,
      NOMBRETEMATICA: itemResponseTablaContenido.NOMBRETEMATICA,
      TITULOCAPA: itemResponseTablaContenido.TITULOCAPA
    }

    if (itemResponseTablaContenido.IDTEMATICAPADRE > 1) {
      const tematicaPadre = tematicas.find(tematica => tematica.IDTEMATICA === itemResponseTablaContenido.IDTEMATICAPADRE)
      if (tematicaPadre && tematicaPadre.capasHijas) {
        const capaHija = tematicaPadre.capasHijas.find((capaHija: { IDTEMATICA: number }) => capaHija.IDTEMATICA === itemResponseTablaContenido.IDTEMATICA)
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
      if (itemTematica.capasHijas) {
        itemTematica.capasHijas.forEach(capaHija => {
          if (itemCapaNieta.IDTEMATICAPADRE === capaHija.IDTEMATICA) {
            capaHija.capasNietas.push(itemCapaNieta)
          }
        })
      }
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
const agregarTematicaNietaNueva = (capasNietos: interfaceCapasNietos, ItemResponseTablaContenido: ItemResponseTablaContenido, datosBasicos: datosBasicosInterface) => {
  //Define una nueva capa basada en ItemResponseTablaContenido.
  const nuevaCapa = {
    IDCAPA: ItemResponseTablaContenido.IDCAPA,
    IDTEMATICA: ItemResponseTablaContenido.IDTEMATICA,
    capasNietas: []
  }

  //Define una nueva temática nieta basada en datosBasicos y agrega capasBisnietos.
  const nuevaTematicaNieta = {
    ...datosBasicos,
    capasBisnietos: ItemResponseTablaContenido.URL ? [ItemResponseTablaContenido] : []
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
const validaSiExisteCApaNieto = (capasNietos: interfaceCapasNietos, ItemResponseTablaContenido: ItemResponseTablaContenido) => {
  return !capasNietos.capas.some(capaNieta =>
    capaNieta.IDCAPA === ItemResponseTablaContenido.IDCAPA &&
    capaNieta.IDTEMATICA === ItemResponseTablaContenido.IDTEMATICA
  )
}