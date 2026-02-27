import { Button } from 'jimu-ui'
import { loadModules } from 'esri-loader'
import { useEffect, useState } from "react"
import { Box } from '@mui/material'
import { DataGrid } from 'react-data-grid'

/**
 * Componente TablaResultados
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.rows - Datos de las filas para la tabla
 * @param {Array} props.columns - Columnas de la tabla
 * @param {Object} props.jimuMapView - Objeto JimuMapView para interactuar con el mapa
 * @param {Object} props.lastGeometriDeployed - Última geometría desplegada en el mapa
 * @param {Function} props.setLastGeometriDeployed - Función para establecer la última geometría desplegada
 * @param {Object} props.graphicsLayerDeployed - Capa de gráficos desplegada
 * @param {Function} props.setMostrarResultadoFeaturesConsulta - Función para mostrar/ocultar los resultados de la consulta
 * @param {Object} props.LayerSelectedDeployed - Capa seleccionada desplegada
 */
const TablaResultados = ({
  rows, columns, jimuMapView, lastGeometriDeployed, setLastGeometriDeployed,
  graphicsLayerDeployed, setMostrarResultadoFeaturesConsulta, LayerSelectedDeployed
}) => {
  const [moduleUtils, setModuleUtils] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [widgetModules, setWidgetModules] = useState(null)

  /**
   * Retorna al formulario de consulta, eliminando la última geometría desplegada
   */
  const retornarFormulario = () => {
    if (lastGeometriDeployed) {
      jimuMapView.view.map.remove(lastGeometriDeployed)
      setLastGeometriDeployed(null)
      jimuMapView.view.goTo({
        target: graphicsLayerDeployed ? graphicsLayerDeployed.graphics.items[0].geometry : lastGeometriDeployed.graphics.items[0].geometry,
        zoom: 10
      })
    }
    setMostrarResultadoFeaturesConsulta(false)
  }

  /**
   * Realiza el zoom a la característica seleccionada en la tabla
   * @param {Object} row - Fila seleccionada que contiene la geometría
   */
  const zoomToFeatureSelected = (row) => {
    setIsLoading(true)
    if (lastGeometriDeployed) jimuMapView.view.map.remove(lastGeometriDeployed)

    const geometryType = LayerSelectedDeployed.geometryType || row.row.geometry.type
    const spatialReference = row.row.geometry.spatialReference || graphicsLayerDeployed.graphics.items.find(e => e.attributes.OBJECTID === row.row.OBJECTID).geometry.spatialReference

    loadModules([
      'esri/layers/GraphicsLayer', 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/Graphic',
      'esri/symbols/SimpleMarkerSymbol', 'esri/geometry/Point', 'esri/geometry/Extent'
    ]).then(([GraphicsLayer, SimpleFillSymbol, SimpleLineSymbol, Graphic, SimpleMarkerSymbol, Point, Extent]) => {
      const symbol = moduleUtils.createSymbol({ SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol }, geometryType)
      const geometry = moduleUtils.createGeometry({ Point }, geometryType, row.row.geometry, spatialReference)

      const graphic = new Graphic({ geometry, symbol })
      const graphicsLayer = new GraphicsLayer()
      graphicsLayer.add(graphic)
      jimuMapView.view.map.add(graphicsLayer)

      const targetGeometry = graphicsLayer.graphics.items[0].geometry
      const zoomLevel = geometryType === 'point' ? 18 : 10
      const extent = geometryType === 'point' ? targetGeometry : graphic.geometry.extent.expand(1.5)

      jimuMapView.view.goTo({ target: extent, zoom: zoomLevel }, { duration: 3000 })
      setLastGeometriDeployed(graphicsLayer)
      setTimeout(() => {
        jimuMapView.view.extent = targetGeometry.extent
        setIsLoading(false)
      }, 5000)
    })
  }

  /**
   * Exporta los datos a un archivo CSV
   */
  const exportToCSV = () => {
    moduleUtils.moduleExportToCSV(rows, 'data')
  }

  /**
   * Carga el módulo de utilidades al montar el componente
   */
  useEffect(() => {
    import('../../utils/module').then(modulo => { setModuleUtils(modulo) })
    import('../widgetsModule').then(modulo => { setWidgetModules(modulo) })
  }, [])

  return (
    <>
      <div className="fila">
        <Button size="sm" className="mb-1" type="primary" onClick={retornarFormulario}>
          Parámetros consulta
        </Button>
        <Button onClick={exportToCSV} size="sm" className="mb-1" type="primary">
          Exportar
        </Button>
      </div>
      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid columns={columns} rows={rows} onCellClick={zoomToFeatureSelected} />
      </Box>
      { isLoading && widgetModules?.OUR_LOADING() }
    </>
  )
}

export default TablaResultados
