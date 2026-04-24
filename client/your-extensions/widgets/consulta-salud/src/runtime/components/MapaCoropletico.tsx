import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'
import { React } from 'jimu-core'
import type { JimuMapView } from 'jimu-arcgis'

import type { ArcGisFeature } from '../types'

type ColorValue = string | number[]

export type RangoCoropletico = {
    minimo: number
    maximo: number
    colorFondo: ColorValue
    colorLine: ColorValue
    label?: string
}

type MapaCoropleticoProps = {
    jimuMapView?: JimuMapView
    features: ArcGisFeature[]
    fieldName: string
    ranges: RangoCoropletico[]
    layerId?: string
}

const DEFAULT_FILL_COLOR = [255, 0, 0, 0.25]
const DEFAULT_LINE_COLOR = [255, 0, 0, 1]

const parseColor = (color: ColorValue, fallback: number[]) => {
    if (Array.isArray(color)) {
        return color
    }

    if (typeof color === 'string') {
        const parsed = color.split(',').map(Number)

        if (parsed.length > 0 && parsed.every((value) => Number.isFinite(value))) {
            return parsed
        }
    }

    return fallback
}

const MapaCoropletico = ({
    jimuMapView,
    features,
    fieldName,
    ranges,
    layerId = 'consulta-salud-coropletico'
}: MapaCoropleticoProps) => {
    React.useEffect(() => {
        const view = jimuMapView?.view

        if (!view) {
            return
        }

        let layer = view.map.findLayerById(layerId) as GraphicsLayer

        if (!layer) {
            layer = new GraphicsLayer({
                id: layerId,
                listMode: 'hide'
            })
            view.map.add(layer)
        }

        layer.removeAll()

        const graphics = (features ?? [])
            .filter((feature) => feature?.geometry)
            .map((feature) => {
                const geometry = feature.geometry as __esri.Geometry
                const rawValue = Number(feature.attributes?.[fieldName] ?? 0)
                const range = ranges.find((item) => rawValue >= item.minimo && rawValue <= item.maximo)

                if (geometry?.type === 'polygon') {
                    return new Graphic({
                        geometry,
                        attributes: feature.attributes,
                        symbol: {
                            type: 'simple-fill',
                            color: parseColor(range?.colorFondo, DEFAULT_FILL_COLOR),
                            outline: {
                                color: parseColor(range?.colorLine, DEFAULT_LINE_COLOR),
                                width: 2
                            }
                        }
                    })
                }

                return new Graphic({
                    geometry,
                    attributes: feature.attributes,
                    symbol: {
                        type: 'simple-marker',
                        style: 'circle',
                        color: parseColor(range?.colorLine, DEFAULT_LINE_COLOR),
                        size: '12px'
                    }
                })
            })

        if (graphics.length) {
            layer.addMany(graphics)
        }

        return () => {
            layer.removeAll()
        }
    }, [jimuMapView, features, fieldName, ranges, layerId])

    return null
}

export default MapaCoropletico
