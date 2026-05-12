// Ver código para probar el hook al final.

import { React } from 'jimu-core'
import type { JimuMapView } from 'jimu-arcgis'
import type { ArcGisFeature, ArcGisField } from '../../consulta-salud/src/runtime/types'

const normalizeFieldType = (fieldType?: string): __esri.FieldProperties['type'] => {
  switch (fieldType) {
    case 'esriFieldTypeOID':
      return 'oid'
    case 'esriFieldTypeString':
      return 'string'
    case 'esriFieldTypeInteger':
      return 'integer'
    case 'esriFieldTypeSmallInteger':
      return 'small-integer'
    case 'esriFieldTypeDouble':
      return 'double'
    case 'esriFieldTypeSingle':
      return 'single'
    case 'esriFieldTypeDate':
      return 'date'
    case 'esriFieldTypeGUID':
      return 'guid'
    case 'esriFieldTypeGlobalID':
      return 'global-id'
    case 'esriFieldTypeBlob':
      return 'blob'
    case 'esriFieldTypeRaster':
      return 'raster'
    case 'esriFieldTypeGeometry':
      return 'geometry'
    case 'esriFieldTypeXML':
      return 'xml'
    case 'esriFieldTypeLong':
      return 'long'
    default:
      return (fieldType as __esri.FieldProperties['type']) || 'string'
  }
}

const buildGeometry = async (
  geometry: any,
  spatialReference: __esri.SpatialReference
) => {
  if (!geometry) return null

  const geometryType = geometry.type
    || (geometry.rings ? 'polygon' : null)
    || (geometry.paths ? 'polyline' : null)
    || (geometry.x != null && geometry.y != null ? 'point' : null)

  if (!geometryType) return null

  if (geometryType === 'polygon' && geometry.rings) {
    const { default: Polygon } = await import('@arcgis/core/geometry/Polygon')
    return new Polygon({
      rings: geometry.rings,
      spatialReference: geometry.spatialReference || spatialReference
    })
  }

  if (geometryType === 'polyline' && geometry.paths) {
    const { default: Polyline } = await import('@arcgis/core/geometry/Polyline')
    return new Polyline({
      paths: geometry.paths,
      spatialReference: geometry.spatialReference || spatialReference
    })
  }

  if (geometryType === 'point' && geometry.x != null && geometry.y != null) {
    const { default: Point } = await import('@arcgis/core/geometry/Point')
    return new Point({
      x: geometry.x,
      y: geometry.y,
      spatialReference: geometry.spatialReference || spatialReference
    })
  }

  return null
}

const removeLayerById = (map: __esri.Map, layerId: string) => {
  const existingLayer = map.findLayerById(layerId)
  if (!existingLayer) return

  map.remove(existingLayer)
  existingLayer.destroy?.()
}

export const useDibujarFeatures = ({
  jimuMapView,
  features,
  fields = [],
  spatialReference,
  layerId = 'features-layer',
  groupLayerId = 'capas-temporales',
  title = 'Resultados',
  enabled = true,
  zoom
}: {
  jimuMapView: JimuMapView
  features: ArcGisFeature[]
  fields?: ArcGisField[]
  spatialReference?: __esri.SpatialReference
  layerId?: string
  groupLayerId?: string
  title?: string
  enabled?: boolean
  zoom?: number
}): __esri.FeatureLayer | null => {
  const layerRef = React.useRef<__esri.FeatureLayer | null>(null)

  React.useEffect(() => {
    const view = jimuMapView?.view

    if (!view) return

    if (!enabled || !features?.length) {
      removeLayerById(view.map, layerId)
      layerRef.current = null
      return
    }

    let cancelled = false

    const dibujar = async () => {
      const [{ default: FeatureLayer }, { default: GroupLayer }, { default: Graphic }] = await Promise.all([
        import('@arcgis/core/layers/FeatureLayer'),
        import('@arcgis/core/layers/GroupLayer'),
        import('@arcgis/core/Graphic')
      ])

      if (cancelled) return

      const map = view.map
      removeLayerById(map, layerId)

      let tempGroup = map.findLayerById(groupLayerId) as __esri.GroupLayer
      if (!tempGroup) {
        tempGroup = new GroupLayer({
          id: groupLayerId,
          title: 'Capas temporales',
          visibilityMode: 'independent',
          listMode: 'show'
        })
        map.add(tempGroup)
      }

      const normalizedFields = Array.isArray(fields)
        ? fields.map((field) => ({
          ...field,
          type: normalizeFieldType(field.type)
        }))
        : []
      const objectIdFieldName = normalizedFields.find(field => field.type === 'oid')?.name || 'OBJECTID'

      if (!normalizedFields.some(field => field.name === objectIdFieldName)) {
        normalizedFields.unshift({
          name: objectIdFieldName,
          alias: objectIdFieldName,
          type: 'oid'
        } as ArcGisField)
      }

      const geometryType = (() => {
        const geometry = features[0]?.geometry
        if (!geometry) return 'polygon'
        if (geometry.type) return geometry.type
        if (geometry.rings) return 'polygon'
        if (geometry.paths) return 'polyline'
        if (geometry.x != null && geometry.y != null) return 'point'
        return 'polygon'
      })()

      const sourceWithNulls = await Promise.all(
        features.map(async (feature, index) => {
          const normalizedGeometry = await buildGeometry(
            feature.geometry,
            spatialReference || view.spatialReference
          )

          if (!normalizedGeometry) {
            return null
          }

          return new Graphic({
            geometry: normalizedGeometry,
            attributes: {
              [objectIdFieldName]: feature.attributes?.[objectIdFieldName] ?? index + 1,
              ...feature.attributes
            }
          })
        })
      )

      const source = sourceWithNulls.filter(Boolean)

      if (!source.length) {
        layerRef.current = null
        return
      }

      const layer = new FeatureLayer({
        id: layerId,
        title,
        source,
        fields: normalizedFields as __esri.FieldProperties[],
        objectIdField: objectIdFieldName,
        geometryType,
        spatialReference: spatialReference || source[0]?.geometry?.spatialReference || view.spatialReference,
        renderer: {
          type: 'simple',
          symbol: geometryType === 'point'
            ? {
              type: 'simple-marker',
              style: 'circle',
              color: [255, 90, 0, 0.85],
              size: 6,
              outline: {
                color: [255, 255, 255, 0.9],
                width: 0.8
              }
            }
            : geometryType === 'polyline'
              ? {
                type: 'simple-line',
                color: [255, 90, 0, 0.9],
                width: 1.5
              }
              : {
                type: 'simple-fill',
                color: [255, 90, 0, 0.15],
                outline: {
                  color: [255, 90, 0, 0.9],
                  width: 1
                }
              }
        } as __esri.RendererProperties,
        listMode: 'show'
      })

      tempGroup.add(layer)
      layerRef.current = layer

      await layer.load()

      if (!cancelled && Number.isFinite(zoom)) {
        const extent = await layer.queryExtent()
        if (extent?.extent) {
          await view.goTo({
            target: extent.extent,
            zoom
          })
        }
      }
    }

    void dibujar()

    return () => {
      cancelled = true
      removeLayerById(view.map, layerId)
      layerRef.current = null
    }
  }, [jimuMapView, features, fields, spatialReference, layerId, groupLayerId, title, enabled, zoom])

  return layerRef.current
}

// Código para probar el hook
// El widget cliente debe tener configurado JimuMapView
/*
const datosEjemplo: {
    features: ArcGisFeature[]
    fields: ArcGisField[]
    spatialReference: __esri.SpatialReference
} = {
    spatialReference: { wkid: 4326 } as __esri.SpatialReference,
    fields: [
        { name: 'OBJECTID', alias: 'OBJECTID', type: 'esriFieldTypeOID' } as ArcGisField,
        { name: 'nombre', alias: 'Nombre', type: 'esriFieldTypeString' } as ArcGisField,
        { name: 'categoria', alias: 'Categoria', type: 'esriFieldTypeString' } as ArcGisField
    ],
    features: [
        {
            geometry: { x: -75.5812, y: 6.2442, spatialReference: { wkid: 4326 } },
            attributes: {
                OBJECTID: 1,
                nombre: 'Muestra Centro',
                categoria: 'Normatividad'
            }
        },
        {
            geometry: { x: -75.5699, y: 6.2518, spatialReference: { wkid: 4326 } },
            attributes: {
                OBJECTID: 2,
                nombre: 'Muestra Norte',
                categoria: 'Normatividad'
            }
        },
        {
            geometry: { x: -75.5937, y: 6.2351, spatialReference: { wkid: 4326 } },
            attributes: {
                OBJECTID: 3,
                nombre: 'Muestra Sur',
                categoria: 'Normatividad'
            }
        }
    ] as ArcGisFeature[]
}

// Invocacion del hook:
 useDibujarFeatures({
        jimuMapView,
        features: datosEjemplo.features,
        fields: datosEjemplo.fields,
        spatialReference: datosEjemplo.spatialReference,
        layerId: 'consulta-ejemplo',
        groupLayerId: 'capas-temporales',
        title: 'Ejemplo',
        enabled: true,
        zoom: 15
    })
*/
