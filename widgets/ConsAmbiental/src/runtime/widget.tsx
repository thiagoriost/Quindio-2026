
/**
 * Sección importación
 * @date 2026-02-10
 * @author IGAC - DIP
*/
import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'; 
import { useState, useEffect, useRef } from "react";

import type { IMConfig } from '../config';

//Importación componente Definición Filtros
import FilterAmb from './components/FilterAmb';

/**
 * Widget Consulta Ambiental componente maestro
 * @date 2026-02-10
 * @author IGAC - DIP
 * @dateUpdated 2026-02-11
 * @changes Inclusion propiedad state visible
 * @changes Inclusion propiedad state setVisible
 * @remarks Sección procesamiento
 */

const Widget = (props: AllWidgetProps<IMConfig>) => {
  //Sección definición States
  //2026-02-11 - State Widget
  const [visible, setVisible]               = useState (false);
  //Mapa
  const [jimuMapView, setJimuMapView]       = useState<JimuMapView>(); 
    
  //Extent Map
  const [view, setView]                     = useState(null);

  //Sección hooks

  //Sección render
  return (
    <div className="widget-demo jimu-widget m-2">
      <FilterAmb
        visible = {visible}
        setVisibleState = {setVisible}
      ></FilterAmb>
    </div>
  )
}

export default Widget
