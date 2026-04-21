/** @jsx jsx */

/**
 * @module WidgetResult
 * @description
 * Widget de ArcGIS Experience Builder encargado de mostrar resultados de consultas
 * enviadas por otros widgets del visor SIG.
 *
 * Funcionalidades principales:
 * - Mostrar resultados en una tabla paginada.
 * - Exportar resultados a CSV.
 * - Seleccionar una entidad y visualizar su geometría en el mapa.
 * - Resolver y validar referencias espaciales antes de dibujar o navegar.
 * - Restaurar el extent inicial del mapa cuando se limpian resultados o se cierra el widget.
 * - Gestionar capas temporales de predios para resultados marcados como temporales.
 * - Manejar limpieza automática del estado del widget.
 *
 * Los resultados se reciben desde Redux en:
 * state.widgetsState[widgetId].results
 */

import { Button } from 'jimu-ui'
import { React, AllWidgetProps, IMState, IMConfig } from 'jimu-core'
import { useSelector } from 'react-redux'
import { ResultPayload } from '../../models/result-payload.model'
import { ResultTable } from '../../components/ResultTable'
import { ResultFooter } from '../../components/ResultFooter'
import { exportService } from '../../../shared/services/export.service'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import Graphic from '@arcgis/core/Graphic'
import Polygon from '@arcgis/core/geometry/Polygon'
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import { useOnWidgetClose } from '../../../shared/hooks/useOnWidgetClose';
import { appActions, getAppStore } from 'jimu-core'
import { WidgetState } from 'jimu-core'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import GroupLayer from '@arcgis/core/layers/GroupLayer'
import '../styles/widgetResultFloating.css'

// cef 20260313
import ResultGraphic from "../../components/ResultGraphic_Richarts";
import { validaLoggerLocalStorage } from '../../../shared/utils/export.utils'
import { useDibujarCoropletico } from '../../../shared/hooks/useDibujarCoropletico'

/**
 * WidgetResult
 *
 * Componente principal del widget encargado de:
 * - Renderizar la tabla de resultados
 * - Administrar paginación
 * - Manejar selección de entidades
 * - Dibujar geometrías en el mapa
 * - Exportar resultados
 *
 * @param {AllWidgetProps<IMConfig>} props Propiedades estándar de Experience Builder.
 * @returns {JSX.Element | null}
 */
export default function Widget(props: AllWidgetProps<IMConfig>) {

    

    /**
     * Resultados obtenidos desde Redux.
     *
     * Contiene:
     * - features
     * - fields
     * - title
     * - spatialReference
     *
     * @type {ResultPayload | null}
     */
    const data: ResultPayload | null = useSelector(
        (state: IMState) =>
            state.widgetsState?.[props.id]?.results ?? null
    )

    // Estado para mostrar/ocultar el panel flotante
    const [open, setOpen] = React.useState(true)    

    // Estado para la posición del panel (drag)
    const [panelPos, setPanelPos] = React.useState<{ x: number; y: number } | null>(null)
    const draggingRef = React.useRef(false)
    const dragOffsetRef = React.useRef({ x: 0, y: 0 })

    /**
     * Vista activa del mapa proporcionada por JimuMapViewComponent.
     * Permite interactuar con el MapView de ArcGIS.
     * @type {JimuMapView | null}
     */
    const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)

    const [isMultiChart, setIsMultiChart] = React.useState(false) // bandera para saber si la gráfica de barras es múltiple por indicador, se setea al recibir los datos

    const [currentIndex, setCurrentIndex] = React.useState(0) // índice para manejar navegación entre gráficos en caso de ser múltiples por indicador

    const [itemGraphicDataSelected, setItemGraphicDataSelected] = React.useState(0) // para manejar el item seleccionado en la gráfica y pasarlo al componente de gráfica para que lo resalte, se asume que el item seleccionado es un objeto con la información del gráfico, por ejemplo {name: "ESTUDIANTESMATRICULADOS", value: 100} para el caso de cobertura educativa, y que el campo "name" corresponde al fieldToFilter que se usa para dibujar el coroplético en el mapa


    /**
         * Inicia el arrastre del panel al hacer mousedown sobre el header.
         */
    const onDragStart = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.widget-result-close-btn')) return
        e.preventDefault()
        draggingRef.current = true
        const panel = (e.currentTarget as HTMLElement).parentElement
        const rect = panel.getBoundingClientRect()
        dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }

        const onMouseMove = (ev: MouseEvent) => {
            if (!draggingRef.current) return
            const newX = Math.max(0, Math.min(ev.clientX - dragOffsetRef.current.x, window.innerWidth - rect.width))
            const newY = Math.max(0, Math.min(ev.clientY - dragOffsetRef.current.y, window.innerHeight - rect.height))
            setPanelPos({ x: newX, y: newY })
        }

        const onMouseUp = () => {
            draggingRef.current = false
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    }

    
    
    // estado de la vista para grafico y/o tabla 
    const [viewMode, setViewMode] = React.useState<'tabla' | 'grafico'>(
        data?.withGraphic?.showGraphic ? 'grafico' : 'tabla'
    )

    const [fieldToFilter, setFieldToFilter] = React.useState<string>("") // para manejar el campo que se va a mostrar en el gráfico cuando hay gráfica
    const [overrideGraphicData, setOverrideGraphicData] = React.useState<any[] | null>(null) // datos de gráfica recalculados al cambiar indicador
    const [overrideGraphicTitle, setOverrideGraphicTitle] = React.useState<string | null>(null) // título de gráfica recalculado al cambiar indicador


    /**
     * Referencia a la capa gráfica utilizada para resaltar
     * la entidad seleccionada en el mapa.
     */
    const graphicsLayerRef = React.useRef<GraphicsLayer | null>(null)

    /**
     * Extent inicial del mapa.
     * Se guarda al cargar el widget para poder restaurar
     * la vista original posteriormente.
     */
    const initialExtentRef = React.useRef<__esri.Extent | null>(null)

    /**
     * Estado de ejecución del widget dentro del runtime de Experience Builder.
     */
    const widgetState = useSelector(
        (state: IMState) => state.widgetsRuntimeInfo?.[props.id]?.state
    )
    if(validaLoggerLocalStorage('logger')) console.log('WidgetResult ID:', {id:props.id, props})
    if(validaLoggerLocalStorage('logger')) console.log('MapWidgetIds:', props.useMapWidgetIds)
    if(validaLoggerLocalStorage('logger')) console.log({widgetState})        

    /**
     * Página actual de la tabla de resultados.
     */
    const [page, setPage] = React.useState(1)

    /**
     * Número de registros mostrados por página.
     */
    const pageSize = 5

   
    /**
     * estado para el gráfico //cef 20260313
     */
    // const [chartData, setChartData] = React.useState<any[]>([])


    /**
     * Bandera para recordar si la última consulta fue temporal antes de que data pase a null.
     * Evita restaurar extent cuando la visualización corresponde a una capa temporal persistente.
     */
    const temporalLayerRef = React.useRef<boolean>(false)


    /**
     * Hook que dibuja/limpia automáticamente el coroplético en el mapa
     * cuando cambian features, jimuMapView, fieldToFilter o la leyenda.
     */
    const activeField = fieldToFilter || data?.withGraphic?.fieldToFilter
    useDibujarCoropletico({
        props: data?.withGraphic ? props : undefined, // solo pasar props al hook si se va a mostrar gráfico, para evitar cálculos innecesarios
        features: data?.features,
        jimuMapView,
        coroplethConfig: activeField && data?.withGraphic?.dataCoropletico?.leyenda
            ? { field: activeField, leyenda: data.withGraphic.dataCoropletico.leyenda, titleCoropletico: data.withGraphic.titleCoropletico }
            : undefined,
        enabled: !!data?.isCoropletico
    })

    /**
     * Guarda el extent inicial del mapa cuando la vista
     * del mapa está disponible.
     * 
     */
    React.useEffect(() => {
        const view = jimuMapView?.view
        if (!view) return

    if (!initialExtentRef.current) {
      initialExtentRef.current = view.extent.clone();
    }

    const layer = new GraphicsLayer({
      id: "result-selection-layer",
    });
    view.map.add(layer);
    graphicsLayerRef.current = layer;

    return () => {
        console.log("closed widget result")
      view.map.remove(layer);
      layer.destroy();
      graphicsLayerRef.current = null;
    };
    }, [jimuMapView]);

    /**
     * Reinicia la paginación cuando llegan nuevos resultados.
     */
    React.useEffect(() => {
         if (!data) return
        if (data){
            temporalLayerRef.current = data.temporalLayer === true //Guarda el valor de temporalLayer cuando llegan los datos
            const { features } = data
            if (!features?.length) return
            if(validaLoggerLocalStorage('logger')) console.log("Resultados recibidos en WidgetResult:", {features, data})
                
            /* 
            bandera para saber si la grafica de barra es multiple por indicador
            */
            if(!isMultiChart){
                setIsMultiChart(data.withGraphic?.barKeys && data.withGraphic.barKeys.length > 1)
            }

            setOpen(true)
            setPage(1)
            setFieldToFilter(data.withGraphic ? data.withGraphic.fieldToFilter : "")
            setOverrideGraphicData(null)
            setOverrideGraphicTitle(null)
            // El hook useDibujarCoropletico se encarga de dibujar automáticamente
            setViewMode(data.withGraphic?.showGraphic ? 'grafico' : 'tabla')
        }
    }, [data])

    /**
     * Valida si un objeto de referencia espacial tiene información utilizable por ArcGIS JS API.
     * Se considera válida cuando trae wkid, latestWkid o wkt.
     */
    const isValidSpatialReference = (spatialReference: any): spatialReference is __esri.SpatialReference => {
      if (!spatialReference || typeof spatialReference !== 'object') return false

      return Number.isFinite(spatialReference.wkid)
        || Number.isFinite(spatialReference.latestWkid)
        || typeof spatialReference.wkt === 'string'
    }

    /**
     * Aplica un efecto de parpadeo temporal al renderer de una FeatureLayer.
     * Se usa para resaltar una capa temporal existente cuando vuelve a ser seleccionada.
     */
    const flashLayer = (layer: __esri.FeatureLayer) => {

        const originalRenderer = layer.renderer

        const flashRenderer = {
            type: "simple",
            symbol: {
                type: "simple-fill",
                color: [255, 255, 0, 0.6],
                outline: {
                    color: [255, 255, 0],
                    width: 3
                }
            }
        }

        layer.renderer = flashRenderer as any

        setTimeout(() => {
            layer.renderer = originalRenderer
        }, 400)
    }

    /**
     * Resuelve la referencia espacial para una geometría priorizando:
     * 1) geometry.spatialReference válida,
     * 2) data.spatialReference válida,
     * 3) spatialReference fallback de la vista.
     */
    const resolveSpatialReference = (geometry: any, fallback: __esri.SpatialReference) => {
      if (isValidSpatialReference(geometry?.spatialReference)) {
        return geometry.spatialReference
      }

      if (isValidSpatialReference(data?.spatialReference)) {
        return data.spatialReference
      }

      return fallback
    }

    /**
     * Construye una geometría de ArcGIS (Polygon, Point o Polyline)
     * a partir de un objeto crudo proveniente de resultados.
     */
    const buildGeometry = (geometry: any, fallbackSpatialReference: __esri.SpatialReference) => {
      if (!geometry) return null

      const geometryType = geometry.type
        || (geometry.rings ? 'polygon' : null)
        || (geometry.paths ? 'polyline' : null)
        || (geometry.x != null && geometry.y != null ? 'point' : null)

      if (!geometryType) return null

      const spatialReference = resolveSpatialReference(geometry, fallbackSpatialReference)

      if (geometryType === 'polygon' && geometry.rings) {
        return new Polygon({
          rings: geometry.rings,
          spatialReference
        })
      }

      if (geometryType === 'point' && geometry.x != null && geometry.y != null) {
        return new Point({
          x: geometry.x,
          y: geometry.y,
          spatialReference
        })
      }

      if (geometryType === 'polyline' && geometry.paths) {
        return new Polyline({
          paths: geometry.paths,
          spatialReference
        })
      }

      return null
    }

    /**
     * Define el target para view.goTo:
     * - Si existe extent, se usa expandido para un mejor encuadre.
     * - En caso contrario, se usa la geometría directa.
     */
    const getGoToTarget = (geometry: __esri.Geometry) => {
      if ('extent' in geometry && geometry.extent) {
        return geometry.extent.expand(2)
      }

      return geometry
    }
    /**
     * Crea una capa temporal tipo {@link __esri.FeatureLayer} a partir de un feature
     * y la agrega al mapa dentro de un {@link __esri.GroupLayer} llamado "capas-temporales".
     * 
     * Si la capa ya existe (basado en un id generado), no la vuelve a crear:
     * - Hace zoom a la geometría existente
     * - Ejecuta un efecto visual (`flashLayer`)
     * 
     * Si no existe:
     * - Construye la geometría tipo {@link __esri.Polygon}
     * - Crea un {@link __esri.Graphic}
     * - Crea una nueva capa con simbología simple
     * - La agrega a un grupo de capas temporales (lo crea si no existe)
     * - Hace zoom al extent de la geometría
     * 
     * @async
     * @function crearCapaTemporal
     * 
     * @param {any} featureData - Objeto que contiene la información del feature.
     * @param {Object} featureData.geometry - Geometría del feature.
     * @param {number[][][]} featureData.geometry.rings - Coordenadas del polígono.
     * @param {Object} featureData.attributes - Atributos asociados al feature.
     * @param {number} [featureData.attributes.OBJECTID] - Identificador del feature (opcional).
     * 
     * @returns {Promise<void>} No retorna valor. Realiza efectos sobre el mapa.
     * 
     * @remarks
     * - El identificador de la capa se construye usando:
     *   1. `data.valorBusqueda` (si existe)
     *   2. `featureData.attributes.OBJECTID`
     *   3. `Date.now()` como fallback
     * 
     * - Esto evita duplicidad de capas cuando el feature no tiene OBJECTID.
     * 
     * - La capa se renderiza con un estilo simple:
     *   - Relleno rojo semi-transparente
     *   - Borde rojo
     * 
     * - La navegación (`view.goTo`) se asegura de enfocar correctamente la geometría,
     *   incluso si el usuario ha movido el mapa previamente.
     * 
     * @throws {Error} No lanza errores explícitos, pero depende de:
     * - `jimuMapView.view` disponible
     * - Clases de ArcGIS API (`Polygon`, `Graphic`, `FeatureLayer`, `GroupLayer`)
     * 
     * @example
     * ```ts
     * await crearCapaTemporal(featureSeleccionado)
     * ```
   */
    const crearCapaTemporal = async (featureData: any) => {
    const view = jimuMapView?.view;
    if (!view) return;

    const map = view.map;

    const objectId =
      data?.valorBusqueda || featureData.attributes?.OBJECTID || Date.now(); // cef 20260308, usar valorBusqueda como parte del id de la capa para evitar problemas si el feature no tiene OBJECTID. Si no hay valorBusqueda, usar timestamp.
    const layerId = `temp_predio_${objectId}`;

    const existingLayer = map.findLayerById(layerId) as __esri.FeatureLayer;

        if (existingLayer) {

            const graphic = existingLayer.source.getItemAt(0) as __esri.Graphic

            if (graphic?.geometry) {
                await view.goTo({
                    target: graphic.geometry // va directamente a la geometría del gráfico para asegurar el zoom correcto aunque el usuario haya movido la vista después de crear la capa
                })
            }

            flashLayer(existingLayer)

            return
        }

        const geometry = new Polygon({
          rings: featureData.geometry.rings,
          spatialReference: resolveSpatialReference(featureData.geometry, view.spatialReference)
        })

        const graphic = new Graphic({
            geometry,
            attributes: {
                ...featureData.attributes,
                OBJECTID: objectId
            }
        })

        const layer = new FeatureLayer({
            id: layerId,
            title: `Predio ${objectId}`,
            source: [graphic],
            objectIdField: "OBJECTID",
            fields: [
                {
                    name: "OBJECTID",
                    alias: "OBJECTID",
                    type: "oid"
                }
            ],
            geometryType: "polygon",
            spatialReference: geometry.spatialReference,
            renderer: {
                type: "simple",
                symbol: {
                    type: "simple-fill",
                    color: [255, 0, 0, 0.2],
                    outline: {
                        color: [255, 0, 0],
                        width: 2
                    }
                }
            },
            listMode: "show"
        })

        let tempGroup = map.findLayerById("capas-temporales") as __esri.GroupLayer

        if (!tempGroup) {

            tempGroup = new GroupLayer({
                id: "capas-temporales",
                title: "Capas Temporales",
                visibilityMode: "independent",
                listMode: "show"
            })

            map.add(tempGroup)
        }

        tempGroup.add(layer)

        await view.goTo({
            target: geometry.extent.expand(2)
        })
    }


    /**
     * Evita que el widget permanezca abierto si no hay resultados.
     */
    React.useEffect(() => {
        if (widgetState === WidgetState.Opened && !data) {
            getAppStore().dispatch(
                appActions.closeWidget(props.id)
            )
        }
    }, [widgetState, data])


    /**
     * Acción ejecutada cuando el widget se cierra.
     *
     * Operaciones:
     * - Limpia gráficos del mapa
     * - Limpia resultados en Redux
     * - Restaura extent inicial
     * - Reinicia paginación
     */
    const onClose = () => {

        graphicsLayerRef.current?.removeAll()
        // Los gráficos coroplético se limpian automáticamente por el hook useDibujarCoropletico
        getAppStore().dispatch(
            appActions.widgetStatePropChange(
                props.id,
                'results',
                null
            )
        )
        setPage(1)
        setFieldToFilter("")
        setOverrideGraphicData(null)
        setOverrideGraphicTitle(null)
        setViewMode('tabla')
        setOpen(false)
        // restoreInitialExtent(jimuMapView, initialExtentRef)
    }

    /**
     * Hook que detecta el cierre del widget
     * y ejecuta la función de limpieza.
     */
    useOnWidgetClose(props.id, jimuMapView, initialExtentRef, onClose)



    if (!data) return null

    if(validaLoggerLocalStorage('logger')) console.log('Resultados recibidos en WidgetResult:', data)
    if(validaLoggerLocalStorage('logger')) console.log(data.features)

    const total = data.features.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pagedFeatures = data.features.slice(start, end)

    /**
     * Exporta los resultados a un archivo CSV.
     */
    const handleExport = () => {

        const features = data.features as __esri.Graphic[]
        const fields = data.fields?.map(f => f.name)

        const today = new Date().toISOString().slice(0, 10)
        const fileName = `${data.title?.replace(/\s+/g, '_')}_${today}.csv`

        exportService.exportCSV(features, fileName, fields)
    }

    /**
     * Maneja la selección de una entidad desde la tabla.
     *
     * @param feature Entidad seleccionada.
     */
    //  const handleSelectFeature = (feature: __esri.Graphic) => {
    const handleSelectFeature = async (feature: any) => {
        if(validaLoggerLocalStorage('logger')) console.log('feature seleccionada:', feature)

        if (data?.temporalLayer) {
            await crearCapaTemporal(feature)
            return
        }

        if (!jimuMapView || !graphicsLayerRef.current) {
            console.error('Sin vinculación al mapa, revise!')
            return
        }

        if (!feature?.geometry) return

        const view = jimuMapView.view

        graphicsLayerRef.current.removeAll()

        const geometry = buildGeometry(feature.geometry, view.spatialReference)

        if (!geometry) {
            console.warn('No fue posible construir una geometría válida para la selección:', feature.geometry)
            return
        }


        const graphic = new Graphic({   // 20260313
            geometry,
            symbol: getSymbolByGeometry(geometry),
            attributes: feature.attributes
        })


        graphicsLayerRef.current.add(graphic)

        if (geometry.type === "point") {  // cef 20260313
            const zoomLevel = 20
            await view.goTo({
                target: geometry,
                zoom: zoomLevel
            })

        } else {

            await view.goTo({
                target: geometry.extent?.expand(2) ?? geometry
            })

        }
    }

    const getSymbolByGeometry = ( // 20260313
        geometry: __esri.Geometry
    ): __esri.GraphicProperties["symbol"] => {

        if(validaLoggerLocalStorage('logger')) console.log('getSymbolByGeometry:', geometry.type)
        if (geometry.type === "polygon") {
            return {
                type: "simple-fill",
                color: [255, 0, 0, 0.2],
                outline: {
                    type: "simple-line",
                    color: [255, 0, 0],
                    width: 2
                }
            }
        }

        if (geometry.type === "polyline") {
            return {
                type: "simple-line",
                color: [255, 0, 0],
                width: 3
            }
        }
        /**
         * Retorna un símbolo gráfico según el tipo de geometría.
         * 
         * @param {__esri.Geometry} geometry - Geometría de ArcGIS (point, polyline o polygon).
         * @returns {__esri.GraphicProperties["symbol"]} Símbolo correspondiente para renderizar la geometría.
         * 
         * @throws {Error} Si el tipo de geometría no es soportado.
         * 
         * @example
         * const symbol = getSymbolByGeometry(graphic.geometry)
         */
        if (geometry.type === "point" || geometry.type === "multipoint") {
            return {
                type: "simple-marker",
                style: "circle",
                color: [255, 0, 0],
                size: 10,
                outline: {
                    type: "simple-line",
                    color: [255, 255, 255],
                    width: 1
                }
            }
        }

        throw new Error("Tipo de geometría no soportado")
    }
  
    /**
     * Validación de mapa configurado en el widget. cef 20250325
     */

    const hasFeatures = data?.features && data.features.length > 0

    // RRH 20260331 ancho dinámico del panel según cantidad de barras en gráfico
    const getPanelWidth = (): string | undefined => {
        if (viewMode === 'grafico' && data?.withGraphic?.graphicData) {
            const barCount = data.withGraphic.graphicData.length
            const barWidth = 50 // px por barra
            const axisAndPadding = 100 // eje Y + márgenes
            const calculated = barCount * barWidth + axisAndPadding
            if(validaLoggerLocalStorage('logger')) console.log({barCount, barWidth, axisAndPadding, calculated})
            return `${Math.max(320, Math.min(calculated, window.innerWidth * 0.9)) >= 300 ? 300 : Math.max(320, Math.min(calculated, window.innerWidth * 0.9))}px`
        }
        return undefined // usa el ancho por defecto del CSS para modo tabla
    }

    const renderizarSiguienteCropleticoYgrafica = () => {
        // lógica para cambiar el indicador seleccionado y actualizar la gráfica en consecuencia
        if (!data?.withGraphic) return
        if (isMultiChart) {
            const currentDataGraphic = data.withGraphic.graphicData[itemGraphicDataSelected]
            const nextIndex = currentIndex === 0 ? 1 : 0 // solo hay dos gráficos por indicador, entonces se alterna entre 0 y 1            
            setCurrentIndex(nextIndex)
            const nextDataGraphic = [
                {
                    name: currentDataGraphic.name,
                    rural: currentDataGraphic.dataToRenderGraphics[nextIndex].rural,
                    urbano: currentDataGraphic.dataToRenderGraphics[nextIndex].urbano
                }
            ]
            setOverrideGraphicData(nextDataGraphic)
            setOverrideGraphicTitle(currentDataGraphic.dataToRenderGraphics[nextIndex].titleLeyendX)
            if(validaLoggerLocalStorage('logger')) console.log("Gráfica de barras múltiples, cambiando a siguiente indicador", {currentDataGraphic, itemGraphicDataSelected, nextIndex, nextDataGraphic})
        }else{
            const currentIndicador = fieldToFilter !== "" ? fieldToFilter : data.withGraphic.fieldToFilter
            const fieldsToFilter = data.withGraphic.dataCoropletico.fieldsToFilter
            const currentIndex = fieldsToFilter.findIndex(e=>e.field === currentIndicador)
            const nextIndex = (currentIndex + 1) % fieldsToFilter.length
            const nextField = fieldsToFilter[nextIndex].field
            // Al actualizar fieldToFilter, el hook useDibujarCoropletico redibuja automáticamente
            setFieldToFilter(nextField)
            if(validaLoggerLocalStorage('logger')) console.log({data, currentIndicador, currentIndex, nextIndex, nextField})
    
            // Recalcular graphicData con el nuevo campo, reutilizando los nombres originales
            const originalGraphicData = data.withGraphic.graphicData
            const newGraphicData = originalGraphicData.map((item, i) => ({
                name: item.name,
                value: Number(data.features[i]?.attributes?.[nextField]) || 0
            }))
            setOverrideGraphicData(newGraphicData)
    
            // Actualizar título con la etiqueta del campo seleccionado
            const nextFieldInfo = `Total de estudiantes ${fieldsToFilter[nextIndex].label || nextField} en el año ${data.valorBusqueda || ''}`
            setOverrideGraphicTitle(nextFieldInfo)
        }
    }
    
    return (
        <div>

            {/* Componente de acceso al MapView cef 20250325 */}
            <div style={{ position: 'absolute', width: 0, height: 0 }}>
                <JimuMapViewComponent
                    useMapWidgetId={props.useMapWidgetIds?.[0]}
                    onActiveViewChange={setJimuMapView}
                />
            </div>

            {!open && (
                <button className="widget-result-floating-btn" onClick={() => setOpen(true)} title="Mostrar resultados">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* SVG tabla */}
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="6" width="20" height="16" rx="2" fill="var(--color-primary-light)" stroke="var(--color-primary-light)" strokeWidth="2" />
                            <line x1="4" y1="11" x2="24" y2="11" stroke="var(--color-primary)" strokeWidth="1.5" />
                            <line x1="4" y1="16" x2="24" y2="16" stroke="var(--color-primary)" strokeWidth="1.5" />
                            <line x1="11" y1="6" x2="11" y2="22" stroke="var(--color-primary)" strokeWidth="1.5" />
                            <line x1="18" y1="6" x2="18" y2="22" stroke="var(--color-primary)" strokeWidth="1.5" />
                        </svg>
                    </span>
                </button>
            )}
            {open && (
                <div
                    className={`widget-result-floating-panel${viewMode === 'grafico' && data?.withGraphic?.showGraphic ? ' widget-result-panel--graphic' : ''}`}
                    style={panelPos ? { left: panelPos.x, top: panelPos.y, right: 'auto', bottom: 'auto' } : undefined}
                >
                    <div className="widget-result-header" onMouseDown={onDragStart}>
                        {data.title}
                        <button className="widget-result-close-btn" onClick={() => setOpen(false)} title="Cerrar">-</button>
                    </div>
                    <div className="widget-result-content">

                        {/* BOTONES */}
                        {/* Barra superior */}
                        <div className="widget-result-toolbar-bar">
                            {data?.withGraphic?.showGraphic && (
                                <Button
                                    size="sm"
                                    type="primary"
                                    onClick={() => {
                                        setViewMode?.(viewMode === "tabla" ? "grafico" : "tabla")
                                    }}
                                    >
                                    {viewMode === "tabla" ? "Ver Gráfico" : "Ver Tabla"}
                                </Button>
                            )}
                            {/* Botones de siguiente y atras para visualización de diferentes graficas para la misma consulta */}
                            {
                                ((data.withGraphic.selectedIndicador === 3 || isMultiChart) && viewMode === 'grafico') && (
                                    <Button size="sm" type="primary" className="widget-result-export-btn" onClick={renderizarSiguienteCropleticoYgrafica}> Siguiente </Button>
                                )
                            }
                            { viewMode === 'tabla' &&
                            (<Button size="sm" type="primary" className="widget-result-export-btn" onClick={handleExport}>
                                Exportar tabla
                            </Button>)}
                        </div>
                        {/*  ÁREA ÚNICA COMPARTIDA */}
                        <div className="widget-result-view">
                            {viewMode === 'grafico' && data?.withGraphic?.showGraphic ? (
                                <ResultGraphic
                                    data={overrideGraphicData ?? data.withGraphic.graphicData}
                                    type={data.withGraphic.graphicType}
                                    barKeys={data.withGraphic.barKeys}
                                    title={overrideGraphicTitle ?? data.withGraphic.graphicTitle ?? 'Sin título'}
                                />
                            ) : (
                            <ResultTable
                                features={pagedFeatures}
                                fields={data.fields}
                                onExport={handleExport}
                                onSelectFeature={handleSelectFeature}
                                total={total}
                                page={page}
                                totalPages={totalPages}
                                setPage={setPage}
                                data={data} //  para mostrar botón de toggle si viene withGraphic
                                setViewMode={setViewMode} //  para toggle tabla/gráfico
                                />
                            )}

                        </div>
                        {/* FOOTER */}
                        {(total > 4 && viewMode === 'tabla') && (                            
                        <ResultFooter
                            total={total}
                            page={page}
                            totalPages={totalPages}
                            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
                            onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        />
                        )}
                    </div>
                </div>
      )}
    </div>
  );
}

/**
 * Publica resultados en el estado del WidgetResult y lo abre en el layout.
 *
 * @param features Entidades a mostrar en la tabla.
 * @param fields Definición de campos para la tabla/exportación.
 * @param props Props del widget emisor para registrar sourceWidgetId.
 * @param spatialReference Referencia espacial asociada a los resultados.
 * @param widgetResultId Id del widget-result en el layout.
 */
export const abrirTablaResultados = (
  isCoropletico: boolean,
  features: any[],
  fields: any[],
  props: any,
  widgetResultId: string,
  spatialReference?: any,
  titleTable?: string,
  withGraphic?:{
    showGraphic: boolean,
    titleCoropletico?: string, // título específico para el caso de coroplético, si se quiere mostrar uno diferente al título general
    graphicData?: any,
    graphicType?: string//"bar" | "pie",
    graphicTitle?: string,
    selectedIndicador?: number, // para manejar diferentes indicadores que pueden venir con la gráficafeaturesDibujados?: any[] // para manejar casos como el indicador 3 donde se dibujan características en el mapa además de mostrar la gráfica
  },
  temporalLayer?: boolean,
  valorBusqueda?: string
) => {
  getAppStore().dispatch(
    appActions.widgetStatePropChange(
      widgetResultId, // id del WidgetResult en el layout desde el widget controller
      "results", // nombre de la propiedad que se va a actualizar en el estado del widget
      {
        props, // para tomar el id del widget que envía los datos (este widget)
        title: titleTable !== '' ? titleTable : `Resultados ${valorBusqueda ?? ""}`, // título que se mostrará en el widget de resultados
        features: features, // datos de las características a mostrar
        fields: fields, // campos a mostrar en la tabla de resultados
        spatialReference: spatialReference, // referencia espacial de los datos
        withGraphic, // información del gráfico asociado
        temporalLayer, // indica si los resultados corresponden a una capa temporal
        valorBusqueda, // valor de búsqueda asociado a los resultados, útil para identificar capas temporales por consulta
        isCoropletico
      },
    ),
  );
  getAppStore().dispatch(appActions.openWidget(widgetResultId));
};

/**
 * Limpia el estado de resultados del widget y ejecuta su cierre.
 *
 * @param widgetResultId Id del widget-result en el layout.
 */
export const limpiarYCerrarWidgetResultados = (widgetResultId: string) => {
  // Limpia la data enviada al widget de resultados
  getAppStore().dispatch(
    appActions.widgetStatePropChange(widgetResultId, "results", null),
  );
  // Cierra el widget de resultados
  getAppStore().dispatch(appActions.closeWidget(widgetResultId));
};