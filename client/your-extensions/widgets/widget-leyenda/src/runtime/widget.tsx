/** @jsx jsx */

/**
 * @module widget-leyenda
 * @description
 * Widget de ArcGIS Experience Builder encargado de mostrar la leyenda del mapa coropletico
 * enviadas por otros widgets del visor SIG.
 *
 * Funcionalidades principales:
 * - 
 *
 * Los resultados se reciben desde Redux en:
 * state.widgetsState[widgetId].results
 */

import { Button } from 'jimu-ui'
import { React, jsx, AllWidgetProps, IMState, IMConfig } from 'jimu-core'
import { useSelector } from 'react-redux'
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
import '../styles/widget_Leyenda_Floating.css'

/**
 * widget-leyenda
 *
 * Componente principal del widget encargado de:
 * - 
 *
 * @param {AllWidgetProps<IMConfig>} props Propiedades estándar de Experience Builder.
 * @returns {JSX.Element | null}
 */
export default function Widget(props: AllWidgetProps<IMConfig>) {
    // Estado para mostrar/ocultar el panel flotante
    const [open, setOpen] = React.useState(true)

    console.log('widget-leyenda ID:', props.id)
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
     * Resultados obtenidos desde Redux.
     *
     * Contiene:
     * - 
     *
     * @type {ResultPayload | null}
     */
    const data: any | null = useSelector(
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
      initialExtentRef.current = view.extent.clone();
    }

    }, [jimuMapView]);

    
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
            console.log(1111)
            graphicsLayerRef.current?.removeAll()
            
                restoreInitialExtent()
            
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
    * Efecto que se ejecuta cuando cambian los datos de resultados (`data`).
    */
    React.useEffect(() => { // cef 20260307

        if (!data) return

        const { features } = data

        if (!features?.length) return

        console.log("Resultados recibidos en widget-leyenda:", features)
        setOpen(true)

    }, [data])


    /**
     * Evita que el widget permanezca abierto si no hay resultados.
     */
    React.useEffect(() => {
        console.log(2222)
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
        
    }

    /**
     * Hook que detecta el cierre del widget
     * y ejecuta la función de limpieza.
     */
    useOnWidgetClose(props.id, onClose)



    // if (!data) return null

    console.log('Resultados recibidos en widget-leyenda:', data)
    console.log({data})
    if (!data) return

    const legendItems: Array<{ label: string; colorFondo: string; colorLine: string }> = data?.data ?? []

    return (
        <div>            
            {/* Componente de acceso al MapView cef 20250325 */}
            <div style={{ position: 'absolute', width: 0, height: 0 }}>
                <JimuMapViewComponent
                    useMapWidgetId={props.useMapWidgetIds?.[0]}
                    onActiveViewChange={setJimuMapView}
                />
            </div>

            {/* Botón flotante para expandir cuando está minimizado */}
            {!open && legendItems.length > 0 && (
                <button className="widget-leyenda-floating-btn" onClick={() => setOpen(true)} title="Mostrar leyenda">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="6" x2="10" y2="6" />
                            <line x1="3" y1="12" x2="10" y2="12" />
                            <line x1="3" y1="18" x2="10" y2="18" />
                            <rect x="14" y="4" width="4" height="4" rx="1" />
                            <rect x="14" y="10" width="4" height="4" rx="1" />
                            <rect x="14" y="16" width="4" height="4" rx="1" />
                        </svg>
                    </span>
                </button>
            )}

            {/* Panel expandido de la leyenda */}
            {open && legendItems.length > 0 && (
                <div className="widget-leyenda-panel">
                    <div className="widget-leyenda-header">
                        Leyenda
                        <button className="widget-leyenda-close-btn" onClick={() => setOpen(false)} title="Minimizar">−</button>
                    </div>
                    <div className="widget-leyenda-content">
                        {data?.title && <div className="widget-leyenda-title">{data.title}</div>}
                        <ul className="widget-leyenda-list">
                            {legendItems.map((item, idx) => (
                                <li key={idx} className="widget-leyenda-item">
                                    <span
                                        className="widget-leyenda-swatch"
                                        style={{
                                            backgroundColor: `rgba(${item.colorFondo})`,
                                            borderColor: `rgba(${item.colorLine})`
                                        }}
                                    />
                                    <span className="widget-leyenda-label">{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
    </div>
  )
}

/**
 * Publica resultados en el estado del widget-leyenda y lo abre en el layout.
 *
 * @param features Entidades a mostrar en la tabla.
 * @param fields Definición de campos para la tabla/exportación.
 * @param props Props del widget emisor para registrar sourceWidgetId.
 * @param spatialReference Referencia espacial asociada a los resultados.
 * @param widget-leyendaId Id del widget-result en el layout.
 */
export const abrirWidgetLeyenda = ({
    widgetleyendaId,
    props,
    data
}) => {
  getAppStore().dispatch(
    appActions.widgetStatePropChange(
      widgetleyendaId, // id del widget-leyenda en el layout desde el widget controller
      "results", // nombre de la propiedad que se va a actualizar en el estado del widget
      {
        sourceWidgetId: props.id, // id del widget que envía los datos (este widget)
        title: "Resultados de prueba", // título que se mostrará en el widget de resultados
        data
      },
    ),
  );
  getAppStore().dispatch(appActions.openWidget(widgetleyendaId));
};

/**
 * Limpia el estado de resultados del widget y ejecuta su cierre.
 *
 * @param widget-leyendaId Id del widget-result en el layout.
 */
export const limpiarYCerrarwidgetLeyenda = (widgetleyendaId: string) => {
  // Limpia la data enviada al widget de resultados
  getAppStore().dispatch(
    appActions.widgetStatePropChange(widgetleyendaId, "results", null),
  );
  // Cierra el widget de resultados
  getAppStore().dispatch(appActions.closeWidget(widgetleyendaId));
};