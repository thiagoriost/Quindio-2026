/*
    Sección de importación
    @date 2024-06-11
*/
import React, { useRef, useEffect, useState } from 'react';
import { AllWidgetProps, esri } from "jimu-core";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'; // The map object can be accessed using the JimuMapViewComponent
import { Button, Label, Select, TextInput } from 'jimu-ui'; // import components

//Objetos desde arcgis
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { loadModules } from 'esri-loader';
import { Point, Polygon, Polyline } from "@arcgis/core/geometry";

//Sección declaración interfaz
import { InterfaceResponseConsultaSimple, InterfaceMensajeModal, typeMSM  } from '../../types/interfaceResponseConsultaSimple';
//import Polyline from '@arcgis/core/geometry/Polyline';

/**
 * Componente para dibujar mapa, invocado desde el componente principal widget.tsx
 * @date 2024-06-11
 * @author IGAC - DIP
 */ 

/* 
    Seccion de declaración
    @dateUpdated: 2024-05-22
    @changes Adicionar la variable jsonSERV
    @dateUpdated: 2024-05-23
    @changes Reestructurar uso de constantes empleando el componente useState, para lo objetos jsonSERV y temas
    @changes Adicionar objeto subtemas
    @changes Adicionar objeto capas
    @changes Adicionar objeto grupos
    @dateUpdated: 2024-05-24
    @changes Adicionar objeto capasAttr
    @dateUpdated: 2024-05-27
    @changes Adicionar objeto txtValorState (Objeto para atributo ReadOnly)
    @changes Adicionar objeto txtValor (Objeto para seteo de contenido campo Valor)
    @changes Adicionar objeto selAttr (Objeto para selección campo Atributo)
    @dateUpdated: 2024-05-28
    @changes Implementar atributo value en control Select alusivo a Tema
    @changes Implementar atributo value en control Select alusivo a Subtema
    @changes Implementar atributo value en control Select alusivo a Grupo
    @changes Implementar atributo value en control Select alusivo a Capa
    @changes Implementar atributo value en control Select alusivo a Atributo
    @dateUpdated: 2024-05-31
    @changes mover objeto mapDiv, para ser visto como global
    @changes Adicionar objeto jimuMapView
    @dateUpdated 2024-06-25
    @changes Implementar interfaz Props (https://stackoverflow.com/questions/66207765/react-typescript-expects-at-least-3-arguments-but-the-jsx-factory-react-cr)
  */
 
    interface Props {
      jimuMapView: any
      setJimuMapView: any
      setAlertDial: any 
      ResponseConsultaSimple: any 
      setResponseConsultaSimple: any 
      mensModal: any 
      setMensModal: any 
      typeGraphMap: any 
      setTypeGraphMap: any 
      view: any 
      setView: any 
      spatialRefer: any 
      setSpatialRefer: any 
      txtValor: string
      txtValorState: any
      setValor: any
      urlCapa: string      
      setUrlCapa: any
      cond: string 
      setCond: any
      props: AllWidgetProps<any>      
      setIsLoading: (d:boolean)=>void
    }
    
    const DrawMap: React.FC<Props> = function ({jimuMapView, setJimuMapView, setAlertDial, ResponseConsultaSimple, setResponseConsultaSimple, mensModal, setMensModal,
      typeGraphMap, setTypeGraphMap, view, setView, spatialRefer, setSpatialRefer, txtValor, txtValorState, setValor, urlCapa, setUrlCapa, cond, setCond, props,
      setIsLoading}){
  
  /**
     * tstDrawMap => Función prueba capacitación renderizado de información al mapa base
     * @date 2024-05-30
     * @author IGAC - DIP
     * @param urlCapas
     * @param cond
     * @dateUpdated 2024-05-31
     * @changes Actualización Renderización al mapa base
     * @dateUpdated 2024-06-04
     * @changes Actualización atributo url en objeto queryFeatures
     * @dateUpdated 2024-06-05
     * @changes Reingeniería objeto featureLayerTst
     * @changes Reingenieria objeto queryFeatures (https://developers.arcgis.com/javascript/latest/api-reference/esri-rest-support-Query.html)
     * @dateUpdated 2024-06-11
     * @changes cargue de los features, según parámetros dado por el objeto params
     * @changes Inclusión término async
     * @dateUpdated 2024-06-12
     * @changes Actualización atributos selCapasURL, url y params
     * @changes Implementación validación de acuerdo a los criterios del widget.
     * @changes Uso del componente <Alert>
     * @dateUpdated 2024-06-19
     * @changes Uso del método setAlertDial para visualizar el componente Alert
     * @changes validación cuando el widget tenga parámetros
     * @changes cambio parámetro selCapas => urlCapas
     * @changes cambio objeto selCapasURL => capasURL
     * @dateUpdated 2024-06-20
     * @changes Invocación al componente Modal, por medio de "seteo" de la variable mensModal 
     * @dateUpdated 2024-06-25
     * @changes Fix validación respuesta del servidor de mapas
     * @changes Fix validación campo Valor si se encuentra vacío y/o con espacios al inicio o al final (FUENTE: https://www.tutorialspoint.com/how-to-trim-white-spaces-from-input-in-reactjs)
     * @changes Fix validación campo Valor si se encuentra desactivado, es campo no diligenciado
     * @changes Fix validación campo Valor cuando es vacío, desactivado
     */
      async function tstDrawMap(urlCapas, cond){        
        //Inicialización state del componente Alert
        setAlertDial(false);

        //Objetos locales
        var dialogAlert = false;
        if (utilsModule?.logger()) console.log("TxtValor en DrawMap =>",txtValor);
        if (utilsModule?.logger()) console.log("Valor state =>",txtValorState);
        if ((!txtValor && txtValor.trim() === "") || txtValorState)        
        {
          setAlertDial(true);
          
          setMensModal({
            deployed: true,
            type: typeMSM.error,
            tittle: 'Campos requeridos no diligenciados',
            body: 'Se requiere diligenciar los campos del filtro!'
          });
          setValor("");
          return;
        }
        else
        {
          setAlertDial(false);
          
          setMensModal({
            deployed: false,
            type: typeMSM.error,
            tittle: '',
            body: ''
          });
        }
        //Gestión URL servicio de mapas
        const capasURL = urlCapas.replace("?f=json","/query");
        if (utilsModule?.logger()) console.log("URL para query =>",capasURL);
        if (utilsModule?.logger()) console.log("Formulacion WHERE => ",cond);

        const url = capasURL;
        //const url = 'https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Ambiental_T_Ajustado/MapServer/14/query';
        const params = new URLSearchParams({
          where: cond,
          //where: "MUNICIPIO='Riosucio'",
          outFields: '*',
          f: 'json',
          returnGeometry: 'true'  // Importante para obtener la geometría
        });

        try {
          const response = await fetch(`${url}?${params.toString()}`);
          if (!response.ok) {
            throw new Error('Error al procesar la consulta!');
          }
          const _responseConsultaSimple = await response.json();  
         
          if (_responseConsultaSimple.features == undefined)
          {
            dialogAlert = true;
            if (utilsModule?.logger()) console.log("Resp Features Serv Mapas =>",_responseConsultaSimple.features)            
          }
          else if (_responseConsultaSimple.features.length == 0)
          {
            if (utilsModule?.logger()) console.log("Resp Features Serv Mapas =>",_responseConsultaSimple.features.length);
            dialogAlert = true;            
          }
          setIsLoading(false);
          if (dialogAlert)
          {
            setAlertDial(true);
            
            setMensModal({
              deployed: true,
              type: typeMSM.warning,
              tittle: "Consulta sin valores",
              body: "No se tienen resultados para ésta consulta"
            });
            return;
          }
          setResponseConsultaSimple(_responseConsultaSimple || {});
        } catch (error) {
          if (utilsModule?.logger()) console.log("Se presentó error al procesar los features =>",error);
        }
      }

      /** 
    * Método drawFeaturesOnMap => 
    * @date 2024-06-11
    * @author IGAC - DIP
    * @params (JimuMapView) jmv => Objeto que relaciona el mapa a trabajar
    * @dateUpdated 2024-06-12
    * @changes Remover todas las capas del mapa, cuando el objeto ResponseConsultaSimple sea nulo (valor null)
    * @dateUpdated 2024-06-13
    * @changes Implementar método goTo para extent y zoom de la geometría
    * @changes Incluir el componente dataGrid (en pruebas)
    * @dateUpdated 2024-06-14
    * @changes Actualización operación Extent mediante el método goTo
    * @dateUpdated 2024-06-17
    * @changes Seteo de la geometría en la variable view
    * @changes Corrección validación cuando no se tenga definido el objeto response
    * @dateUpdated 2024-06-18
    * @changes Inclusión geometría Punto (Point), tomando los módulos SimpleMarkerSymbol, SimpleLineSymbol y Point
    * @dateUpdated 2024-06-19
    * @changes Desactivar inclusión geometría Punto, debido a que ya se encuentran incluidos en la sección de importación
    * @dateUpdated 2024-06-21
    * @changes Seteo del objeto spatialReference para visualización del objeto extent
    * @dateUpdated 2024-06-27
    * @changes Inclusión geometría polyline    
    * @changes Inclusión objeto local zoom, para determinar nivel de la ampliación del mapa, cuando procese el tipo de geometría especificado punto o polígono en 11 unidades; para tipo geometría polilínea en 15 unidades
    */
      const drawFeaturesOnMap = async (response: InterfaceResponseConsultaSimple) => {
        var geometry  = null;
        var symbol    = null;
        var zoom      = -1;
        if (!response)
          return;
        const { features, spatialReference } = response;
        if (!jimuMapView || features.length === 0 || !response) return;
    
    
        const [PopupTemplate,
              SimpleMarkerSymbol,           
              SimpleLineSymbol,
              ] = 
              await loadModules(
                ['esri/PopupTemplate',
                'esri/symbols/SimpleMarkerSymbol',              
                'esri/symbols/SimpleLineSymbol']);
    
        const graphicsLayer = new GraphicsLayer();
    
        features.forEach((feature) => {
          if (utilsModule?.logger()) console.log("Tipo geometría =>",feature.geometry);
          //Validación de un Polígono
          if (feature.geometry.rings){
            setTypeGraphMap("polygon");
            
            const polygon = new Polygon({
              rings: feature.geometry.rings,
              spatialReference: spatialReference
            });
            
            const symbolGraph = {
              type: 'simple-fill',
              color: "orange",
              outline: {
                color: "magenta",
                width: 0.5
              }
            }    
            geometry = polygon;
            symbol = symbolGraph;
            zoom  = 11;
          }
          //Validación de un Punto
          if (feature.geometry.x || feature.geometry.y)
          {
            setTypeGraphMap("point");          
            const point = new Point({
              x: feature.geometry.x,
              y: feature.geometry.y,
              spatialReference: spatialReference
            });
            
            if (utilsModule?.logger()) console.log("Objeto Point =>",point);

            const outlPoint = new SimpleLineSymbol({
              color: [255, 255, 0], // Amarillo
              width: 1
            });
          const symbPoint = new SimpleMarkerSymbol({
              color: [255, 0, 0], // Rojo
              outline:outlPoint,
              size: '8px'
          });
          geometry = point;
          symbol = symbPoint;
          zoom  = 11;
        }
        //Validación del tipo polilinea
        if (feature.geometry.paths){
          setTypeGraphMap("polyline");

          const polyline = new Polyline({
            paths: feature.geometry.paths,
            spatialReference: spatialReference
          });
          
          const symbolGraph = {
            type: 'simple-fill',
            color: "orange",
            outline: {
              color: "magenta",
              width: 0.5
            }
          }    
          geometry = polyline;
          symbol = symbolGraph;
          zoom  = 15;
        }
          const popupTemplate = new PopupTemplate({
            title: "Feature Info",
            content: `
                <ul>
                  ${Object.keys(feature.attributes).map(key => `<li><strong>${key}:</strong> ${feature.attributes[key]}</li>`).join('')}
                </ul>
              `
          });
    
          const graphic = new Graphic({
            //geometry: polygon,
            geometry: geometry,
            //symbol: symbolGraph,    
            symbol: symbol,      
            attributes: feature.attributes,
            popupTemplate: popupTemplate
          });
    
          graphicsLayer.add(graphic);
        });
    
        jimuMapView.view.map.add(graphicsLayer);	
      
        //Extent y zoom de la geometría en el mapa
        jimuMapView.view.goTo({
          target: graphicsLayer.graphics.items[0].geometry,
          zoom: zoom // Ajusta el nivel de zoom según sea necesario
        });

        //Seteo del objeto para guardar la geometria del filtro desde la capa (Layer)
        setView(graphicsLayer);

        //Seteo del objeto spatialReference
        setSpatialRefer(spatialReference);      
    };

    //https://developers.arcgis.com/experience-builder/guide/add-layers-to-a-map/
    const activeViewChangeHandler = (jmv: JimuMapView) => {
      if (utilsModule?.logger()) console.log("Ingresando al evento objeto JimuMapView...");
      if (jmv) {
        setJimuMapView(jmv);        
      }
    };

    /**
     * Hook para dibujado del mapa, actualizando los objetos jimuMapView y ResponseConsultaSimple
     * @date 2024-06-12
     * @author IGAC - DIP
     * @dateUpdated 2024-06-14
     * @changes Invocación método drawFeaturesOnMap con parámetro asociado ResponseConsultaSimple     
     */

    useEffect(() => {
      if (jimuMapView) {        
        drawFeaturesOnMap(ResponseConsultaSimple);
      }
    }, [jimuMapView, ResponseConsultaSimple])

    /**
     * Hook para actualizar el objeto cond, que proporciona el filtro para el servidor de mapas
     * @date 2024-06-25
     * @author IGAC - DIP
     * @remarks En pruebas
     */
    
    useEffect(() => {
      if (utilsModule?.logger()) console.log("En pruebas desde Hook...",cond);
      if (urlCapa && cond)
      {
        tstDrawMap(urlCapa, cond)
      }
      else
      {
        setAlertDial(true);        
      }
    },[cond])

  //FUENTE: https://www.pluralsight.com/resources/blog/guides/how-to-get-selected-value-from-a-mapped-select-input-in-react#:~:text=To%20fetch%20the%20selected%20value,state%20to%20pass%20the%20value.

    const mapDiv = useRef(null);
    const [utilsModule, setUtilsModule] = useState(null);

    //if (utilsModule?.logger()) console.log("=>",jsonSERV);
    //if (utilsModule?.logger()) console.log("Temas =>",temas);

    //if (utilsModule?.logger()) console.log("Array JSON SERV =>",jsonSERV);  
    //Evento sobre opción Consultar => onClick={consultaSimple}

    useEffect(() => {
      import('../../../../utils/module').then(modulo => setUtilsModule(modulo));
    }, []);

    return (
      <div className="w-100 p-3 bg-primary text-white">
        {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
        )}
      </div>
    );
  };
  export default DrawMap;