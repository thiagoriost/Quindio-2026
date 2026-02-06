/*
    Sección de importación
    @date 2024-06-11
*/
import React from "react";

import { DataGrid } from "react-data-grid"; 
import 'react-data-grid/lib/styles.css';

import { Button } from "jimu-ui";

import { exportToCSV } from "../../../../utils/exportToCSV"

//Objetos desde arcgis
import { loadModules } from 'esri-loader';

//Importación interfaces
import { typeMSM } from "../../types/interfaceResponseConsultaSimple";


/**
 * Componente TablaResultCS => Visualiza la tabla de consulta Simple, asociado a un Data Grid
 * @date 2024-06-25
 * @author IGAC - DIP
 * @param rows
 * @param columns
 * @param view
 * @param setControlForms
 * @param jimuMapView
 * @param setResponseConsultaSimple
 * @param lastGeometriDeployed
 * @param setLastGeometriDeployed
 * @param typeGraphMap
 * @param spatialRefer
 * @param setAlertDial
 * @param setMensModal
 */
const TablaResultCS = function({rows, columns, view, setControlForms, jimuMapView, setResponseConsultaSimple, lastGeometriDeployed, setLastGeometriDeployed, typeGraphMap, spatialRefer, setAlertDial, setMensModal}){
    /**
     * método limpiarCapaMapa() => quita capa del mapa asociada al filtro consulta simple. Centra el mapa con un nivel de ampliación a 6 unidades
     * @date 2024-06-17
     * @author IGAC - DIP
     * @dateUpdated 2024-06-20
     * @changes remover la capa ampliada, obtenida desde el DataGrid al procesar la consulta del widget
     * @returns JimuMapView
     */
    function limpiarCapaMapa()
    {
        setResponseConsultaSimple(null);      
        //console.log("Obj Geometria =>",view);      
        if (view){
            jimuMapView.view.map.remove(view);
            //Definición del extent centrado al dpto de Quindio
            jimuMapView.view.goTo({ 
                center: [-75.690601, 4.533889],
                zoom: 6
            });
        }
        //Remover capa mapa ampliada
        if (lastGeometriDeployed)
        {
            jimuMapView.view.map.remove(lastGeometriDeployed);
        }
    }
    /**
     * Método retornarFormulario => Visualiza los criterios de selección del widget, estando en el componente DataGrid
     * @date 2024-06-18
     * @author IGAC - DIP     
     * @remarks método obtenido del widget consulta Avanzada (widgets/consulta-avanzada/src/runtime/widget.tsx)
     */
    const retornarFormulario = function() {
        if (view){
          limpiarCapaMapa();
        }
        setControlForms(false);
      }

    /**
     * zoomToDataGridSelected => Método para ampliar la zona del mapa, de acuerdo al registro seleccionado desde el componente DataGrid
     * @date 2024-06-18
     * @author IGAC - DIP
     * @param row => Corresponde a la fila seleccionada del componente DataGrid
     * @dateUpdated 2024-06-20
     * @changes Fix para el procesamiento de cada feature del Data Grid, se resalta la zona del mapa.
     * @dateUpdated 2024-06-21
     * @changes Fix invocación método calculateExtent(), pasando la geometría de la consulta actual
     * @remarks método obtenido del widget consulta Avanzada (widgets/consulta-avanzada/src/runtime/widget.tsx) 
     */
      const zoomToDataGridSelected = async function (row) {
        if (lastGeometriDeployed)
        {
          jimuMapView.view.map.remove(lastGeometriDeployed);
        }
        //Sección importación componentes locales
        const [Graphic, GraphicsLayer, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol,Point, Extent] = await loadModules([
          'esri/Graphic', 'esri/layers/GraphicsLayer', 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol',
          'esri/symbols/SimpleMarkerSymbol', 'esri/geometry/Point', 'esri/geometry/Extent'
        ]);
        // const geometryType  = LayerSelectedDeployed.geometryType;
  
        const geometryType  = view.graphics.items[0].geometry.type;
         
        //console.log("Row DG =>",row.row);      
       
        const spatialReference            = view.graphics.items.find(e => e.attributes.OBJECTID == row.row.OBJECTID).geometry.spatialReference;
        
        //console.log("Tipo Geom =>",geometryType);
              
        const geometry = createGeometry({ Point }, geometryType, row.row.geometry, spatialReference);
  
        const symbol = createSymbol({ SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol }, geometryType);
  
        //Procesamiento en objeto graphic
        const graphic = new Graphic({
          geometry,symbol
        });
  
        //Creación del Layer asociado
        const graphicsLayer = new GraphicsLayer();
        graphicsLayer.add(graphic);
        
        //Inclusión capa en el mapa
        jimuMapView.view.map.add(graphicsLayer);
  
        if (geometryType != "point")
        {
          jimuMapView.view.goTo(
            graphic.geometry.extent.expand(1.5), 
            { duration: 1000 }
          );
        }
        else
        {
          const extentData = calculateExtent(row.row.geometry, view);
          const extent = new Extent(extentData);
          jimuMapView.view.goTo(
            extent, 
            { duration: 1000 }
          );
        }
        //Actualización de la geometría      
        setLastGeometriDeployed(graphicsLayer);
      }
    
    /**
     * método createSymbol => Método para gestión de simbolos, según el tipo de geometría {polygon, polyline, point}
     * @date 2024-06-20
     * @author IGAC - DIP    
     * @remarks método obtenido del widget consulta avanzada, componente TablaResultados.tsx
     */

    const createSymbol = ({ SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol }, geometryType) => {
        switch (geometryType) {
          case 'polygon':
            return new SimpleFillSymbol({
              color: [255, 255, 0, 0.25],
              outline: new SimpleLineSymbol({ color: [255, 0, 0], width: 2 })
            });
          case 'polyline':
            return new SimpleLineSymbol({ color: [255, 0, 0], width: 2 });
          case 'point':
            return new SimpleMarkerSymbol({
              color: [255, 0, 0],
              outline: new SimpleLineSymbol({ color: [255, 255, 0], width: 1 }),
              size: '8px'
            });
          default:
            throw new Error('Tipo de geometría no soportado');
        }
      };
    /**
     * Método createGeometry => crear la geometría según el tipo
     * @date 2024-06-20
     * @author IGAC - DIP    
     * @remarks método obtenido del widget consulta avanzada, componente TablaResultados.tsx
     */

    const createGeometry = ({ Point }, geometryType, geometryData, spatialReference) => {
        switch (geometryType) {
          case 'polygon':
            return { type: geometryType, rings: geometryData.rings, spatialReference };
          case 'polyline':
            return { type: geometryType, paths: geometryData.paths, spatialReference };
          case 'point':
            return new Point({
              x: geometryData.x,
              y: geometryData.y,
              spatialReference
            });
          default:
            throw new Error('Tipo de geometría no soportado');
        }
      };

     /**
     * Método calculateExtent => calcula el Extent de la geometría {punto, polilinea o polígono}
     * @date 2024-06-18
     * @author IGAC - DIP
     * @param (Array) geometry => Estructura de datos con la geometría asociada al Layer
     * @param (Array) LayerSelectedDeployed => Estructura de datos con la capa filtrada actualmente según el DataGrid
     * @dateUpdated 2024-06-21
     * @changes Validación cargue tipo geometría
     * @changes actualización atributo buffer     
     * @returns xmin,
                ymin,
                xmax,
                ymax,
                spatialReference                
     * @remarks método obtenido del widget consulta Avanzada (widgets/consulta-avanzada/src/runtime/widget.tsx)
                */
    const calculateExtent = function (geometry, LayerSelectedDeployed) {
        let {fullExtent, geometryType}  = LayerSelectedDeployed;   
        
        //Validación cargue tipo geometría
        if (!geometryType)   
        {
            geometryType = typeGraphMap;
        }
        let xmin = Infinity;
        let ymin = Infinity;
        let xmax = Infinity;
        let ymax = Infinity;
    
        switch (geometryType)
        {
            case 'point':
            {
            const buffer = -250; // Tamaño del buffer alrededor del punto
            return {
                xmin: geometry.x - buffer,
                ymin: geometry.y - buffer,
                xmax: geometry.x + buffer,
                ymax: geometry.y + buffer,            
                spatialReference: spatialRefer
            };
            }
            break;
    
            case "polygon":
            case "polyline":
            {
            const geometries = geometryType == 'polygon' ? geometry.rings : geometry.paths;
            
            geometries.forEach(ring => {
                ring.forEach(([x, y]) => {
                if (x < xmin) xmin = x;
                if (y < ymin) ymin = y;
                if (x > xmax) xmax = x;
                if (y > ymax) ymax = y;
                });
            });
            return {
                xmin,
                ymin,
                xmax,
                ymax,
                spatialReference:fullExtent.spatialReference
            }; 
            }
            break;
    
            default:
            {
            return null;
            }
            break;
        }
    }

    /**
     * Método exportToCSVTS => Exportar datos desde el componente Data Grid, empleando el objeto exportToCSV desde utils
     * @date 2024-06-21
     * @author IGAC - DIP
     * @param data => corresponde a la data para procesar
     * @param fName => corresponde al nombre de archivo
     * @remarks Método obtenido del widget Consulta avanzada
     */
    const exportToCSVTS = function (data, fName) {
        //Objeto array para procesar la data
        const csvDataArr = [];
  
        //Procesar nombre archivo, estándar 'data'+'_'+'Anio'+'_'+'Mes'+'_'+'Dia'+'_'+'hh'+'_'+'mm'+'_'+'ss' 
        if (fName)
        {
          fName = generarFileStand(fName);
        }
        
        exportToCSV(data, fName);

        //Visualizar modal descarga exitosa o fallida
        setAlertDial(true);
        setMensModal({
          deployed: true,
          type: typeMSM.success,
          tittle: 'Proceso Exportación archivo CSV',
          body: 'Archivo'+' '+`${fName}.csv`+' '+'Descargado correctamente!'
        });
        return;
      }

      /**
     * generarFileStand=> método que genera el archivo con el estándar name+_+anio+_+mes+_+dia+_+hr+_+min+_+seg
     * @date 2024-06-21
     * @author IGAC - DIP
     * @param fName => nombre del archivo
     * @returns fName con estándar name+_+anio+_+mes+_+dia+_+hr+_+min+_+seg
     */

    const generarFileStand = function(fName:string){
        //Procesar fecha y hora
        const date        = new Date();
        const yearCSV     = date.getUTCFullYear();      
        const dayCSV      = procesaFechaHora (date.getUTCDate());
        const monthFullCSV= procesaFechaHora (date.getUTCMonth() + 1);
  
        //Horas minutos y segundos
        const hourCSV     = procesaFechaHora(date.getHours());
        const minutesCSV  = procesaFechaHora(date.getMinutes());
        const secondsFullCSV= procesaFechaHora(date.getSeconds());
        
        //console.log("Anio =>",yearCSV);
        //console.log("Mes =>",monthFullCSV);
        //console.log("Dia =>",dayCSV);
        //console.log("Hora =>",hourCSV);
        //console.log("Minutos =>",minutesCSV);
        //console.log("Segundos =>",secondsFullCSV);
  
        return (fName+"_"+yearCSV+"_"+monthFullCSV+"_"+dayCSV+"_"+hourCSV+"_"+minutesCSV+"_"+secondsFullCSV);
  
      };
  
      /**
       *  procesaFechaHora => método para devolver el número del día o mes o el número de minutos o segundos que contienen un solo digito (1-9) con un cero a la izquierda
       * @date 2024-06-21
       * @author IGAC - DIP
       * @returns Número del mes correcto
       */
  
      const procesaFechaHora = function(nTime: Number){      
          if (Number(nTime) > 0 && Number(nTime) < 10)
          {
            return '0'+nTime.toString();
          }
          return nTime;      
      }
  return (
    <>
        <Button size="sm" className="mb-1" type="primary" onClick={retornarFormulario}>
            Parámetros consulta</Button>
            <Button size="sm" className="mb-1" type="primary" onClick={function(){exportToCSVTS(rows, 'data')}}>Exportar</Button>            
        <DataGrid columns={columns} rows={rows} onCellClick={zoomToDataGridSelected} />
    </>    
      )
};

export default TablaResultCS;