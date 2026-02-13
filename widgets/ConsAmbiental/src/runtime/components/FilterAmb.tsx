
/**
 * Sección importación componente FilterAmb
 * @date 2026-02-10
 * @author IGAC - DIP
 * @dateUpdated 2026-02-11
 * @changes Importar componente DatePicker
 * @dateUpdated 2026-02-12
 * @changes Importar Endpoints servicios
 **/

import React, { useEffect } from 'react';
import { Button, Input, Label, Radio, Select, TextInput, FloatingPanel } from 'jimu-ui';
//Componente DatePicker
import { DatePicker } from 'jimu-ui/basic/date-picker';

import { appActions } from 'jimu-core';

//Endpoint servicios
import { urls } from '../../../../API/servicios';

/**
 * Componente para definición de filtros asociados al widget
 * @date 2026-02-10
 * @author IGAC - DIP
 * @param visible
 * @param setVisibleState
 * @dateUpdated 2026-02-11
 * @changes inclusión param visible
 * @changes inclusión param setVisibleState
 * @changes inclusión param areaLst
 * @changes inclusión param setAreaLstState
 * @changes inclusión param selAreaVal
 * @changes inclusión param setSelAreaValState
 * @changes inclusión param selAreaDis
 * @changes inclusión param setAreaDisState
 * @changes inclusión param tematicaLst
 * @changes inclusión param setTematicaLstState
 * @changes inclusión param selTematicaVal
 * @changes inclusión param setSelTematicaValState
 * @changes inclusión param selTematicaDis
 * @changes inclusión param setSelTematicaDisState
 * @changes inclusión param categorLst
 * @changes inclusión param setCategorLstState
 * @changes inclusión param selCategorVal
 * @changes inclusión param setCategorValState
 * @changes inclusión param selCategorDis
 * @changes inclusión param setSelCategorDisState
 * @changes inclusión param subCategorLst
 * @changes inclusión param setSubCategorLstState
 * @changes inclusión param selSubCategorVal
 * @changes inclusión param setSelSubCategorValState
 * @changes inclusión param selSubCategorDis
 * @changes inclusión param setSelSubCategorDisState
 * @changes inclusión param nomAmbLst
 * @changes inclusión param setNomAmbLstState
 * @changes inclusión param selNomAmbVal
 * @changes inclusión param setSelNomAmbValState
 * @changes inclusión param selNomAmbDis
 * @changes inclusión param setSelNomAmbDisState
 * @changes inclusión param anioAmbLst
 * @changes inclusión param setAnioAmbLstState
 * @changes inclusión param selAnioAmbVal
 * @changes inclusión param setSelAnioAmbValState
 * @changes inclusión param selAnioAmbDis
 * @changes inclusión param setSelAnioAmbDisState
 * @changes inclusión param mpioAmbLst
 * @changes inclusión param setMpioAmbLstState
 * @changes inclusión param selMpioAmbVal
 * @changes inclusión param setSelMpioAmbValState
 * @changes inclusión param selMpioAmbDis
 * @changes inclusión param setSelMpioAmbDisState
 * @changes inclusión param txtFecIniVal
 * @changes inclusión param setTxtFecIniValState
 * @changes inclusión param txtFecIniDis
 * @changes inclusión param setTxtFecIniDisState
 * @changes inclusión param txtFecFinVal
 * @changes inclusión param setTxtFecFinValState
 * @changes inclusión param txtFecFinDis
 * @changes inclusión param setTxtFecFinDisState
 * @changes inclusión param btnLimpiaDis
 * @changes inclusión param setBtnLimpiaDisState
 * @changes inclusión param btnSrchDis
 * @changes inclusión param setBtnSrchDisState
 * @dateUpdated 2026-02-12
 * @changes Ocultamieno campo Temática
 * @remarks Listado de propiedades enviadas desde el componente maestro
 * @remarks Pruebas con componente FloatingPanel desde jimu-ui
 * @remarks Fuente consulta Claude AI => https://claude.ai/chat/8298f344-84ec-44b9-b0bc-cb8328f56e40
 */

const FilterAmb = function ({visible, setVisibleState, areaLst, setAreaLstState, selAreaVal, setSelAreaValState, selAreaDis, setAreaDisState, tematicaLst, setTematicaLstState, selTematicaVal, setSelTematicaValState, selTematicaDis, setSelTematicaDisState, categorLst, setCategorLstState, selCategorVal, setCategorValState, selCategorDis, setSelCategorDisState, subCategorLst, setSubCategorLstState, selSubCategorVal, setSelSubCategorValState, selSubCategorDis, setSelSubCategorDisState, nomAmbLst, setNomAmbLstState, selNomAmbVal, setSelNomAmbValState, selNomAmbDis, setSelNomAmbDisState, anioAmbLst, setAnioAmbLstState, selAnioAmbVal, setSelAnioAmbValState, selAnioAmbDis, setSelAnioAmbDisState, mpioAmbLst, setMpioAmbLstState, selMpioAmbVal, setSelMpioAmbValState, selMpioAmbDis, setSelMpioAmbDisState, txtFecIniVal, setTxtFecIniValState, txtFecIniDis, setTxtFecIniDisState, txtFecFinVal, setTxtFecFinValState, txtFecFinDis, setTxtFecFinDisState, btnLimpiaDis, setBtnLimpiaDisState, btnSrchDis, setBtnSrchDisState}){

    //Sección métodos
    /**
     * Método getAreaJSON => Obtener registros campo Área
     * @date 2026-02-12
     * @author IGAC - DIP
     * @remarks Invocado a través del hook useEffect asociado al objeto areaLst
     * @remarks Parametrización objeto JSON (OJO, pasar al archivo de parametrización)
     */
    const getAreaJSON = function (){
        //Objetos locales
        var areaObj: Object = {};
        areaObj =   [
        {
            "idArea": 1,
            "area": "Quindio"
        },
        {
            "idArea": 2,
            "area": "Cuenca del Río La Vieja"
        }]
        //console.log("Array prueba =>",areaObj);
        //Seteo en el state
        setAreaLstState (areaObj);
    }

    /**
     * Método getCategorJSON => Obtener registros campo Categoria
     * @date 2026-02-12
     * @author IGAC - DIP
     * @remarks Parametrización objeto JSON (OJO, pasar al archivo de parametrización)
     */
    const getCategorJSON = function () {
        //Objetos locales
        var categorObj: Object = {};
        categorObj =   [
        {
            "idCategor": 1,
            "categor": "Estaciones"
        },
        {
            "idCategor": 2,
            "categor": "Puntos de calidad"
        },
        {
            "idCategor": 3,
            "categor": "Tramites ambientales"
        },
        {
            "idCategor": 4,
            "categor": "Tramites ambientales predios"
        },
        {
            "idCategor": 5,
            "categor": "Predios de reforestación"
        }];
        console.log("Categorias tst =>",categorObj);
        //Seteo en el state
        setCategorLstState (categorObj);
    }

    /**
     * Consulta de subcategorias asociadas
     * @date 2026-02-13
     * @author IGAC - DIP
     * @remarks Por contengencia del servidor SIGQUINDIO, se realiza ejercicio con data registrada en src para dos categorias (2026-02-13)
     */
    const getSubCategorJSON = function (Categor: string = "", idCategor: number = -1){
         //Objetos locales
         //Validación de acuerdo al parámetro especificado
         //Toma del parámetro Categor
         if (typeof Categor !== 'undefined' && idCategor === -1){
            switch (Categor){
                case "": {
                    break;
                }
                case "": {
                    break;
                }
            }
         }

        //switch 
    }

    /**
     * Método para evaluar la fecha inicial sea menor o igual a la fecha final
     * @date 2026-02-12
     * @author IGAC - DIP
     * @param fecha
     * @remarks FUENTE consulta: Claude AI => https://claude.ai/chat/a65c215c-6a44-4b8e-9125-98cdb2b41020 
     */

    const handleFechaIniChange = function (fecha: Date){
        setTxtFecIniValState(fecha);
          // Si la nueva fecha inicio es mayor que la fecha fin, ajustar
          if (fecha > txtFecFinVal) {
            setTxtFecFinValState (fecha);
          }
    }
    /**
     * Método para evaluar la fecha final sea mayor o igual a la fecha inicial
     * @date 2026-02-12
     * @author IGAC - DIP
     * @param fecha 
     */
    /* const handleFechaFinChange = function (fecha: Date){
        if (fecha >= txtFecIniVal){
            setTxtFecFinValState (fecha);
        }
        else{
            setTxtFecFinValState (txtFecIniVal);
        }
    } */

    /**
     * Evento handleSelAreaChange => Evento que modifica campo Área, al seleccionar un item del control
     * @date 2026-02-12
     * @author IGAC - DIP
     * @param {Event} evt
     */
    const handleSelAreaChange = function(evt){
        //Objetos Locales
        console.log ("Valor Área selecc =>", evt.target.value);
        console.log ("Text Área selecc =>", evt.nativeEvent.target.textContent);
        //Habilitar campo Categoria (disabled en false)
        setSelCategorDisState (false);
        //Limpiar campo categoria
        categorLst.length = 0;
        setCategorLstState(undefined);
        //Poblar campo Categoria
        getCategorJSON ();
    }

    /**
     * Evento que modifica campo Categoría, al seleccionar un item del control
     * @date 2026-02-12
     * @author IGAC - DIP
     * @param {Event} evt 
     */
    const handleSelCategorChange = async function(evt){
        //Objetos Locales
        var categorTxtVal:string  =     evt.nativeEvent.target.textContent;
        switch (categorTxtVal){
            case 'Predios de reforestación':{
                //Habilitación campo Municipio (disabled en false)
                setSelMpioAmbDisState (false);
                //Verificación URL consumo
                //console.log ("URL consumo municipios =>",urls.Municipios);
                getJSONMpio ();
                break;
            }
            case 'Tramites ambientales':{                
                //Habilitar control SubCategoria
                setSelSubCategorDisState (false);
                //Crear listados
                getSubCategorJSON (categorTxtVal, -1);
                break;
            }
            default: {
                //deshabilitación campo Municipio (disabled en true)
                setSelMpioAmbDisState (true);
            }
        }
    }

    /**
     * Método para construcción de la cláusula WHERE asociado al servicio de firmas espectrales.
     * @date 2025-04-16
     * @author IGAC - DIP
     * @param OutFields = '*'
     * @param url
     * @param returnGeometry = false
     * @param where = '1=1'
     * @param inputGeometry
     * @param geometryType
     * @param insr
     * @param spatialRel
     * @param outSR
	 * @remarks Tomado del proyecto SIEC (Firmas espectrales)
	 */
    const getWhere = async function(
        OutFields='*',
        url,
        returnGeometry=false,
        where='',
        outStatistics ='',
        groupByFieldsForStatistics='',
        inputGeometry='',
        geometryType='',
        insr='',
        spatialRel='',
        outSR='' 
    ) {
        //console.log("Ingreso...");
        var finalUrl: string;
        const controller= new AbortController();    
        try {
            // Construcción de parámetros base
            const baseParams = new URLSearchParams({
            where: where,
            returnGeometry: returnGeometry.toString(),
            f: 'pjson'
            });
            
            // Adición parámetros adicionales según el tipo de consulta
            if (inputGeometry && inputGeometry.length > 0){
                baseParams.append('geometry', inputGeometry.toString());
            }
            if (geometryType && geometryType.length > 0){
                baseParams.append('geometryType', geometryType.toString());
            }
            if (insr && insr.length > 0){
                baseParams.append('inSR', insr.toString());
            }
            if (spatialRel && spatialRel.length > 0){
                baseParams.append('spatialRel', spatialRel.toString());
            }
            if (outSR && outSR.length > 0)
            {
                baseParams.append('outSR',outSR.toString()); 
            }
            
            // Agregar parámetros específicos según el tipo de consulta
            if (outStatistics && outStatistics.length > 0) {
                baseParams.append('groupByFieldsForStatistics', groupByFieldsForStatistics);
                baseParams.append('outStatistics', outStatistics);
            }
            else if (OutFields) {
                baseParams.append('outFields', OutFields);
            }          
            else {
                throw new Error('Debe proporcionar OutFields o outStatistics o inputGeometry o Input Spatial Reference o Spatial Relationship');
            }
            // Construir URL final
            finalUrl = `${url}/query?${baseParams.toString()}`;
            //console.log("=>",finalUrl);
            return finalUrl.toString();
        }
        catch (error)
        {
            console.error('Error en realizarConsulta:', error);
            throw error;
        }
    }

    /**
     * getJSONMpio => Método para obtener lista de municipios, conocido el identificador del departamento, dado en control Departamento
     * @date 2026-02-12
     * @author IGAC - DIP
     * @param {number} idDpto (opc)
     * @dateUpdated 2026-02-13
     * @changes Reformulación URL consumo servicio municipios
     * @remarks Tomado del proyecto SIEC (Firmas espectrales)
     */
    const getJSONMpio = async function (idDpto = "")
    {
        //Objetos locales
        var critSeleccDpto, urlDivipolaMpios: string = "";
        //Cargue id del control Departamento
        //console.log ("ID Dpto asociado =>",idDpto);

        //Cargue listado municipios con departamento asociado a su identificador
        //console.log ("URL consumo municipios con params =>",await (getWhere ('IDMUNICIPIO, NOMBRE', urls.Municipios, false, '1=1', '', '', '', '', '', '', '')));
        if (idDpto.length === 0){
            critSeleccDpto  = "1=1";
        }
        else{
            critSeleccDpto  = "coddepto="+idDpto.toString();
        }
        urlDivipolaMpios = await getWhere('IDMUNICIPIO, NOMBRE', urls['CARTOGRAFIA']['BASE']+'/'+urls['CARTOGRAFIA']['MUNICIPIOS'], false, critSeleccDpto, '', '', '', '', '', '', '');
        console.log ("URL consumo Mpios Map Server =>",urlDivipolaMpios);

        //Activar estado cargando lista de municipíos
	    //setIsLoadState(true);
        //Invocación al servicio en try .. catch
	    try{
            await fetch(urlDivipolaMpios, {
                method:"GET"
            })
            .then ((mpiosServer) => {
            var jsonErr: any = {};
            if (!mpiosServer.ok)
            {           
                jsonErr = {
                "error": mpiosServer.status,
                "errorMsg": mpiosServer.statusText
                }
                return jsonErr;
            }
            //Validador consumo por error del server (cód http <> 200 )
            else if (typeof (mpiosServer["error"]) !== 'undefined'){
                jsonErr = {
                "errorCode": mpiosServer["error"].code,
                "errorMsg": mpiosServer["error"].message
                }
                console.error("Error Obteniendo lista departamentos del server =>" ,jsonErr["errorMsg"])+" "+"("+"código http =>"+jsonErr["errorCode"]+")";
                throw jsonErr["errorMsg"]+" "+"("+"código http =>"+" "+jsonErr["errorCode"]+")";
            }
            const jsonMpios = mpiosServer.json();
            return jsonMpios;
            })
            .then ((mpiosDataLst) => {
            //Objeto local
            var jsonMpios: any = {};
            //Validador consumo por error del server (cód http <> 200 )
            if (typeof (mpiosDataLst["error"]) !== 'undefined'){
                jsonMpios = {
                "errorCode": mpiosDataLst["error"].code,
                "errorMsg": mpiosDataLst["error"].message,
                "errorMsgDet": mpiosDataLst["error"].details[0]
                }
                console.error("Error obteniendo data del server =>" ,jsonMpios["errorMsg"])+" "+"("+"código http =>"+jsonMpios["errorCode"]+")";
                throw jsonMpios["errorMsg"]+" "+"("+"código http =>"+" "+jsonMpios["errorCode"]+")";
            }
            //Desactivar modo cargando
            //setIsLoadState(false);
            //console.log("Mpios Lst para combo =>",mpiosDataLst.features);
            
            //Mapeo de los atributos desde el objeto consumido del servidor
            const lstMpio =   mpiosDataLst.features.map ((mpioItem) => (
                {
                    idMpio:  String (mpioItem.attributes.IDMUNICIPIO),
                    nomMpio:  (mpioItem.attributes.NOMBRE)
                }
            ))

            console.log("Mpios List =>", sortMpios (lstMpio));
            //Al state 
            setMpioAmbLstState (sortMpios (lstMpio));
            })
        }
        catch (error)
        {
            console.log("Error obteniendo municipios del server =>", error);
            throw error;
        }
    }

    /**
     * sortMpios => Método para ordenamiento de municipios
     * @date 2026-02-12
     * @author IGAC - DIP
     * @param {object} obj 
     * @param {string} order 
     * @returns {object}
     * @reamrks campo nombre municipio NOMBRE
     * @remarks FUENTE consulta: Claude AI => https://claude.ai/chat/aa4f51f7-1b86-43ff-9524-8a646e5566bd
     * @remarks Tomado del proyecto SIEC (Firmas espectrales)
     * @remarks Colocar centralizado en utilidades (definir con Equipo trabajo)
     * @remarks Por ajustar en proyecto, con atributo nomMpio
     */
    const sortMpios = function (obj, order = 'asc'){
        //Objetos locales
        const sortedObj = [...obj].sort ((a, b) => order === 'asc' ? a.nomMpio.localeCompare (b.nomMpio): b.nomMpio.localeCompare (a.nomMpio));
        return sortedObj; 
      }

    //Sección Hooks
    /**
     * Hook que ejecuta el cargue campo Area
     * @date 2026-02-12
     * @author IGAC - DIP
     * @remarks Actualización state objeto areaLst
     */
    useEffect (function(){
        console.log("Ingresando a Hook...");
        if (areaLst.length == 0)
        {
            getAreaJSON();
        }
    },[areaLst]);

   

    //Sección renderizado
    return (
         <form>
            <div className="mb-1">
                <Label size="default">&Aacute;rea</Label>
                <Select 
                    placeholder="Seleccione"
                    value={selAreaVal}
                    onChange={handleSelAreaChange}
                >
                {
                    areaLst.map ((areaItem) => 
                        <option value={areaItem.idArea}>{areaItem.area}</option>
                    )
                }
                </Select>
            </div>
            <div className="mb-1" style={{'display': 'none'}}>
                <Label size="default">Tem&aacute;tica</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selTematicaDis}
                    value={selTematicaVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Categor&iacute;a</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selCategorDis}
                    value={selCategorVal}
                    onChange={(evt) => handleSelCategorChange (evt)}
                >
                {
                    categorLst.map ((categorItem) => 
                        <option value={categorItem.idCategor}>{categorItem.categor}</option>
                    )
                }
                </Select>
            </div>
            <div className="mb-1">
                <Label size="default">SubCategor&iacute;a</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selSubCategorDis}
                    value={selSubCategorVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Nombre</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selNomAmbDis}
                    value={selNomAmbVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">A&ntilde;o</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selAnioAmbDis}
                    value={selAnioAmbVal}
                ></Select>
            </div>
            <div className="mb-1">
                <Label size="default">Municipio</Label>
                <Select 
                    placeholder="Seleccione"
                    disabled={selMpioAmbDis}
                    value={selMpioAmbVal}
                >
                {
                    mpioAmbLst.map ((mpioItem) => 
                        <option key={mpioItem.idMpio} value={mpioItem.idMpio}>{mpioItem.nomMpio}</option>
                    )
                }
                </Select>
            </div>
            <div className="mb-1">
                <Label size="default">Fecha inicio</Label>
                {/*<Input 
                    placeholder='Especifique fecha'
                    disabled={txtFecIniDis}
                    value={txtFecIniVal}
                >
                </Input>*/
                }
                <DatePicker
                    selectedDate={txtFecIniVal}
                    onChange={(fecIn) => handleFechaIniChange (fecIn)}
                    format="yyyy-MM-dd"
                    showQuickNavToToday
                ></DatePicker>
            </div>
            <div className="mb-1">
                <Label size="default">Fecha fin</Label>
                {
                /*<Input 
                    placeholder='Especifique fecha'
                    disabled={txtFecFinDis}
                    value={txtFecFinVal}
                >
                </Input>*/
                }
                <DatePicker
                    selectedDate={txtFecFinVal}
                    onChange={(FecF) => {
                        setTxtFecFinValState (FecF);
                    }}
                    format="yyyyMMdd"
                    minDate={txtFecIniVal}
                ></DatePicker>
                
            </div>
            {/* Sección botonera*/}
            <div className="btnsContner">
                <Button                           
                    size="default"
                    type="default"
                    disabled={btnLimpiaDis}
                    className="btns"
                >Limpiar
                </Button>
                <Button
                    htmlType="submit"              
                    size="default"
                    type="default"
                    disabled={btnSrchDis}
                    className="btns"
                >Buscar</Button>
            </div>
        </form>
    
    )
}
export default FilterAmb;