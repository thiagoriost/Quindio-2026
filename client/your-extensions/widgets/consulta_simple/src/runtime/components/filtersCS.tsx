
import React, { useEffect, useState } from 'react';
import { Button, Label, Select, TextInput } from 'jimu-ui'; // import components

//Importación interfaces
import { typeMSM } from '../../types/interfaceResponseConsultaSimple';

//Importación API
import { urls } from '../../../../api/servicios'; 

/**
 * Componente FiltersCS => Componente que asocia los filtros del widget Consulta Simple
 * @date 2024-06-24
 * @author IGAC - DIP
 * @param param0 
 * @returns (HTML)
 */
const FiltersCS = function({jsonSERV, setJsonSERV, temas, setTemas, subtemas, setSubtemas, capas, setCapas, urlCapa, setUrlCapa, grupos,
  setGrupos, capasAttr, setCapasAttr, txtValorState, setValorState, txtValor, setValor, selTema, setselTema, selSubtema, setselSubtema,
  selGrupo, setselGrupo, selCapas, setselCapas, selAttr, setselAttr, ResponseConsultaSimple, setResponseConsultaSimple, view, setView,
  jimuMapView, lastGeometriDeployed, condic, setCond, setRenderMap, setAlertDial, mensModal, setMensModal, setIsLoading}){
 

  
    /**
    Cargue del contenido alusivo a las temáticas, subtemáticas, grupos y capas desde el servidor de contenidos
    @date 2024-05-22
    @author IGAC - DIP
    @param (String) urlServicioTOC => URL de acceso al servidor que proporciona la data de temas, subtemas, grupos y capas
    @dateUpdated 2024-06-11
    @changes adición término async
    @dateUpdated 2024-06-17
    @changes Corrección URL reemplazo término CartografiaBasica_5000 => Ambiental_T_Ajustado (En prueba)
    @dateUpdated 2024-06-27
    @changes Importación URL consumo en objeto urlServicioTOC desde servicios.ts (widgets/api)
    @return (String)
    @remarks FUENTE: https://www.freecodecamp.org/news/how-to-fetch-api-data-in-react/
  */
    async function getJSONContenido(jsonSERV)
    {
      const urlServicioTOC = urls.tablaContenido;
      
      var nombreServicio, idTematica, idCapaMapa, idCapaDeServicio, nombreTematica, tituloCapa, urlMetadatoCapa, url: string;
      var idTematicaPadre: any;
      var visible: Boolean;
      var existeTematica: [];
      var newTematica, newCapa: object;
      
      fetch(urlServicioTOC,{
        method:"GET"
      })
      .then((rows) => rows.json())
      .then((data) => {
        for (var cont = 0; cont < data.length; cont++)
        {
          nombreServicio= data[cont].DESCRIPCIONSERVICIO;
          idTematica    = data[cont].IDTEMATICA + 't';
          idCapaMapa    = data[cont].IDCAPA + 'c';
          nombreTematica= data[cont].NOMBRETEMATICA;
          tituloCapa    = data[cont].TITULOCAPA;
          idTematicaPadre= data[cont].IDTEMATICAPADRE;
          visible        = data[cont].VISIBLE;
          url            = data[cont].URL;
          idCapaDeServicio= data[cont].NOMBRECAPA;
          urlMetadatoCapa = data[cont].METADATOCAPA;
  
          if (!idTematicaPadre) {
              idTematicaPadre = "#";
          } else {
              idTematicaPadre = idTematicaPadre + 't';
          }
  
          existeTematica = where(jsonSERV, { 'id': idTematica });
  
          //Cadena JSON de temática
          newTematica = {
            "id": idTematica,
            "text": nombreTematica,
            "type": "tematica",
            "parent": idTematicaPadre
          };
  
          //Cadena JSON de Capa
          newCapa = {
              "id": idCapaMapa.replace("c", ""),
              "idCapaMapa": idCapaMapa,
              "text": tituloCapa,
              "type": "capa",
              "parent": idTematica,
              //"url": url + "/" + idCapaDeServicio,
              "url": url.replace("CartografiaBasica_5000","Ambiental_T_Ajustado") + "/" + idCapaDeServicio,
              "idCapaDeServicio": idCapaDeServicio,
              "urlMetadatoCapa": urlMetadatoCapa
          };
          if (existeTematica.length !== 0) {
            jsonSERV.push(newCapa);
          }
          else {
            jsonSERV.push(newTematica);
            if (data[cont].IDCAPA) {
                jsonSERV.push(newCapa);
            }
          }
        }
        //if (utilsModule?.logger()) console.log("Contenido json SERV en petición =>", jsonSERV);
  
        //Invocación al método para obtener la información sobre el campo Temas
        if (jsonSERV != undefined) {          
          setJsonSERV(jsonSERV);
          getTemas(jsonSERV);
        }    
      })
    }


      
    /* Implementación de la función alterna _.where
      @date 2024-05-22
      @author IGAC - DIP
      @param (Array) array: Array de búsqueda
      @param (Object) object: Criterio para ser buscado como un objeto
      @returns (Array) Elemento del array que se busca
      @remarks método obtenido de Internet (https://stackoverflow.com/questions/58823625/underscore-where-es6-typescript-alternative)
    */
    function where(array, object) {
      let keys = Object.keys(object);
      return array.filter(item => keys.every(key => item[key] === object[key]));
    }

    /** Método getTemas()=> obtiene temáticas desde el objeto jsonData
      @date 2024-05-22
      @author IGAC - DIP
      @param (JSON) jsonData: Estructura organizada en formato JSON, desde el servidor que proporciona la data de temas, subtemas, grupos y capas
      @return (Object) setTemas: Estructura de datos correspondiente a los temas desde el arreglo opcArr
    */

    function getTemas(jsonData)
    {
      var opcArr = [];
      var tipoRegistro, nodoPadre, urlServ, descrip: string;
      var idTema = -1;
        for (var cont = 0; cont < jsonData.length; cont++) {
            tipoRegistro = jsonData[cont].type;
            nodoPadre = jsonData[cont].parent;
            idTema = jsonData[cont].id;
            urlServ = jsonData[cont].url;
            descrip = jsonData[cont].text.toUpperCase();

            //Cargue de los tipos "tematica" con el nodo padre (nodoPadre) identificados con '#'
            if (nodoPadre == '#' && tipoRegistro == 'tematica') {            
                opcArr.push({
                    "value": idTema,
                    "label": descrip
                });
            }
        }
        //if (utilsModule?.logger()) console.log("Lista Temas =>", opcArr);      
        setTemas(opcArr);
    }
    
    /** 
      Método getSubtemas => Obtener lista de subtemas, según el tema seleccionado en el control Tema
      @date 2023-05-23
      @author IGAC - DIP
      @param (Object) temas asocia el control con el tema seleccionado
      @dateUpdated 2024-05-27
      @changes Al cambiar tema, borrar valores campos Atributo y Valor
      @dateUpdated 2024-05-28
      @changes Actualizar estado de selección Tema
      @changes Fix selección items campo Subtema
      @changes Fix selección items campo Capa
      @dateUpdated 2024-06-27
      @changes Validación borrado objeto capasArr, con el fin de no generar duplicados en el campo Capa
      @return (Object) setSubtemas: Estructura de datos correspondiente a los subtemas
    */
    function getSubtemas(temas)
    {
      var idParent: number= -1;
      var type: string    = "";
      var jsonSubtemas: any = "";
      var jsonCapas: any = "";
      var subtemasArr: Array<string> = [];
      var capasArr: Array<string> = []; 

      const idPRoc    = parseInt(temas.target.value);
      if (utilsModule?.logger()) console.log("Tema value =>", parseInt(temas.target.value));
      if (utilsModule?.logger()) console.log("Array Admin Serv JSON =>",jsonSERV);

      //Inicialización de controles
      setselTema(temas.target.value); //Tema: Seleccionando el item del control
      
      setSubtemas([]);  //Subtema
      setGrupos([]);    //Grupo
      setCapas([]);     //Capa
      setCapasAttr([]); //Atributo
      setValor("");     //Valor
      setValorState(true);//Valor al actualizarlo el usuario            
      //Validación de inicialización array local
      if (utilsModule?.logger()) console.log("Longitud array capas =>",capasArr.length);
      if (capasArr.length > 0)
      {
        capasArr.length = 0;
      }
      for (var cont = 0; cont < jsonSERV.length; cont++) {
        idParent  = parseInt(jsonSERV[cont].parent);
        type      = jsonSERV[cont].type;
        //Búsqueda de subtemas
        if (idParent == idPRoc && type == 'tematica'){
          jsonSubtemas = {
            "idTematica": parseInt(jsonSERV[cont].id),
            "nombreTematica": jsonSERV[cont].text
          };
          subtemasArr.push(jsonSubtemas);
        }
        //Búsqueda de capas
        else if (idParent == idPRoc && type == 'capa' && parseInt(jsonSERV[cont].id) !== 0) {
          jsonCapas = {
              "idCapa": parseInt(jsonSERV[cont].id),
              "nombreCapa": jsonSERV[cont].text,
              "urlCapa": jsonSERV[cont].url
          };
          capasArr.push(jsonCapas);
        }
      }
      
      //Procesar para remover duplicados
      if (utilsModule?.logger()) console.log("Sin duplic prueba =>",procesaDuplic(capasArr));

      //Cargue de subtemas, cuando se conoce tema
      if (subtemasArr.length >= 0)
      {
        if (utilsModule?.logger()) console.log("Subtemas Array=>", subtemasArr);        
        setselSubtema(undefined);
        setSubtemas(subtemasArr);
      }
      //Cargue de capas de un tema, cuando éste no tiene subtemas
      if (capasArr.length >= 0)
      {        
        if (utilsModule?.logger()) console.log("Capas Array Sin duplic =>", capasArr);
        setselCapas(undefined);
        //Procesar para remover duplicados
        setCapas(procesaDuplic(capasArr));
      }
      
    }
    /**
     * método procesaDuplic => Verifica unicidad de elementos en un array tipo JSON
     * @param (Array) capasArr => Array con items duplicados
     * @date 2024-06-27
     * @author IGAC - DIP
     * @returns (Array) Array JSON sin items duplicados
     * @remarks método obtenido desde URL https://www.geeksforgeeks.org/how-to-remove-duplicates-in-json-array-javascript/
     */
    
    function procesaDuplic(capasArr){
      let newCapasArr = [];
      newCapasArr = capasArr.filter((obj, index, self) =>
      index === self.findIndex((t) => (
          t.idCapa === obj.idCapa && t.nombreCapa === obj.nombreCapa && t.urlCapa === obj.urlCapa
      )));
      return newCapasArr; 
  }
    /**
      Método getGrupoOrCapa => Método para obtener grupo (temáticas de las subtemáticas) y/o capas conocido subtema
      @date 2023-05-23
      @author IGAC - DIP
      @param (Object) subtemas: control Subtema
      @dateUpdated 2024-05-27
      @changes Al cambiar tema, borrar valores campos Atributo y Valor
      @dateUpdated 2024-05-28
      @changes Deseleccionar opciones en campo Grupo
      @changes Deseleccionar opciones en campo Capa
      @dateUpdated 2024-06-17
      @changes Limpieza capas mapa, al cambiar tema (sección Inicialización de mapa)
      @dateUpdated 2024-06-19
      @changes Activar asignación del objeto selSubtema
      @dateUpdated 2024-06-27
      @changes Validación borrado objeto capasArr, con el fin de no generar duplicados en el campo Capa
      @changes Llamado método procesaDuplic() para complementar requerimiento anterior
    */
      function getGrupoOrCapa(subtemas){
      
        var idParent: number= -1;
        var type: string    = "";
        var jsonSubtemas: any = "";
        var jsonCapas: any = "";
        var subtemasArr: Array<string> = [];
        var capasArr: Array<string> = []; 
  
        const idPRoc    = parseInt(subtemas.target.value);
  
        if (utilsModule?.logger()) console.log("Subtema asociado =>",idPRoc);
  
        //Inicialización controles
        setselSubtema(idPRoc);
        setCapasAttr([]);
        setValor("");
        setValorState(true);
  
        //Inicialización de mapa
        limpiarCapaMapa();

        //Validación de inicialización array local
        if (utilsModule?.logger()) console.log("Longitud array capas =>",capasArr.length);
        if (capasArr.length > 0)
        {
          capasArr.length = 0;
        }
              
        for (var cont = 0; cont < jsonSERV.length; cont++) {
          idParent  = parseInt(jsonSERV[cont].parent);
          type      = jsonSERV[cont].type;
          //Búsqueda de subtemas
          if (idParent == idPRoc && type == 'tematica'){
            jsonSubtemas = {
              "idTematica": parseInt(jsonSERV[cont].id),
              "nombreTematica": jsonSERV[cont].text
            };
            subtemasArr.push(jsonSubtemas);
          }
          //Búsqueda de capas
          else if (idParent == idPRoc && type == 'capa' && parseInt(jsonSERV[cont].id) !== 0) {
            jsonCapas = {
                "idCapa": parseInt(jsonSERV[cont].id),
                "nombreCapa": jsonSERV[cont].text,
                "urlCapa": jsonSERV[cont].url
            };
            capasArr.push(jsonCapas);
          }
        }
  
        //Cargue de subtemas, cuando se conoce subtema
        if (subtemasArr.length >= 0)
        {
          if (utilsModule?.logger()) console.log("Subtemas Array=>", subtemasArr);
          setGrupos(subtemasArr);
          setselGrupo(undefined);
        }
        //Cargue de capas de un subtema, cuando éste no tiene grupos
        if (capasArr.length >= 0)
        {
          if (utilsModule?.logger()) console.log("Capas Array Sin duplic =>", capasArr);
          setCapas(procesaDuplic(capasArr));
          setselCapas(undefined);
        }
      }

      /**
        Método getCapaByGrupo => Método para obtener capa conocido un grupo
        @date 2023-05-23
        @author IGAC - DIP
        @param (Object)
        @dateUpdated 2024-05-27
        @changes Al cambiar tema, borrar valores campos Atributo y Valor
        @dateUpdated 2024-05-28
        @changes Fix selección item campo Grupo
        @changes Deselección item campo Capa
        @dateUpdated 2024-06-17
        @changes Limpieza capas mapa, al cambiar tema (sección Inicialización de mapa)
        @dateUpdated 2024-06-27
        @changes Validación borrado objeto capasArr, con el fin de no generar duplicados en el campo Capa
        @changes Llamado método procesaDuplic() para complementar requerimiento anterior
    */
    function getCapaByGrupo(grupos)
    {
      var idParent: number= -1;
      var type: string    = "";
      var jsonSubtemas: any = "";
      var jsonCapas: any = "";
      var subtemasArr: Array<string> = [];
      var capasArr: Array<string> = []; 
      const idPRoc    = parseInt(grupos.target.value);

      if (utilsModule?.logger()) console.log("Grupo asociado =>",idPRoc);

      setselGrupo(grupos.target.value);

      //Inicialización controles asociados
      setCapasAttr([]);
      setValor("");
      setValorState(true);

      //Inicialización del mapa
      limpiarCapaMapa();

      //Validación de inicialización array local 
      if (utilsModule?.logger()) console.log("Longitud array capas =>",capasArr.length);
      if (capasArr.length > 0)
      {
        capasArr.length = 0;
      }

      for (var cont = 0; cont < jsonSERV.length; cont++) {
        idParent  = parseInt(jsonSERV[cont].parent);
        type      = jsonSERV[cont].type;
        //Búsqueda de subtemas
        if (idParent == idPRoc && type == 'tematica'){
          jsonSubtemas = {
            "idTematica": parseInt(jsonSERV[cont].id),
            "nombreTematica": jsonSERV[cont].text
          };
          subtemasArr.push(jsonSubtemas);
        }
        //Búsqueda de capas
        else if (idParent == idPRoc && type == 'capa' && parseInt(jsonSERV[cont].id) !== 0) {
          jsonCapas = {
              "idCapa": parseInt(jsonSERV[cont].id),
              "nombreCapa": jsonSERV[cont].text,
              "urlCapa": jsonSERV[cont].url
          };
          capasArr.push(jsonCapas);
        }
      }

      //Cargue de capas de un grupo
      if (capasArr.length >= 0)
      {
        if (utilsModule?.logger()) console.log("Capas Array Sin duplic =>", capasArr);
        setCapas(procesaDuplic(capasArr));
        setselCapas(undefined);
      }
    }

    /**
      getAtributosCapa => Método para obtener los atributos de una capa conocida y renderizarla en el campo Atributo
      @date 2024-05-24
      @author IGAC - DIP
      @param (Object) capa => Información de capa, desde campo Capa
      @dateUpdated 2024-05-27
      @changes Al cambiar tema, borrar valores campos Atributo y Valor
      @dateUpdated 2024-05-30
      @changes Seteo de la URL asociado al control Capa
      @dateUpdated 2024-06-17
      @changes Limpieza capas mapa, al cambiar tema (sección Inicialización de mapa)
      @dateUpdated 2024-06-19
      @changes Fix seteo valor campo Capa y UrlCapa  (setselCapas(urlCapaJson) => setselCapas(capa.target.value))
      @returns (Array) AtrCapaArr => Arreglo con atributos (name, alias)
    */
      function getAtributosCapa(capa)
      {      
        let urlCapa: string;
        let JsonAtrCapa: any =  "";
        let AtrCapaArr: any     = []; 
        let urlCapaJson: string;
        
        if (utilsModule?.logger()) console.log("Capa asociada =>",capa.target.value);
        //Construcción de la URL del servicio, a partir del identificador de capa traido desde el campo Capa
        urlCapa     = getUrlFromCapa(capa.target.value, capas);
        urlCapaJson = urlCapa+"?f=json";
        if (utilsModule?.logger()) console.log("URL capa =>",urlCapaJson);
  
        //Inicialización controles
        setCond(undefined);
        setCapasAttr([]);
        setValor("");
        setValorState(true);
        setselAttr(undefined)
        setselCapas(capa.target.value);
        setUrlCapa(urlCapaJson);
  
        //Incialización de mapa
        limpiarCapaMapa();
  
        //Realización del consumo remoto, a través de la URL del servicio dado por el atributo urlCapaJson
          fetch(urlCapaJson, {
            method:"GET"
          })
          .then((rows) => rows.json())
          .then((data) => {
            //Rearmado estructura datos de atributos: name, alias          
            for (var cont = 0; cont < data.fields.length; cont++){        
              if (data.fields[cont].name !== "shape" && data.fields[cont].name !== "elemento") {
                JsonAtrCapa = {
                  "name":data.fields[cont].name,
                  "alias":data.fields[cont].alias
                };
                AtrCapaArr.push(JsonAtrCapa);                
              }    
            }
            if (utilsModule?.logger()) console.log("Obj Attr Capas =>",AtrCapaArr);
            setCapasAttr(AtrCapaArr);
          });
      }

      /**
     * método getUrlFromCapa => Obtener la URL desde  una capa especificada en el campo Capa
     * @author IGAC - DIP
     * @date 2024-05-24
     * @param idCapa => Identificador capa 
     * @param capasArr => Arreglo de capas en formato JSON, con atributos {idCapa, nombreCapa, urlCapa}     
     * @returns (String) urlCapa => Url asociada a la capa
     */

    function getUrlFromCapa(idCapa, capasArr){
        //Recorrido por el array
        for (var cont = 0; cont < capasArr.length; cont++) {
          if (parseInt(capasArr[cont].idCapa) == parseInt(idCapa)) {
              return capasArr[cont].urlCapa;
          }
      }
        return -1;
      }

    /**
      enableValor => Método para habilitar el campo valor, cuando se selecciona un atributo, desde el campo atributo.
      @date 2024-05-27
      @author IGAC - DIP
      @dateUpdated 2024-05-31
      @changes Actualizar estado del control Atributo, para toma del valor del control
      @dateUpdated 2024-06-17
      @changes Limpieza capas mapa, al cambiar tema (sección Inicialización de mapa)
      @remarks remover estado ReadOnly
    */
    function enableValor(evt)
    {
      //State del control Valor
      setValorState(false);

      //State del control Atributo
      setselAttr(evt.target.value);

      //Inicialización de mapa
      limpiarCapaMapa();      
    }

    /*
      handleChangevalorTxt => Método para cambio de estado, en el campo Valor que permita setear contenido
      @date 2024-05-27
      @author IGAC - DIP
      @param (Object) event => objeto que representa el evento de cambui de valor en el control Valor
      @remarks FUENTE => https://www.geeksforgeeks.org/how-to-handle-input-forms-with-usestate-hook-in-react/
    */
      const handleChangevalorTxt = function (event) {
        //if (utilsModule?.logger()) console.log("Estado actual =>",txtValorState);
        setValor(event.target.value);
      }

      /**
      limpiarCons => Método para remover las opciones de los campos Temna, Subtema, Grupo, Capa, Atributo y Valor
      @date 2024-05-28
      @author IGAC - DIP
      @param (Object) evt => Analizador de eventos asociado al control Limpiar
      @dateUpdated 2024-06-12
      @changes remover capa asociada al filtro widget del mapa actualmente en desarrollo
      @dateUpdated 2024-06-17
      @changes remover capa asociada al filtro widget del mapa
      @dateUpdated 2024-06-25
      @changes Fix borrar campo Atributo del state
      @remarks Deseleccionar item en campo Tema en https://stackoverflow.com/questions/48357787/how-to-deselect-option-on-selecting-option-of-another-select-in-react
    */
    function limpiarCons(evt){
      //State del control Tema
      if (utilsModule?.logger()) console.log("Handle Evt en limpiar =>",evt.target.value);
      setselTema({selected:evt.target.value});
      setTemas(temas);
      setSubtemas([]);
      setGrupos([]);
      setCapas([]);
      setCapasAttr([]);
      setValor("");
      setValorState(true);
      setselAttr(undefined);

      //Rutina para limpiar capa del mapa
     /*  setResponseConsultaSimple(null);      
      if (utilsModule?.logger()) console.log("Obj Geometria =>",view);      
      jimuMapView.view.map.remove(view); */

      limpiarCapaMapa();
    }
    
    /**
      consultaSimple => método que realiza la consulta, seleccionando la opción Consultar
      @date 2024-05-29
      @author IGAC - DIP
      @param (event) evt
      @dateUpdated 2024-05-31
      @changes Armado de la clausula WHERE en atributo cond
      @dateUpdated 2024-06-04
      @changes Actualización clausula WHERE, adicionando el operador = y encerrando en comillas simples la expresión
      @dateUpdated 2024-06-07
      @changes Actualización parámetros
      @changes Inclusión método para no refrescar la página cuando se remite el formulario con el método submit
      @dateUpdated 2024-06-17
      @changes Fix validación filtro objeto cond
      @dateUpdated 2024-06-19
      @changes Fix parámetro selCapas => urlCapa
      @dateUpdated 2024-06-25
      @changes Inclusión validaciones campos requeridos
      @author IGAC - DIP
    */
      function consultaSimple(evt: { preventDefault: () => void; }){
        //if (utilsModule?.logger()) console.log("En pruebas...");
        setIsLoading(true)
        evt.preventDefault();
        setRenderMap(false);
        var cond = "";
       
        //Cargue valores filtros
        /* //Tema
        if (utilsModule?.logger()) console.log("Tema valor =>",selTema);
        //Subtema
        if (utilsModule?.logger()) console.log("Subtema valor =>",selSubtema);
        //Grupo
        if (utilsModule?.logger()) console.log("Grupo valor =>",selGrupo);
        //Capa
        if (utilsModule?.logger()) console.log("Capa valor =>",selCapas);
        //Atributo
        if (utilsModule?.logger()) console.log("Atributo valor =>",selAttr);   */    
  
        //Condición campos alfanuméricos
        //const cond = selAttr + "=" +"'"+txtValor+"'";
  
        //Validación prueba (2024-06-17)
        if (selAttr == "SHAPE.AREA" || selAttr == "SHAPE.LEN" || selAttr == "AREA_HA" || selAttr == "objectid"|| selAttr == "st_area(shape)"|| selAttr == "st_perimeter(shape)")
        {
          cond = selAttr + "=" +txtValor;
        }
        else
        {
          cond = selAttr + "=" +"'"+txtValor+"'";
        }
        //return tstDrawMap(urlCapa, cond);        
        if (utilsModule?.logger()) console.log("Asigna cond =>",cond);
        setCond(cond);
        if (selAttr && txtValor){
          setRenderMap(true);
        }
        else if (!txtValor)
        {          
          setValor("");
          setAlertDial(true);
        }

        //Inclusión validación campos requeridos
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
      }

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
        if (utilsModule?.logger()) console.log("Obj Geometria =>",view);      
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
     * Hook inicial para cargue del objeto jsonSERV
     * @date 2024-05-29
     * @author IGAC - DIP
     * @remarks FUENTE: https://www.pluralsight.com/resources/blog/guides/how-to-get-selected-value-from-a-mapped-select-input-in-react#:~:text=To%20fetch%20the%20selected%20value,state%20to%20pass%20the%20value.
     * @remarks Estructura de las opciones en objeto selOptions = [{label:"Tema_11", value: "11"},{label:"Tema_22", value: "22"},{label:"Tema_3",value:"3"}];    
     */
    const [utilsModule, setUtilsModule] = useState(null);
    
    useEffect(() =>
    {      
      getJSONContenido(jsonSERV);      
      import('../../../../utils/module').then(modulo => setUtilsModule(modulo));
    }, []);

    
    return (        
        <form onSubmit={consultaSimple}>        
            <div className="mb-1">
              <Label size="default"> Tema </Label>
              <Select
                  onChange={getSubtemas}
                  placeholder="Seleccione tema..."
                  value={selTema}
                >             
                {temas.map(
                    (option) => (
                      <option value={option.value}>{option.label}</option>
                    )
                )}
              </Select>
            </div>
            {
              subtemas.length > 0 &&
                <div className="mb-1">
                  <Label size="default"> Subtema </Label>
                  <Select
                    onChange={getGrupoOrCapa}
                    placeholder="Seleccione subtema..."
                    value={selSubtema}>
                    {
                      subtemas.map(
                        (option) => (
                          <option value={option.idTematica}>{option.nombreTematica}</option>
                        )
                      )
                    }
                  </Select>
                </div>
            }            
            {
              grupos.length > 0 &&
                <div className="mb-1">
                  <Label size="default"> Grupo </Label>
                  <Select
                    onChange={getCapaByGrupo}
                    placeholder="Seleccione grupo..."
                    value={selGrupo}
                  >
                  {
                    grupos.map(
                      (option) =>
                      <option value={option.idTematica}>{option.nombreTematica}</option>
                    )
                  }
                  </Select>
                </div>
            }
            {
              capas.length > 0 &&
                <div className="mb-1">
                  <Label size="default"> Capa </Label>
                  <Select
                    onChange={getAtributosCapa}
                    placeholder="Seleccione una capa:"
                    value={selCapas}
                    >
                    {
                      capas.map(
                        (option) => 
                        <option value={option.idCapa}>{option.nombreCapa}</option>
                      )
                    } 
                  </Select>
                </div>
            }
            {
              capasAttr.length > 0 &&
                <div className="mb-1">
                  <Label size="default"> Atributo </Label>
                  <Select
                    onChange={enableValor}
                    placeholder="Seleccione un atributo:"
                    value={selAttr}
                  >
                    {
                      capasAttr.map(
                        (option) =>
                          <option value={option.alias}>{option.name}</option>
                      )
                    }
                  </Select>
                </div>
            }  
            {
              selAttr &&
              <>
                <div className="mb-1">
                  <Label size="default"> Valor</Label>
                  <TextInput placeholder="Escriba patrón de búsqueda" 
                  onAcceptValue={function noRefCheck(){}}
                  type="search" className="mb-4" required readOnly={txtValorState}
                  value={txtValor} onChange={handleChangevalorTxt}></TextInput>
                </div>
                <div className="btns">
                  <Button
                    htmlType="submit"              
                    size="default"
                    type="default"              
                  >
                    Consultar
                  </Button>
                  <Button
                    htmlType="button"
                    onClick={limpiarCons}
                    size="default"
                    type="default"
                  >
                    Limpiar
                  </Button>
                </div>
              </>
            }    
                  
        </form>       
    );
    
}
export default FiltersCS;

