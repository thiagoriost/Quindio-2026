
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
 * @changes Inclusion propiedad state areaLst
 * @changes Inclusion propiedad state selAreaVal
 * @changes Inclusion propiedad state tematicaLst
 * @changes Inclusion propiedad state selTematicaVal
 * @changes Inclusion propiedad state selTematicaDis
 * @changes Inclusion propiedad state categorLst
 * @changes Inclusion propiedad state selCategorVal
 * @changes Inclusion propiedad state selCategorDis
 * @changes Inclusion propiedad state subCategorLst
 * @changes Inclusion propiedad state 
 * @remarks Sección procesamiento
 */

const Widget = (props: AllWidgetProps<IMConfig>) => {
  //Sección definición States
  //2026-02-11 - State Widget
  const [visible, setVisible]               = useState <boolean>(false);
  //State Lista campo Área
  const [areaLst, setAreaLst]               = useState ([]);
  //State Control Área
  const [selAreaVal, setSelAreaVal]         = useState <number>();
  //State asociado a Estado control Área
  const [selAreaDis, setSelAreaDis]         = useState <boolean>(true);
  //State Lista campo temática
  const [tematicaLst, setTematicaLst]       = useState ([]);
  //State Control Temática
  const [selTematicaVal, setSelTematicaVal] = useState <number>();
  //State asociado a Estado control Temática
  const [selTematicaDis, setSelTematicaDis] = useState <boolean>(true);
  //State Lista campo Categoría
  const [categorLst, setCategorLst]         = useState ([]);
  //State Control Categoría
  const [selCategorVal, setSelCategorVal]   = useState <number>();
  //State asociado a Estado control Categoría
  const [selCategorDis, setSelCategorDis]   = useState <boolean>(true);
  //State Lista campo Subcategoría
  const [subCategorLst, setSubCategorLst]   = useState ([]);
  //State Control Subcategoría
  const [selSubCategorVal, setSelSubCategorVal]= useState <number>();
  //State asociado a Estado control Subcategoría
  const [selSubCategorDis, setSelSubCategorDis]= useState <boolean>(true);
  //State Lista campo Nombre
  const [nombAmbLst, setNomAmbLst]          = useState ([]);
  //State Control Nombre
  const [selNombAmbVal, setSelNombAmbVal]   = useState <string>();
  //State asociado a Estado control Nombre
  const [selNombAmbDis, setSelNombAmbDis]   = useState <boolean>(true);
  //State Lista campo Año
  const [anioAmbLst, setAnioAmbLst]         = useState ([]);
  //State Control Año
  const [selAnioAmbVal, setSelAnioAmbVal]   = useState <number>();
  //State asociado a Estado control Año
  const [selAnioAmbDis, setSelAnioAmbDis]   = useState <boolean>(true);
  //State Lista campo Municipio
  const [mpioLst, setMpioLst]               = useState ([]);
  //State Control Municipio
  const [selMpioVal, setSelMpioVal]         = useState <string>();
  //State asociado a Estado control Municipio
  const [selMpioDis, setSelMpioDis]         = useState <boolean>(true);
  //State Fecha inicio
  const [txtFecIniVal, setTxtFecIniVal]     = useState <Date>();
  //State asociado a Estado campo Fecha inicio
  const [txtFecIniDis, setTxtFecIniDis]     = useState <boolean>(true);
  //State Fecha fin
  const [txtFecFinVal, setTxtFecFinVal]     = useState <string>();
  //State asociado a Estado campo Fecha fin
  const [txtFecFinDis, setTxtFecFinDis]     = useState <boolean>(true);
  //Opciones de la botonera
  //State Opc Limpiar
  const [btnLimpiaDis, setBtnLimpiaDis]     = useState <boolean>(false);
  //State Opc Buscar
  const [btnSrchDis, setBtnSrchDis]         = useState <boolean>(false);
  //Mapa
  const [jimuMapView, setJimuMapView]       = useState<JimuMapView>(); 
    
  //Extent Map
  const [view, setView]                     = useState(null);

  //Sección hooks

  //Sección render
  return (
    <div className="widget-demo jimu-widget m-2">
      <FilterAmb
        visible         = {visible}
        setVisibleState = {setVisible}
        areaLst         = {areaLst}
        setAreaLstState = {setAreaLst}
        selAreaVal      = {selAreaVal}
        setSelAreaValState={setSelAreaVal}
        selAreaDis      = {selAreaDis}
        setAreaDisState = {setSelAreaDis}
        tematicaLst     = {tematicaLst}
        setTematicaLstState={setTematicaLst}
        selTematicaVal  = {selTematicaVal}
        setSelTematicaValState={setSelTematicaVal}
        selTematicaDis  = {selTematicaDis}
        setSelTematicaDisState = {setSelTematicaDis}
        categorLst      = {categorLst}
        setCategorLstState={setCategorLst}
        selCategorVal   = {selCategorVal}
        setCategorValState={setSelCategorVal}
        selCategorDis   = {selCategorDis}
        setSelCategorDisState = {setSelCategorDis}
        subCategorLst   = {subCategorLst}
        setSubCategorLstState={setSubCategorLst}
        selSubCategorVal= {selSubCategorVal}
        setSelSubCategorValState={setSelSubCategorVal}
        selSubCategorDis= {selSubCategorDis}
        setSelSubCategorDisState= {setSelSubCategorDis}
        nomAmbLst       = {nombAmbLst}
        setNomAmbLstState={setNomAmbLst}
        selNomAmbVal    = {selNombAmbVal}
        setSelNomAmbValState= {setSelNombAmbVal}
        selNomAmbDis    = {selNombAmbDis}
        setSelNomAmbDisState= {setSelNombAmbDis}
        anioAmbLst      = {anioAmbLst}
        setAnioAmbLstState  = {setAnioAmbLst}
        selAnioAmbVal   = {selAnioAmbVal}
        setSelAnioAmbValState={setSelAnioAmbVal}
        selAnioAmbDis   = {selAnioAmbDis}
        setSelAnioAmbDisState={setSelAnioAmbDis}
        mpioAmbLst      = {mpioLst}
        setMpioAmbLstState={setMpioLst}
        selMpioAmbVal   = {selMpioVal}
        setSelMpioAmbValState={setSelMpioVal}
        selMpioAmbDis   = {selMpioDis}
        setSelMpioAmbDisState={setSelMpioDis}
        txtFecIniVal    = {txtFecIniVal}
        setTxtFecIniValState= {setTxtFecIniVal}
        txtFecIniDis    = {txtFecIniDis}
        setTxtFecIniDisState= {setTxtFecIniDis}
        txtFecFinVal    = {txtFecFinVal}
        setTxtFecFinValState={setTxtFecFinVal}
        txtFecFinDis    = {txtFecFinDis}
        setTxtFecFinDisState= {setTxtFecFinDis}
        btnLimpiaDis    = {btnLimpiaDis}
        setBtnLimpiaDisState={setBtnLimpiaDis}
        btnSrchDis      = {btnSrchDis}
        setBtnSrchDisState={setBtnSrchDis}
      ></FilterAmb>
    </div>
  )
}

export default Widget
