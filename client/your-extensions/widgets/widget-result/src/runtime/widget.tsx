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

import { React, jsx, AllWidgetProps, IMState, IMConfig } from "jimu-core";
import { useSelector } from "react-redux";
import { ResultPayload } from "../../models/result-payload.model";
import { ResultTable } from "../../components/ResultTable";
import { ResultFooter } from "../../components/ResultFooter";
import { exportService } from "../../../shared/services/export.service";
import { JimuMapViewComponent, JimuMapView } from "jimu-arcgis";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { useOnWidgetClose } from "../../../shared/hooks/useOnWidgetClose";
import { appActions, getAppStore } from "jimu-core";
import { WidgetState } from "jimu-core";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import "../styles/widgetResultFloating.css";
import { i } from "motion/dist/react-m";

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
    // Estado para mostrar/ocultar el panel flotante
    const [open, setOpen] = React.useState(true)

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
     * para recordar si la última consulta era temporal antes de que data pase a null.
     */
    const temporalLayerRef = React.useRef<boolean>(false)


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
      view.map.remove(layer);
      layer.destroy();
      graphicsLayerRef.current = null;
    };
  }, [jimuMapView]);

  /**
   * Crea una capa gráfica utilizada para mostrar
   * la geometría de la entidad seleccionada.
   *
   * La capa se agrega al mapa al inicializarse y
   * se elimina automáticamente cuando el widget se desmonta.
   */
  /*  React.useEffect(() => {
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
    }, [jimuMapView]) */

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
            if (!temporalLayerRef.current) {
                restoreInitialExtent()
            }
        }
    }, [data])

    /**
     * Reinicia la paginación cuando llegan nuevos resultados.
     */
    React.useEffect(() => {
        if (data) setPage(1)
    }, [data])


    /**
     * Guarda el valor de temporalLayer cuando llegan los datos
    */
    React.useEffect(() => {
        if (data) {
            temporalLayerRef.current = data.temporalLayer === true
        }
    }, [data])

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

      const resolveSpatialReference = (geometry: any, fallback: __esri.SpatialReference) => {
        return geometry?.spatialReference || data?.spatialReference || fallback
      }

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

      const getGoToTarget = (geometry: __esri.Geometry) => {
        if ('extent' in geometry && geometry.extent) {
          return geometry.extent.expand(2)
        }

        return geometry
      }

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
            spatialReference: {
                wkid: data.spatialReference?.wkid
            }
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

    React.useEffect(() => { // cef 20260307

        if (!data) return

        const { features } = data

        if (!features?.length) return

        console.log("Resultados recibidos en WidgetResult:", features)
        setOpen(true)

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
    //  const handleSelectFeature = (feature: __esri.Graphic) => {
    const handleSelectFeature = async (feature: any) => {
        console.log('feature seleccionada:', feature)

        if (data?.temporalLayer) {
            await crearCapaTemporal(feature)
            return
        }

        if (!jimuMapView || !graphicsLayerRef.current) return

        if (!feature?.geometry) return

        const view = jimuMapView.view

        graphicsLayerRef.current.removeAll()

        const geometry = buildGeometry(feature.geometry, view.spatialReference)

        if (!geometry) {
            console.warn('No fue posible construir una geometría válida para la selección:', feature.geometry)
            return
        }


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

        if (graphic.geometry.type === 'point') {
            await view.goTo({
                target: graphic.geometry,
                zoom: 18
            })
            return
        }

        await view.goTo({
            target: getGoToTarget(graphic.geometry)
        })
    };

  /**
   * Validación de mapa configurado en el widget.
   */

  if (!props.useMapWidgetIds?.length) {
    return (
      <div>
        {!open && (
          <button
            className="widget-result-floating-btn"
            onClick={() => setOpen(true)}
            title="Mostrar resultados"
          >
            <span className="widget-result-floating-icon">
              {/* SVG tabla */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="4"
                  y="6"
                  width="20"
                  height="16"
                  rx="3"
                  fill="var(--color-primary-light)"
                  stroke="var(--color-primary-light)"
                  strokeWidth="2"
                />
                <rect
                  x="4"
                  y="11"
                  width="20"
                  height="1.5"
                  fill="var(--color-primary-light)"
                />
                <rect
                  x="10"
                  y="6"
                  width="1.5"
                  height="16"
                  fill="var(--color-primary-light)"
                />
                <rect
                  x="16.5"
                  y="6"
                  width="1.5"
                  height="16"
                  fill="var(--color-primary-light)"
                />
              </svg>
            </span>
          </button>
        )}
        {open && (
          <div className="widget-result-floating-panel">
            <div className="widget-result-header">
              Resultados
              <button
                className="widget-result-close-btn"
                onClick={() => setOpen(false)}
                title="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="widget-result-content">
              Debe seleccionar un Map Widget en la configuración.
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {!open && (
        <button
          className="widget-result-floating-btn"
          onClick={() => setOpen(true)}
          title="Mostrar resultados"
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* SVG tabla */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="6"
                width="20"
                height="16"
                rx="3"
                fill="var(--color-primary-light)"
                stroke="var(--color-primary-light)"
                strokeWidth="2"
              />
              <rect
                x="4"
                y="11"
                width="20"
                height="1.5"
                fill="var(--color-primary-light)"
              />
              <rect
                x="10"
                y="6"
                width="1.5"
                height="16"
                fill="var(--color-primary-light)"
              />
              <rect
                x="16.5"
                y="6"
                width="1.5"
                height="16"
                fill="var(--color-primary-light)"
              />
            </svg>
          </span>
        </button>
      )}
      {open && (
        <div className="widget-result-floating-panel">
          <div className="widget-result-header">
            Resultados
            <button
              className="widget-result-close-btn"
              onClick={() => setOpen(false)}
              title="Cerrar"
            >
              -
            </button>
          </div>
          <div className="widget-result-content">
            {/* Componente de acceso al MapView */}
            <div style={{ position: "absolute", width: 0, height: 0 }}>
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
              total={total}
              page={page}
              totalPages={totalPages}
              setPage={setPage}
            />
            {total > 1 && (
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

export const abrirTablaResultados = (
  features: any[],
  fields: any[],
  props: any,
  spatialReference?: __esri.SpatialReference,
  widgetResultId?: string,
) => {
  getAppStore().dispatch(
    appActions.widgetStatePropChange(
      widgetResultId, // id del WidgetResult en el layout desde el widget controller
      "results", // nombre de la propiedad que se va a actualizar en el estado del widget
      {
        sourceWidgetId: props.id, // id del widget que envía los datos (este widget)
        title: "Resultados de prueba", // título que se mostrará en el widget de resultados
        features: features, // datos de las características a mostrar
        fields: fields, // campos a mostrar en la tabla de resultados
        spatialReference: spatialReference, // referencia espacial de los datos
      },
    ),
  );
  getAppStore().dispatch(appActions.openWidget(widgetResultId));
};

// Limpia la data del widget de resultados y lo cierra
export const limpiarYCerrarWidgetResultados = (widgetResultId) => {
  // Limpia la data enviada al widget de resultados
  getAppStore().dispatch(
    appActions.widgetStatePropChange(widgetResultId, "results", null),
  );
  // Cierra el widget de resultados
  getAppStore().dispatch(appActions.closeWidget(widgetResultId));
};