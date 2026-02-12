/**
 * @fileoverview Componente de filtros para el widget de Consulta Simple.
 * Gestiona la selección jerárquica de temas, subtemas, grupos, capas y atributos
 * para realizar consultas geoespaciales.
 *
 * @module consulta_simple2/components/filtersCS
 * @requires jimu-core
 * @requires jimu-ui
 */

import { React } from 'jimu-core'
import { Button, Label, Select, TextInput } from 'jimu-ui'

import { typeMSM } from '../../types/interfaceResponseConsultaSimple'
import { urls } from '../../../../api/servicios'
const { useEffect, useState } = React

/**
 * Componente FiltersCS - Gestiona los filtros del widget Consulta Simple.
 * Permite la navegación jerárquica entre temas, subtemas, grupos y capas,
 * y realiza consultas basadas en atributos y valores especificados.
 *
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.props - Propiedades del widget padre (incluye state)
 * @param {Array} props.jsonSERV - Estructura JSON del servidor de contenidos
 * @param {Function} props.setJsonSERV - Setter para jsonSERV
 * @param {Array} props.temas - Lista de temas disponibles
 * @param {Function} props.setTemas - Setter para temas
 * @param {Array} props.subtemas - Lista de subtemas filtrados
 * @param {Function} props.setSubtemas - Setter para subtemas
 * @param {Array} props.capas - Lista de capas disponibles
 * @param {Function} props.setCapas - Setter para capas
 * @param {string} props.urlCapa - URL de la capa seleccionada
 * @param {Function} props.setUrlCapa - Setter para urlCapa
 * @param {Array} props.grupos - Lista de grupos disponibles
 * @param {Function} props.setGrupos - Setter para grupos
 * @param {Array} props.capasAttr - Atributos de la capa seleccionada
 * @param {Function} props.setCapasAttr - Setter para capasAttr
 * @param {boolean} props.txtValorState - Estado readonly del campo valor
 * @param {Function} props.setValorState - Setter para txtValorState
 * @param {string} props.txtValor - Valor de búsqueda ingresado
 * @param {Function} props.setValor - Setter para txtValor
 * @param {string} props.selTema - Tema seleccionado
 * @param {Function} props.setselTema - Setter para selTema
 * @param {string} props.selSubtema - Subtema seleccionado
 * @param {Function} props.setselSubtema - Setter para selSubtema
 * @param {string} props.selGrupo - Grupo seleccionado
 * @param {Function} props.setselGrupo - Setter para selGrupo
 * @param {string} props.selCapas - Capa seleccionada
 * @param {Function} props.setselCapas - Setter para selCapas
 * @param {string} props.selAttr - Atributo seleccionado
 * @param {Function} props.setselAttr - Setter para selAttr
 * @param {Object} props.ResponseConsultaSimple - Respuesta de la consulta
 * @param {Function} props.setResponseConsultaSimple - Setter para ResponseConsultaSimple
 * @param {Object} props.view - Vista del mapa actual
 * @param {Function} props.setView - Setter para view
 * @param {JimuMapView} props.jimuMapView - Vista de mapa de Jimu
 * @param {Object} props.lastGeometriDeployed - Última geometría desplegada
 * @param {string} props.condic - Condición de consulta
 * @param {Function} props.setCond - Setter para condic
 * @param {Function} props.setRenderMap - Setter para activar renderizado del mapa
 * @param {Function} props.setAlertDial - Setter para mostrar diálogo de alerta
 * @param {Object} props.mensModal - Mensaje del modal
 * @param {Function} props.setMensModal - Setter para mensModal
 * @param {Function} props.setIsLoading - Setter para estado de carga
 * @returns {JSX.Element} Formulario de filtros para consulta simple
 *
 * @author IGAC - DIP
 * @since 2024-06-24
 */
const FiltersCS = function ({
  props, jsonSERV, setJsonSERV, temas, setTemas, subtemas, setSubtemas, capas, setCapas, urlCapa, setUrlCapa, grupos,
  setGrupos, capasAttr, setCapasAttr, txtValorState, setValorState, txtValor, setValor, selTema, setselTema, selSubtema, setselSubtema,
  selGrupo, setselGrupo, selCapas, setselCapas, selAttr, setselAttr, ResponseConsultaSimple, setResponseConsultaSimple, view, setView,
  jimuMapView, lastGeometriDeployed, condic, setCond, setRenderMap, setAlertDial, mensModal, setMensModal, setIsLoading
}) {
  /**
   * Convierte un valor a entero de forma segura.
   * Si el valor no es numérico, retorna el valor por defecto especificado.
   *
   * @param {any} value - Valor a convertir
   * @param {number} [defaultValue=-1] - Valor por defecto si no es numérico
   * @returns {number} Valor entero o el valor por defecto
   *
   * @author IGAC - DIP
   * @since 2024-02-12
   */
  const safeParseInt = (value: any, defaultValue: number = -1): number => {
    if (value === null || value === undefined || value === '') return defaultValue
    if (typeof value === 'number') return Math.floor(value)
    const cleaned = String(value).replace(/[^0-9-]/g, '')
    const parsed = Number(cleaned)
    return isNaN(parsed) ? defaultValue : Math.floor(parsed)
  }

  /**
   * Carga el contenido de temáticas, subtemáticas, grupos y capas desde el servidor de contenidos.
   * Procesa la respuesta y construye la estructura jerárquica de navegación.
   *
   * @async
   * @param {Array} jsonSERV - Array donde se almacenará la estructura de contenidos
   * @returns {Promise<void>}
   * @see {@link https://www.freecodecamp.org/news/how-to-fetch-api-data-in-react/}
   *
   * @author IGAC - DIP
   * @since 2024-05-22
   * @updated 2024-06-27 - Importación URL desde servicios.ts
   */
  async function getJSONContenido (jsonSERV) {
    console.log({ urls })
    const urlServicioTOC = urls.tablaContenido
    console.log({ urlServicioTOC })

    let /* nombreServicio, */ idTematica, idCapaMapa, idCapaDeServicio, nombreTematica, tituloCapa, urlMetadatoCapa, url: string
    let idTematicaPadre: any
    // let visible: boolean
    let existeTematica: []
    let newTematica, newCapa: object

    fetch(urlServicioTOC, {
      method: 'GET'
    })
      .then((rows) => rows.json())
      .then((data) => {
        for (let cont = 0; cont < data.length; cont++) {
          // nombreServicio = data[cont].DESCRIPCIONSERVICIO
          idTematica = data[cont].IDTEMATICA + 't'
          idCapaMapa = data[cont].IDCAPA + 'c'
          nombreTematica = data[cont].NOMBRETEMATICA
          tituloCapa = data[cont].TITULOCAPA
          idTematicaPadre = data[cont].IDTEMATICAPADRE
          // visible = data[cont].VISIBLE
          url = data[cont].URL
          idCapaDeServicio = data[cont].NOMBRECAPA
          urlMetadatoCapa = data[cont].METADATOCAPA

          if (!idTematicaPadre) {
            idTematicaPadre = '#'
          } else {
            idTematicaPadre = idTematicaPadre + 't'
          }

          existeTematica = where(jsonSERV, { id: idTematica })

          //Cadena JSON de temática
          newTematica = {
            id: idTematica,
            text: nombreTematica,
            type: 'tematica',
            parent: idTematicaPadre
          }

          //Cadena JSON de Capa
          newCapa = {
            id: idCapaMapa.replace('c', ''),
            idCapaMapa: idCapaMapa,
            text: tituloCapa,
            type: 'capa',
            parent: idTematica,
            //"url": url + "/" + idCapaDeServicio,
            url: url.replace('CartografiaBasica_5000', 'Ambiental_T_Ajustado') + '/' + idCapaDeServicio,
            idCapaDeServicio: idCapaDeServicio,
            urlMetadatoCapa: urlMetadatoCapa
          }
          if (existeTematica.length !== 0) {
            jsonSERV.push(newCapa)
          } else {
            jsonSERV.push(newTematica)
            if (data[cont].IDCAPA) {
              jsonSERV.push(newCapa)
            }
          }
        }
        //if (utilsModule?.logger()) console.log("Contenido json SERV en petición =>", jsonSERV);

        //Invocación al método para obtener la información sobre el campo Temas
        if (jsonSERV != undefined) {
          setJsonSERV(jsonSERV)
          getTemas(jsonSERV)
        }
      })
  }

  /**
   * Implementación alternativa de la función _.where de Underscore.
   * Filtra un array de objetos según las propiedades especificadas.
   *
   * @param {Array} array - Array de objetos donde buscar
   * @param {Object} object - Objeto con las propiedades a coincidir
   * @returns {Array} Elementos del array que coinciden con todos los criterios
   * @see {@link https://stackoverflow.com/questions/58823625/underscore-where-es6-typescript-alternative}
   *
   * @author IGAC - DIP
   * @since 2024-05-22
   */
  function where (array, object) {
    const keys = Object.keys(object)
    return array.filter(item => keys.every(key => item[key] === object[key]))
  }

  /**
   * Extrae las temáticas principales desde la estructura JSON del servidor.
   * Filtra únicamente los nodos raíz (parent === '#') de tipo 'tematica'.
   *
   * @param {Array} jsonData - Estructura JSON con temas, subtemas, grupos y capas
   * @returns {void} Actualiza el estado 'temas' mediante setTemas
   *
   * @author IGAC - DIP
   * @since 2024-05-22
   */
  function getTemas (jsonData) {
    const opcArr = []
    let tipoRegistro, nodoPadre, urlServ, descrip: string
    let idTema = -1
    for (let cont = 0; cont < jsonData.length; cont++) {
      tipoRegistro = jsonData[cont].type
      nodoPadre = jsonData[cont].parent
      idTema = jsonData[cont].id
      urlServ = jsonData[cont].url
      descrip = jsonData[cont].text.toUpperCase()

      //Cargue de los tipos "tematica" con el nodo padre (nodoPadre) identificados con '#'
      if (nodoPadre === '#' && tipoRegistro === 'tematica') {
        opcArr.push({
          value: idTema,
          label: descrip
        })
      }
    }
    //if (utilsModule?.logger()) console.log("Lista Temas =>", opcArr);
    setTemas(opcArr)
  }

  /**
   * Obtiene la lista de subtemas según el tema seleccionado.
   * Reinicia los controles dependientes (subtema, grupo, capa, atributo, valor)
   * y carga los subtemas y/o capas asociadas al tema.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} temas - Evento del control Select de temas
   * @returns {void} Actualiza estados: selTema, subtemas, grupos, capas, capasAttr, valor
   *
   * @author IGAC - DIP
   * @since 2023-05-23
   * @updated 2024-06-27 - Validación para evitar duplicados en campo Capa
   */
  function getSubtemas (temas) {
    let idParent: number = -1
    let type: string = ''
    let jsonSubtemas: any = ''
    let jsonCapas: any = ''
    const subtemasArr: string[] = []
    const capasArr: string[] = []

    const idPRoc = safeParseInt(temas.target.value)
    if (utilsModule?.logger()) console.log('Tema value =>', safeParseInt(temas.target.value))
    if (utilsModule?.logger()) console.log('Array Admin Serv JSON =>', jsonSERV)

    //Inicialización de controles
    setselTema(temas.target.value) //Tema: Seleccionando el item del control

    setSubtemas([]) //Subtema
    setGrupos([]) //Grupo
    setCapas([]) //Capa
    setCapasAttr([]) //Atributo
    setValor('') //Valor
    setValorState(true)//Valor al actualizarlo el usuario
    //Validación de inicialización array local
    if (utilsModule?.logger()) console.log('Longitud array capas =>', capasArr.length)
    if (capasArr.length > 0) {
      capasArr.length = 0
    }
    for (let cont = 0; cont < jsonSERV.length; cont++) {
      idParent = safeParseInt(jsonSERV[cont].parent)
      type = jsonSERV[cont].type
      //Búsqueda de subtemas
      if (idParent === idPRoc && type === 'tematica') {
        jsonSubtemas = {
          idTematica: safeParseInt(jsonSERV[cont].id),
          nombreTematica: jsonSERV[cont].text
        }
        subtemasArr.push(jsonSubtemas)
      }
      //Búsqueda de capas
      else if (idParent === idPRoc && type === 'capa' && safeParseInt(jsonSERV[cont].id) !== 0) {
        jsonCapas = {
          idCapa: safeParseInt(jsonSERV[cont].id),
          nombreCapa: jsonSERV[cont].text,
          urlCapa: jsonSERV[cont].url
        }
        capasArr.push(jsonCapas)
      }
    }

    //Procesar para remover duplicados
    if (utilsModule?.logger()) console.log('Sin duplic prueba =>', procesaDuplic(capasArr))

    //Cargue de subtemas, cuando se conoce tema
    if (subtemasArr.length >= 0) {
      if (utilsModule?.logger()) console.log('Subtemas Array=>', subtemasArr)
      setselSubtema(undefined)
      setSubtemas(subtemasArr)
    }
    //Cargue de capas de un tema, cuando éste no tiene subtemas
    if (capasArr.length >= 0) {
      if (utilsModule?.logger()) console.log('Capas Array Sin duplic =>', capasArr)
      setselCapas(undefined)
      //Procesar para remover duplicados
      setCapas(procesaDuplic(capasArr))
    }
  }

  /**
   * Elimina elementos duplicados de un array de objetos basándose en idCapa, nombreCapa y urlCapa.
   *
   * @param {Array<{idCapa: number, nombreCapa: string, urlCapa: string}>} capasArr - Array con posibles duplicados
   * @returns {Array} Array sin elementos duplicados
   * @see {@link https://www.geeksforgeeks.org/how-to-remove-duplicates-in-json-array-javascript/}
   *
   * @author IGAC - DIP
   * @since 2024-06-27
   */
  function procesaDuplic (capasArr) {
    let newCapasArr = []
    newCapasArr = capasArr.filter((obj, index, self) =>
      index === self.findIndex((t) => (
        t.idCapa === obj.idCapa && t.nombreCapa === obj.nombreCapa && t.urlCapa === obj.urlCapa
      )))
    return newCapasArr
  }

  /**
   * Obtiene grupos y/o capas asociadas al subtema seleccionado.
   * Limpia el mapa actual y reinicia los controles dependientes.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} subtemas - Evento del control Select de subtemas
   * @returns {void} Actualiza estados: selSubtema, grupos, capas, capasAttr, valor
   *
   * @author IGAC - DIP
   * @since 2023-05-23
   * @updated 2024-06-27 - Validación de duplicados y limpieza de mapa
   */
  function getGrupoOrCapa (subtemas) {
    let idParent: number = -1
    let type: string = ''
    let jsonSubtemas: any = ''
    let jsonCapas: any = ''
    const subtemasArr: string[] = []
    const capasArr: string[] = []

    const idPRoc = safeParseInt(subtemas.target.value)

    if (utilsModule?.logger()) console.log('Subtema asociado =>', idPRoc)

    //Inicialización controles
    setselSubtema(idPRoc)
    setCapasAttr([])
    setValor('')
    setValorState(true)

    //Inicialización de mapa
    limpiarCapaMapa()

    //Validación de inicialización array local
    if (utilsModule?.logger()) console.log('Longitud array capas =>', capasArr.length)
    if (capasArr.length > 0) {
      capasArr.length = 0
    }

    for (let cont = 0; cont < jsonSERV.length; cont++) {
      idParent = safeParseInt(jsonSERV[cont].parent)
      type = jsonSERV[cont].type
      //Búsqueda de subtemas
      if (idParent === idPRoc && type === 'tematica') {
        jsonSubtemas = {
          idTematica: safeParseInt(jsonSERV[cont].id),
          nombreTematica: jsonSERV[cont].text
        }
        subtemasArr.push(jsonSubtemas)
      }
      //Búsqueda de capas
      else if (idParent === idPRoc && type === 'capa' && safeParseInt(jsonSERV[cont].id) !== 0) {
        jsonCapas = {
          idCapa: safeParseInt(jsonSERV[cont].id),
          nombreCapa: jsonSERV[cont].text,
          urlCapa: jsonSERV[cont].url
        }
        capasArr.push(jsonCapas)
      }
    }

    //Cargue de subtemas, cuando se conoce subtema
    if (subtemasArr.length >= 0) {
      if (utilsModule?.logger()) console.log('Subtemas Array=>', subtemasArr)
      setGrupos(subtemasArr)
      setselGrupo(undefined)
    }
    //Cargue de capas de un subtema, cuando éste no tiene grupos
    if (capasArr.length >= 0) {
      if (utilsModule?.logger()) console.log('Capas Array Sin duplic =>', capasArr)
      setCapas(procesaDuplic(capasArr))
      setselCapas(undefined)
    }
  }

  /**
   * Obtiene las capas asociadas a un grupo seleccionado.
   * Limpia el mapa y reinicia los controles de atributo y valor.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} grupos - Evento del control Select de grupos
   * @returns {void} Actualiza estados: selGrupo, capas, capasAttr, valor
   *
   * @author IGAC - DIP
   * @since 2023-05-23
   * @updated 2024-06-27 - Validación de duplicados y limpieza de mapa
   */
  function getCapaByGrupo (grupos) {
    let idParent: number = -1
    let type: string = ''
    let jsonSubtemas: any = ''
    let jsonCapas: any = ''
    const subtemasArr: string[] = []
    const capasArr: string[] = []
    const idPRoc = safeParseInt(grupos.target.value)

    if (utilsModule?.logger()) console.log('Grupo asociado =>', idPRoc)

    setselGrupo(grupos.target.value)

    //Inicialización controles asociados
    setCapasAttr([])
    setValor('')
    setValorState(true)

    //Inicialización del mapa
    limpiarCapaMapa()

    //Validación de inicialización array local
    if (utilsModule?.logger()) console.log('Longitud array capas =>', capasArr.length)
    if (capasArr.length > 0) {
      capasArr.length = 0
    }

    for (let cont = 0; cont < jsonSERV.length; cont++) {
      idParent = safeParseInt(jsonSERV[cont].parent)
      type = jsonSERV[cont].type
      const id = safeParseInt(jsonSERV[cont].id)
      //Búsqueda de subtemas
      if (idParent === idPRoc && type === 'tematica') {
        jsonSubtemas = {
          idTematica: id,
          nombreTematica: jsonSERV[cont].text
        }
        subtemasArr.push(jsonSubtemas)
      }
      //Búsqueda de capas
      else if (idParent === idPRoc && type === 'capa' && id !== 0) {
        jsonCapas = {
          idCapa: id,
          nombreCapa: jsonSERV[cont].text,
          urlCapa: jsonSERV[cont].url
        }
        capasArr.push(jsonCapas)
      }
    }

    //Cargue de capas de un grupo
    if (capasArr.length >= 0) {
      if (utilsModule?.logger()) console.log('Capas Array Sin duplic =>', capasArr)
      setCapas(procesaDuplic(capasArr))
      setselCapas(undefined)
    }
  }

  /**
   * Obtiene los atributos (campos) de una capa seleccionada desde el servicio REST.
   * Consulta el endpoint JSON de la capa y extrae la información de campos.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} capa - Evento del control Select de capas
   * @returns {void} Actualiza estados: selCapas, urlCapa, capasAttr, selAttr, valor
   *
   * @author IGAC - DIP
   * @since 2024-05-24
   * @updated 2024-06-19 - Fix seteo de valores de capa y URL
   */
  function getAtributosCapa (capa) {
    let urlCapa: string
    let JsonAtrCapa: any = ''
    const AtrCapaArr: any = []
    let urlCapaJson: string

    if (utilsModule?.logger()) console.log('Capa asociada =>', capa.target.value)
    //Construcción de la URL del servicio, a partir del identificador de capa traido desde el campo Capa
    urlCapa = getUrlFromCapa(capa.target.value, capas)
    urlCapaJson = urlCapa + '?f=json'
    if (utilsModule?.logger()) console.log('URL capa =>', urlCapaJson)

    //Inicialización controles
    setCond(undefined)
    setCapasAttr([])
    setValor('')
    setValorState(true)
    setselAttr(undefined)
    setselCapas(capa.target.value)
    setUrlCapa(urlCapaJson)

    //Incialización de mapa
    limpiarCapaMapa()

    //Realización del consumo remoto, a través de la URL del servicio dado por el atributo urlCapaJson
    fetch(urlCapaJson, {
      method: 'GET'
    })
      .then((rows) => rows.json())
      .then((data) => {
        //Rearmado estructura datos de atributos: name, alias
        for (let cont = 0; cont < data.fields.length; cont++) {
          if (data.fields[cont].name !== 'shape' && data.fields[cont].name !== 'elemento') {
            JsonAtrCapa = {
              name: data.fields[cont].name,
              alias: data.fields[cont].alias
            }
            AtrCapaArr.push(JsonAtrCapa)
          }
        }
        if (utilsModule?.logger()) console.log('Obj Attr Capas =>', AtrCapaArr)
        setCapasAttr(AtrCapaArr)
      })
  }

  /**
   * Obtiene la URL del servicio REST de una capa a partir de su identificador.
   *
   * @param {string|number} idCapa - Identificador único de la capa
   * @param {Array<{idCapa: number, nombreCapa: string, urlCapa: string}>} capasArr - Array de capas disponibles
   * @returns {string|number} URL de la capa encontrada, o -1 si no existe
   *
   * @author IGAC - DIP
   * @since 2024-05-24
   */
  function getUrlFromCapa (idCapa, capasArr) {
    //Recorrido por el array
    for (let cont = 0; cont < capasArr.length; cont++) {
      if (safeParseInt(capasArr[cont].idCapa) === safeParseInt(idCapa)) {
        return capasArr[cont].urlCapa
      }
    }
    return -1
  }

  /**
   * Habilita el campo de valor para entrada de datos cuando se selecciona un atributo.
   * Remueve el estado readOnly del campo valor y limpia el mapa.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} evt - Evento del control Select de atributos
   * @returns {void} Actualiza estados: txtValorState, selAttr y limpia el mapa
   *
   * @author IGAC - DIP
   * @since 2024-05-27
   * @updated 2024-06-17 - Limpieza de capas del mapa
   */
  function enableValor (evt) {
    //State del control Valor
    setValorState(false)

    //State del control Atributo
    setselAttr(evt.target.value)

    //Inicialización de mapa
    limpiarCapaMapa()
  }

  /**
   * Manejador de cambio para el campo de texto Valor.
   * Actualiza el estado con el valor ingresado por el usuario.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - Evento de cambio del input
   * @returns {void} Actualiza el estado txtValor
   * @see {@link https://www.geeksforgeeks.org/how-to-handle-input-forms-with-usestate-hook-in-react/}
   *
   * @author IGAC - DIP
   * @since 2024-05-27
   */
  const handleChangevalorTxt = function (event) {
    //if (utilsModule?.logger()) console.log("Estado actual =>",txtValorState);
    setValor(event.target.value)
  }

  /**
   * Limpia todos los controles del formulario y remueve las capas del mapa.
   * Reinicia el formulario al estado inicial.
   *
   * @param {React.MouseEvent<HTMLButtonElement>|{target: {value: string}}} evt - Evento del botón Limpiar
   * @returns {void} Reinicia todos los estados de los controles
   * @see {@link https://stackoverflow.com/questions/48357787/how-to-deselect-option-on-selecting-option-of-another-select-in-react}
   *
   * @author IGAC - DIP
   * @since 2024-05-28
   * @updated 2024-06-25 - Fix para limpiar campo Atributo
   */
  function limpiarCons (evt) {
    //State del control Tema
    if (utilsModule?.logger()) console.log('Handle Evt en limpiar =>', evt.target.value)
    setselTema({ selected: evt.target.value })
    setTemas(temas)
    setSubtemas([])
    setGrupos([])
    setCapas([])
    setCapasAttr([])
    setValor('')
    setValorState(true)
    setselAttr(undefined)

    //Rutina para limpiar capa del mapa
    /*  setResponseConsultaSimple(null);
      if (utilsModule?.logger()) console.log("Obj Geometria =>",view);
      jimuMapView.view.map.remove(view); */

    limpiarCapaMapa()
  }

  /**
   * Ejecuta la consulta simple con los filtros seleccionados.
   * Construye la cláusula WHERE basada en el atributo y valor especificados,
   * y activa el renderizado del mapa con los resultados.
   *
   * @param {React.FormEvent<HTMLFormElement> & { preventDefault: () => void }} evt - Evento submit del formulario
   * @returns {void} Activa el renderizado del mapa o muestra mensaje de error
   *
   * @author IGAC - DIP
   * @since 2024-05-29
   * @updated 2024-06-25 - Validaciones de campos requeridos
   */
  function consultaSimple (evt: { preventDefault: () => void }) {
    //if (utilsModule?.logger()) console.log("En pruebas...");
    setIsLoading(true)
    evt.preventDefault()
    setRenderMap(false)
    let cond = ''

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
    if (selAttr === 'SHAPE.AREA' || selAttr === 'SHAPE.LEN' || selAttr === 'AREA_HA' || selAttr === 'objectid' || selAttr === 'st_area(shape)' || selAttr === 'st_perimeter(shape)') {
      cond = selAttr + '=' + txtValor
    } else {
      cond = selAttr + '=' + "'" + txtValor + "'"
    }
    //return tstDrawMap(urlCapa, cond);
    if (utilsModule?.logger()) console.log('Asigna cond =>', cond)
    setCond(cond)
    if (selAttr && txtValor) {
      setRenderMap(true)
    } else if (!txtValor) {
      setValor('')
      setAlertDial(true)
    }

    //Inclusión validación campos requeridos
    if ((!txtValor && txtValor.trim() === '') || txtValorState) {
      setAlertDial(true)

      setMensModal({
        deployed: true,
        type: typeMSM.error,
        tittle: 'Campos requeridos no diligenciados',
        body: 'Se requiere diligenciar los campos del filtro!'
      })
      setValor('')
    }
  }

  /**
   * Limpia las capas del mapa asociadas a la consulta simple.
   * Remueve las geometrías desplegadas y centra el mapa en Colombia con zoom nivel 6.
   *
   * @returns {void} Remueve capas y centra el mapa en coordenadas [-75.690601, 4.533889]
   *
   * @author IGAC - DIP
   * @since 2024-06-17
   * @updated 2024-06-20 - Remover capa ampliada desde DataGrid
   */
  function limpiarCapaMapa () {
    setResponseConsultaSimple(null)
    if (utilsModule?.logger()) console.log('Obj Geometria =>', view)
    if (view) {
      jimuMapView.view.map.remove(view)
      //Definición del extent centrado al dpto de Quindio
      jimuMapView.view.goTo({
        center: [-75.690601, 4.533889],
        zoom: 6
      })
    }
    //Remover capa mapa ampliada
    if (lastGeometriDeployed) {
      jimuMapView.view.map.remove(lastGeometriDeployed)
    }
  }

  /**
   * Estado para almacenar el módulo de utilidades cargado dinámicamente.
   * Contiene funciones auxiliares como logger() para depuración.
   *
   * @type {Object|null}
   * @see {@link https://www.pluralsight.com/resources/blog/guides/how-to-get-selected-value-from-a-mapped-select-input-in-react}
   *
   * @author IGAC - DIP
   * @since 2024-05-29
   */
  const [utilsModule, setUtilsModule] = useState(null)

  useEffect(() => {
    if (props.state === 'CLOSED') {
      limpiarCons({ target: { value: '' } })
    }
  }, [props.state])

  useEffect(() => {
    if (temas.length < 1 || jsonSERV.length < 1) {
      getJSONContenido(jsonSERV)
      import('../../../../utils/module').then(modulo => { setUtilsModule(modulo) })
    }
  }, [])

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
                  onAcceptValue={function noRefCheck () {}}
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
  )
}
export default FiltersCS
