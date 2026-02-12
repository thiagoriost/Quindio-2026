import { React, AllWidgetProps } from "jimu-core";
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'; // The map object can be accessed using the JimuMapViewComponent
import { useEffect, useRef, useState } from "react";
import { loadModules } from "esri-loader";
import '../styles/style.css'
const Widget = (props: AllWidgetProps<any>) => {
  const [mapView, setJimuMapView] = useState<JimuMapView>();
  const [utilsModule, setUtilsModule] = useState<any>(null);

  // const [initialExtent, setInitialExtent] = useState(null);
  // const [miniMapView, setMiniMapView] = useState(null);
  const miniMapDiv = useRef(null);

  
    
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv);
      // setInitialExtent(jmv.view.extent); // Guarda el extent inicial
    }
  };

  useEffect(() => {
    if (utilsModule?.logger()) console.log("useEffect =>",{mapView, miniMapDiv});
    if (mapView && miniMapDiv.current) {
      loadModules(['esri/views/MapView', 'esri/WebMap', 'esri/Graphic', 'esri/geometry/Extent','esri/Map',])
      .then(([MapView, WebMap, Graphic, Extent, Map]) => {
        const webMap = new WebMap({
          portalItem: {
            id: mapView.view.map.portalItem.id // Utiliza el mismo WebMap que el mapa principal
          }
        });
        if (utilsModule?.logger()) console.log("useEffect =>",{mapView, miniMapDiv, webMap});

        const miniMap = new Map({
          basemap: 'topo-vector'
        });

        const miniView = new MapView({
          container: miniMapDiv.current,
          map: webMap,
          // map: miniMap,
          // center: mapView.view.center,
          // zoom: mapView.view.zoom - 0 // Ajusta el nivel de zoom para la vista general
          ui: { components: [] }, // Remove default UI components
          constraints: {
            snapToZoom: false
          }
        });

        miniView.when(() => {
          const updateMiniMap = () => {
            if (miniView.map.basemap !== mapView.view.map.basemap) miniView.map.basemap = mapView.view.map.basemap;
            miniView.graphics.removeAll();
            const extent = mapView.view.extent;
            const graphic = new Graphic({
              geometry: extent,
              symbol: {
                type: "simple-fill",
                color: [0, 0, 0, 0],
                outline: {
                  color: [255, 255, 0],
                  width: 2
                }
              }
            });
            miniView.graphics.add(graphic);
            miniView.goTo(extent.expand(1.5));
          };

          updateMiniMap();
          mapView.view.watch('stationary', updateMiniMap);

          // setMiniMapView(miniView);
        });
      });
    }
  }, [mapView]);


useEffect(() => {
  if (utilsModule?.logger()) console.log("useEffect =>",{mapView, miniMapDiv});

  return () => {}
}, [miniMapDiv])

  

  useEffect(() => {
  if (utilsModule?.logger()) console.log("useEffect =>",{mapView, miniMapDiv});
    import('../../../utils/module').then(modulo => setUtilsModule(modulo));
  }, []);
    
    return (
      <div  className="w-100 p-1 bg-primary text-white widget-minimap">
        {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
        )}
        <div ref={miniMapDiv} className="containerOverview" ></div>
        
      </div>
    );
  };
  
  export default Widget;