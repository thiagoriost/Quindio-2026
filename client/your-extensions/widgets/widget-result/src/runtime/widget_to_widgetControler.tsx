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
 * - Restaurar el extent inicial del mapa cuando se limpian resultados o se cierra el widget.
 * - Manejar limpieza automática del estado del widget.
 *
 * Los resultados se reciben desde Redux en:
 * state.widgetsState[widgetId].results
 */

import { React, jsx, AllWidgetProps, IMState, IMConfig } from 'jimu-core'
import { useSelector } from 'react-redux'
import { ResultPayload } from '../../models/result-payload.model'
import { ResultTable } from '../../components/ResultTable'
import { ResultFooter } from '../../components/ResultFooter'
import { exportService } from '../../../shared/services/export.service'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import Graphic from '@arcgis/core/Graphic'
import Polygon from '@arcgis/core/geometry/Polygon'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import { useOnWidgetClose } from '../../../shared/hooks/useOnWidgetClose';
import { appActions, getAppStore } from 'jimu-core'
import { WidgetState } from 'jimu-core'

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

    console.log('WidgetResult ID:', props.id)
    console.log('MapWidgetIds:', props.useMapWidgetIds)

    /**
     * Vista activa del mapa proporcionada por JimuMapViewComponent.
     * Permite interactuar con el MapView de ArcGIS.
     * @type {JimuMapView | null}
     */
    const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)

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

    /**
     * Página actual de la tabla de resultados.
     */
    const [page, setPage] = React.useState(1)

    /**
     * Número de registros mostrados por página.
     */
    const pageSize = 5

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

    /**
     * Guarda el extent inicial del mapa cuando la vista
     * del mapa está disponible.
     * 
     */
    React.useEffect(() => {
        const view = jimuMapView?.view
        if (!view) return

        if (!initialExtentRef.current) {
            initialExtentRef.current = view.extent.clone()
        }
    }, [jimuMapView])

    /**
     * Crea una capa gráfica utilizada para mostrar
     * la geometría de la entidad seleccionada.
     *
     * La capa se agrega al mapa al inicializarse y
     * se elimina automáticamente cuando el widget se desmonta.
     */
    React.useEffect(() => {
        const view = jimuMapView?.view
        if (!view) return

        const layer = new GraphicsLayer({
            id: 'result-selection-layer'
        })

        view.map.add(layer)
        graphicsLayerRef.current = layer

        return () => {
            view.map.remove(layer)
            layer.destroy()
            graphicsLayerRef.current = null
        }

    }, [jimuMapView])

    /**
     * Restaura el extent inicial del mapa.
     */
    const restoreInitialExtent = () => {
        const view = jimuMapView?.view
        const extent = initialExtentRef.current

        if (view && extent) {
            view.goTo(extent)
        }
    }

    /**
     * Cuando los resultados desaparecen (data = null),
     * se limpian los gráficos y se restaura el extent inicial.
     */
    React.useEffect(() => {

        if (!data) {
            graphicsLayerRef.current?.removeAll()
            restoreInitialExtent()
        }

    }, [data])

    /**
     * Reinicia la paginación cuando llegan nuevos resultados.
     */
    React.useEffect(() => {
        if (data) setPage(1)
    }, [data])

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

        getAppStore().dispatch(
            appActions.widgetStatePropChange(
                props.id,
                'results',
                null
            )
        )

        if (initialExtentRef.current && jimuMapView) {

            jimuMapView.view.goTo(
                initialExtentRef.current
            )

        }

        setPage(1)

    }

    /**
     * Hook que detecta el cierre del widget
     * y ejecuta la función de limpieza.
     */
    useOnWidgetClose(props.id, onClose)



    if (!data) return null

    console.log('Resultados recibidos en WidgetResult:', data)
    console.log(data.features)

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
        const fileName = `${data.title.replace(/\s+/g, '_')}_${today}.csv`

        exportService.exportCSV(features, fileName, fields)
    }

    /**
     * Maneja la selección de una entidad desde la tabla.
     *
     * @param feature Entidad seleccionada.
     */
    const handleSelectFeature = async (feature: any) => {

        if (!jimuMapView || !graphicsLayerRef.current) return

        if (!feature?.geometry) return

        const view = jimuMapView.view

        graphicsLayerRef.current.removeAll()


        const geometry = new Polygon({
            rings: feature.geometry.rings,
            spatialReference: data.spatialReference || view.spatialReference
        })

        const graphic = new Graphic({
            geometry,
            symbol: {
                type: 'simple-fill',
                color: [255, 0, 0, 0.2],
                outline: {
                    color: [255, 0, 0],
                    width: 2
                }
            },
            attributes: feature.attributes
        })

        graphicsLayerRef.current.add(graphic)

        await view.goTo({
            target: graphic.geometry.extent.expand(2)
        })
    }

    /**
     * Validación de mapa configurado en el widget.
     */
    if (!props.useMapWidgetIds?.length) {
        return (
            <div style={{ padding: 16 }}>
                Debe seleccionar un Map Widget en la configuración.
            </div>
        )
    }


    return (
        <div style={{ padding: 16 }}>

            {/* Componente de acceso al MapView */}
            <div style={{ position: 'absolute', width: 0, height: 0 }}>
                <JimuMapViewComponent
                    useMapWidgetId={props.useMapWidgetIds?.[0]}
                    onActiveViewChange={setJimuMapView}
                />
            </div>

            <ResultTable
                features={pagedFeatures}
                fields={data.fields}
                onExport={handleExport}
                onSelectFeature={handleSelectFeature}
            />

            <ResultFooter
                total={total}
                page={page}
                totalPages={totalPages}
                onPrev={() =>
                    setPage(prev => Math.max(1, prev - 1))
                }
                onNext={() =>
                    setPage(prev => Math.min(totalPages, prev + 1))
                }
            />

        </div>
    )
}