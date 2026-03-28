import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis' // The map object can be accessed using the JimuMapViewComponent
import { Button } from 'jimu-ui' // import components
import 'react-data-grid/lib/styles.css'

import { Polygon } from '@arcgis/core/geometry'
import type { InterfaceResponseConsulta, interfaceFeature } from '../types/interfaceResponseConsultaSimple'
import '../styles/style.css'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import { type interfaceMensajeModal, typeMSM } from '../types/interfaces'
import { loadModules } from 'esri-loader'
import { WIDGET_IDS } from '../../../shared/constants/widget-ids'
import { SearchActionBar } from '../../../shared/components/search-action-bar'
import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from '../../../widget-result/src/runtime/widget'

const { useEffect, useState } = React

const ConsultaAvanzada = (props: AllWidgetProps<any>) => {
  const [jsonSERV, setJsonSERV] = useState([])
  const [temas, setTemas] = useState([])
  const [subtemas, setSubtemas] = useState([])
  const [capas, setCapas] = useState([])
  const [selCapas, setselCapas] = useState(undefined)
  const [capaselected, setCapaselected] = useState()
  const [grupos, setGrupos] = useState([])
  const [capasAttr, setCapasAttr] = useState([])
  const [selTema, setselTema] = useState(undefined)
  const [subtemaselected, setSubtemaselected] = useState()
  const [selGrupo, setselGrupo] = useState(undefined)
  const [campo, setCampo] = useState(undefined)
  const [valores, setValores] = useState<string[]>([])
  const [valorSelected, setValorSelected] = useState()
  const [condicionBusqueda, setCondicionBusqueda] = useState('')
  const [responseConsulta, setResponseConsulta] = useState<any>(null)
  const [graphicsLayerDeployed, setGraphicsLayerDeployed] = useState(null)
  const [LayerSelectedDeployed, setLayerSelectedDeployed] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialExtent, setInitialExtent] = useState(null)
  const [mensajeModal, setMensajeModal] = useState<interfaceMensajeModal>({
    deployed: false,
    type: typeMSM.info,
    tittle: '',
    body: '',
    subBody: ''
  })
  const [widgetModules, setWidgetModules] = useState(null)
  const [utilsModule, setUtilsModule] = useState(null)
  const [servicios, setServicios] = useState(null)
  const widgetResultId = WIDGET_IDS.RESULT

  //To add the layer to the Map, a reference to the Map must be saved into the component state.
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>()
  // const [ResponseConsultaSimple, setResponseConsultaSimple] = useState<InterfaceResponseConsulta>()

  /**
   * Carga y transforma la tabla de contenido remota en una estructura jerárquica
   * de temáticas y capas para poblar los controles del formulario.
   *
   * @param {Array<any>} jsonSERV Estructura acumulada de temáticas/capas.
   * @returns {Promise<void>}
   */
  const getJSONContenido = async (jsonSERV) => {
    try {
      const urlServicioTOC = servicios.urls.tablaContenido
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let nombreServicio: any
      let idTematica
      let idCapaMapa
      let idCapaDeServicio
      let nombreTematica
      let tituloCapa
      let urlMetadatoCapa
      let url: string
      let idTematicaPadre: any
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let visible: boolean
      let existeTematica: []
      let newTematica, newCapa: object
      fetch(urlServicioTOC, {
        method: 'GET'
      })
        .then((rows) => rows.json())
        .then((data) => {
          for (let cont = 0; cont < data.length; cont++) {
            nombreServicio = data[cont].DESCRIPCIONSERVICIO
            idTematica = data[cont].IDTEMATICA + 't'
            idCapaMapa = data[cont].IDCAPA + 'c'
            nombreTematica = data[cont].NOMBRETEMATICA
            tituloCapa = data[cont].TITULOCAPA
            idTematicaPadre = data[cont].IDTEMATICAPADRE
            visible = data[cont].VISIBLE
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
              url: url + '/' + idCapaDeServicio,
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
          //if (utilsModule?.logger()) console.log('Contenido json SERV en petición =>', jsonSERV)
          //Invocación al método para obtener la información sobre el campo Temas
          if (jsonSERV !== undefined) {
            setJsonSERV(jsonSERV)
            getTemas(jsonSERV)
          }
        })
    } catch (error) {
      console.error({ error })
    }
  }

  /**
   * Obtiene la lista de temas raíz (parent = '#') desde la estructura de contenido.
   *
   * @param {Array<any>} jsonData Estructura de temáticas y capas.
   * @returns {void}
   */

  const getTemas = (jsonData) => {
    const opcArr = []
    let tipoRegistro, nodoPadre, urlServ, descrip: string
    let idTema = -1
    for (let cont = 0; cont < jsonData.length; cont++) {
      tipoRegistro = jsonData[cont].type
      nodoPadre = jsonData[cont].parent
      idTema = jsonData[cont].id
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      urlServ = jsonData[cont].url
      descrip = jsonData[cont].text.toUpperCase()

      //Cargue de los tipos 'tematica' con el nodo padre (nodoPadre) identificados con '#'
      if (nodoPadre === '#' && tipoRegistro === 'tematica') {
        opcArr.push({
          value: idTema,
          label: descrip
        })
      }
    }
    //if (utilsModule?.logger()) console.log('Lista Temas =>', opcArr)
    setTemas(opcArr)
  }

  /**
   * Procesa el cambio del selector Tema.
   * Resetea controles dependientes y carga subtemas/capas del tema seleccionado.
   *
   * @param {{ target: { value: string } }} temas Evento del control Tema.
   * @returns {void}
   */
  const getSubtemas = (temas) => {
    let idParent: number = -1
    let type: string = ''
    let jsonSubtemas: any = ''
    let jsonCapas: any = ''
    const subtemasArr: string[] = []
    const capasArr: string[] = []

    const idPRoc = parseInt(temas.target.value)
    if (utilsModule?.logger()) console.log('Tema value =>', parseInt(temas.target.value))
    if (utilsModule?.logger()) console.log('Array Admin Serv JSON =>', jsonSERV)

    //Inicialización de controles
    setselTema(temas.target.value) //Tema: Seleccionando el item del control
    setSubtemas([]) //Subtema
    setGrupos([]) //Grupo
    setCapas([]) //Capas
    setCapasAttr([]) //Atributo
    setCapaselected(null)
    setSubtemaselected(null)
    setCondicionBusqueda('')
    setValorSelected(null)
    setValores([])

    for (let cont = 0; cont < jsonSERV.length; cont++) {
      idParent = parseInt(jsonSERV[cont].parent)
      type = jsonSERV[cont].type
      //Búsqueda de subtemas
      if (idParent === idPRoc && type === 'tematica') {
        jsonSubtemas = {
          // 'idTematica': parseInt(jsonSERV[cont].id),
          value: parseInt(jsonSERV[cont].id),
          // 'nombreTematica': jsonSERV[cont].text
          label: jsonSERV[cont].text
        }
        subtemasArr.push(jsonSubtemas)
      } else if (idParent === idPRoc && type === 'capa' && parseInt(jsonSERV[cont].id) !== 0) { //Búsqueda de capas
        jsonCapas = {
          // 'idCapa': parseInt(jsonSERV[cont].id),
          value: parseInt(jsonSERV[cont].id),
          // 'nombreCapa': jsonSERV[cont].text,
          label: jsonSERV[cont].text,
          urlCapa: jsonSERV[cont].url
        }
        capasArr.push(jsonCapas)
      }
    }

    //Cargue de subtemas, cuando se conoce tema
    if (subtemasArr.length >= 0) {
      if (utilsModule?.logger()) console.log('Subtemas Array=>', subtemasArr)
      setSubtemas(subtemasArr)
    }
    //Cargue de capas de un tema, cuando éste no tiene subtemas
    if (capasArr.length >= 0) {
      if (utilsModule?.logger()) console.log('Capas Array Sin duplic =>', capasArr)
      setselCapas(undefined)
      setCapas(capasArr)
    }
  }
  /**
   * Procesa el cambio del selector Subtema.
   * Carga grupos y/o capas asociadas al subtema seleccionado.
   *
   * @param {{ target: { value: string } }} param0 Evento del control Subtema.
   * @returns {void}
   */
  const getGrupoOrCapa = ({ target }) => {
    let idParent: number = -1
    let type: string = ''
    let jsonSubtemas: any = ''
    let jsonCapas: any = ''
    const subtemasArr: string[] = []
    const capasArr: string[] = []
    setSubtemaselected(target.value)
    const idPRoc = parseInt(target.value)

    limpiaCampoCapas()
    setCapasAttr([])
    setValorSelected(null)
    setValores([])
    setCondicionBusqueda('')

    for (let cont = 0; cont < jsonSERV.length; cont++) {
      idParent = parseInt(jsonSERV[cont].parent)
      type = jsonSERV[cont].type
      //Búsqueda de subtemas
      if (idParent === idPRoc && type === 'tematica') {
        jsonSubtemas = {
          // 'idTematica': parseInt(jsonSERV[cont].id),
          value: parseInt(jsonSERV[cont].id),
          // 'nombreTematica': jsonSERV[cont].text
          label: jsonSERV[cont].text
        }
        subtemasArr.push(jsonSubtemas)
      } else if (idParent === idPRoc && type === 'capa' && parseInt(jsonSERV[cont].id) !== 0) { //Búsqueda de capas
        jsonCapas = {
          value: parseInt(jsonSERV[cont].id),
          label: jsonSERV[cont].text,
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
      setCapas(capasArr)
      setselCapas(undefined)
    }
  }
  const limpiaCampoCapas = () => {
    setCapas([]) // limpia el campo capas
    setCapaselected(null) // limpia la capa seleccionada
  }
  /**
   * Procesa el cambio del selector Grupo y carga las capas asociadas.
   *
   * @param {{ target: { value: string } }} grupos Evento del control Grupo.
   * @returns {void}
   */
  const getCapaByGrupo = (grupos) => {
    let idParent: number = -1
    let type: string = ''
    let jsonSubtemas: any = ''
    let jsonCapas: any = ''
    const subtemasArr: string[] = []
    const capasArr: string[] = []
    const idPRoc = parseInt(grupos.target.value)

    setValorSelected(null)
    setselGrupo(grupos.target.value)

    setCapasAttr([])

    for (let cont = 0; cont < jsonSERV.length; cont++) {
      idParent = parseInt(jsonSERV[cont].parent)
      type = jsonSERV[cont].type
      //Búsqueda de subtemas
      if (idParent === idPRoc && type === 'tematica') {
        jsonSubtemas = {
          // 'idTematica': parseInt(jsonSERV[cont].id),
          value: parseInt(jsonSERV[cont].id),
          // 'nombreTematica': jsonSERV[cont].text
          label: jsonSERV[cont].text
        }
        subtemasArr.push(jsonSubtemas)
      } else if (idParent === idPRoc && type === 'capa' && parseInt(jsonSERV[cont].id) !== 0) { //Búsqueda de capas
        jsonCapas = {
          // 'idCapa': parseInt(jsonSERV[cont].id),
          value: parseInt(jsonSERV[cont].id),
          // 'nombreCapa': jsonSERV[cont].text,
          label: jsonSERV[cont].text,
          urlCapa: jsonSERV[cont].url
        }
        capasArr.push(jsonCapas)
      }
    }

    //Cargue de capas de un grupo
    if (capasArr.length >= 0) {
      if (utilsModule?.logger()) console.log('Capas Array Sin duplic =>', capasArr)
      setCapas(capasArr)
      setselCapas(undefined)
    }
  }
  /**
   * Consulta metadatos de la capa seleccionada y llena la lista de atributos.
   * También despliega la capa en el mapa y actualiza su referencia activa.
   *
   * @param {{ value: number }} target Valor seleccionado en el control Capa.
   * @returns {void}
   */
  const getAtributosCapa = (target) => {
    let urlCapa: string = ''
    let JsonAtrCapa: any = ''
    const AtrCapaArr: any = []
    let urlCapaJson: string = ''

    //Construcción de la URL del servicio, a partir del identificador de capa traido desde el campo Capa
    // urlCapa = getUrlFromCapa(target.value, capas)
    urlCapa = capas.find(capa => capa.value === target.value)?.urlCapa
    if (!urlCapa) {
      console.error('Url no encontrada')
      return
    }
    removeLayerDeployed(LayerSelectedDeployed)
    dibujaCapasSeleccionadas(urlCapa)
    urlCapaJson = urlCapa + '?f=json'
    if (utilsModule?.logger()) console.log('URL capa =>', urlCapaJson)

    setCapasAttr([])
    setselCapas(urlCapaJson)

    //Realización del consumo remoto, a través de la URL del servicio dado por el atributo urlCapaJson
    fetch(urlCapaJson, {
      method: 'GET'
    })
      .then((rows) => rows.json())
      .then((data) => {
        //Rearmado estructura datos de atributos: name, alias
        for (let cont = 0; cont < data.fields.length; cont++) {
          JsonAtrCapa = {
            value: data.fields[cont].name,
            label: data.fields[cont].alias,
            allData: data
          }
          AtrCapaArr.push(JsonAtrCapa)
        }
        if (utilsModule?.logger()) console.log('Obj Attr Capas =>', AtrCapaArr)
        setCapasAttr(AtrCapaArr)
        setTimeout(() => { // para esperar que la capacargue
          setIsLoading(false)
        }, 6000)
      })
  }


  /**
   * Limpia todos los controles del formulario, resetea estados y elimina capas del mapa.
   *
   * @returns {void}
   */
  const limpiarCons = () => {
    if (utilsModule?.logger()) console.log('Handle Evt en limpiar =>')
    setselTema(undefined)
    setTemas(temas)
    setSubtemas([])
    setGrupos([])
    setCapas([])
    setCapasAttr([])
    setValores([])
    setValorSelected(undefined)
    setCampo(undefined)
    setCondicionBusqueda('')
    setCapaselected(null)
    setselCapas(undefined)
    setSubtemaselected(undefined)
    setselGrupo(undefined)
    setLayerSelectedDeployed(null)
    setGraphicsLayerDeployed(null)
    setResponseConsulta(null)
    // Limpiar capas del mapa
    if (jimuMapView && jimuMapView.view) {
      try {
        jimuMapView.view.map.removeAll()
        goToInitialExtent(jimuMapView, initialExtent)
      } catch (e) {
        if (utilsModule?.logger()) console.error('Error al limpiar el mapa:', e)
      }
    }
  }

  const removeLayer = (layer: __esri.Layer) => {
    jimuMapView.view.map.remove(layer)
    jimuMapView.view.zoom = jimuMapView.view.zoom - 0.00000001
  }

  /**
   * Guarda la vista activa del mapa para operar con capas y navegación.
   *
   * @param {JimuMapView} jmv Vista activa de Experience Builder.
   * @returns {void}
   */
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (utilsModule?.logger()) console.log('Ingresando al evento objeto JimuMapView...')
    if (jmv) {
      setJimuMapView(jmv)
      setInitialExtent(jmv.view.extent) // Guarda el extent inicial
    }
  }

  /**
   * Dibuja las features devueltas por la consulta en un GraphicsLayer temporal.
   *
   * @param {InterfaceResponseConsulta} response Respuesta de la consulta espacial.
   * @returns {Promise<void>}
   */
  const drawFeaturesOnMap = async (response: InterfaceResponseConsulta) => {
    const { features, spatialReference } = response
    if (!jimuMapView || features.length === 0 || !response) return

    loadModules([
      'esri/layers/GraphicsLayer', 'esri/PopupTemplate',
      'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/Graphic'
    ]).then(([GraphicsLayer, PopupTemplate, SimpleFillSymbol,
      SimpleLineSymbol, Graphic]) => {
      const graphicsLayer = new GraphicsLayer()
      features.forEach((feature: interfaceFeature) => {
        const polygon = new Polygon({
          rings: feature.geometry.rings,
          spatialReference: spatialReference
        })
        const popupTemplate = new PopupTemplate({
          title: 'Feature Info',
          content: `
              <ul>
                ${Object.keys(feature.attributes).map(key => `<li><strong>${key}:</strong> ${feature.attributes[key]}</li>`).join('')}
              </ul>
            `
        })
        const SYMBOL = new SimpleFillSymbol({
          color: 'blue', // Amarillo con transparencia
          outline: new SimpleLineSymbol({
            color: 'darkblue',
            width: 0.5
          })
        })
        const graphic = new Graphic({
          geometry: polygon,
          /* symbol: {
            type: 'simple-fill',
            color: 'blue',
            outline: {
              color: 'darkblue',
              width: 0.5
            }
          }, */
          symbol: SYMBOL,
          attributes: feature.attributes,
          popupTemplate: popupTemplate
        })
        graphicsLayer.add(graphic)
      })
      jimuMapView.view.map.add(graphicsLayer)
      setGraphicsLayerDeployed(graphicsLayer)
      jimuMapView.view.goTo({
        target: graphicsLayer.graphics.items[0].geometry,
        zoom: 10
      })
      setIsLoading(false)
    })
  }

    /**
    * Dibuja en el mapa la capa seleccionada por URL y la deja como capa activa.
    *
    * @param {string} url URL del FeatureLayer a desplegar.
    * @returns {void}
    */
  const dibujaCapasSeleccionadas = (url) => {
    const layer = new FeatureLayer({ url })
    jimuMapView.view.map.add(layer)
    layer.when(() => {
      setLayerSelectedDeployed(layer)
      jimuMapView.view.goTo(layer.fullExtent).catch(error => {
        console.error('Error while zooming to layer extent:', error)
      })
    }).catch(error => {
      console.error('Error loading the feature layer:', error)
    })
  }

  const removeLayerDeployed = (featureLayer) => {
    if (featureLayer && jimuMapView) {
      jimuMapView.view.map.remove(featureLayer)
    } else {
      console.error('FeatureLayer no encontrado.')
    }
  }

  const consultarValores = async () => {
    if (utilsModule?.logger()) console.log('consultarValores')
    setIsLoading(true)
    const url = selCapas.replace('?f=json', '') + '/query'
    const where = '1=1'
    const getGeometry = false
    const response = await realizarConsulta(campo, url, getGeometry, where)
    if (utilsModule?.logger()) console.log(response)
    if (response) {
      if (response.error) {
        console.error(`${response.error.code} - ${response.error.message}`)
        setMensajeModal({
          deployed: true,
          type: typeMSM.error,
          tittle: 'Sin valores',
          body: `${response.error.code} - ${response.error.message}`
        })
      } else {
        const ordenarDatos: string[] = getOrdenarDatos(response, campo)
        if (utilsModule?.logger()) console.log({ ordenarDatos })
        if (ordenarDatos[0] === null) {
          setValores([])

          setMensajeModal({
            deployed: true,
            type: typeMSM.info,
            tittle: 'Sin valores',
            body: `El campo ${campo} no tiene valores para mostrar, intenta con un campo diferente`
          }
          )
          setIsLoading(false)
          return
        }
        setValores(ordenarDatos)
      }
    }
    setIsLoading(false)
  }

  const handleCampos = ({ target }): void => {
    if (utilsModule?.logger()) console.log(target.value)
    //State del control Atributo
    // setValores([])
    const campo = target.value
    setCampo(campo)
    const adicionSimbolo = `${condicionBusqueda} ${campo}`
    setCondicionBusqueda(adicionSimbolo)
    setValorSelected(null)
  }

  const asignarSimbolCondicionBusqueda = (simbolo: string): void => {
    const adicionSimbolo = `${condicionBusqueda} ${simbolo}`
    setCondicionBusqueda(adicionSimbolo)
  }

  const handleValor = ({ target }) => {
    const adicionValor = `${condicionBusqueda} ${typeof (target.value) === 'number' ? target.value : `' ${target.value} '`} `
    setValorSelected(target.value)
    setCondicionBusqueda(adicionValor)
  }

  const _RealizarConsulta = async () => {
    if (utilsModule?.logger()) console.log('RealizarConsulta')
    setIsLoading(true)
    if (utilsModule?.logger()) console.log(condicionBusqueda)
    const where = condicionBusqueda
    const url = selCapas.replace('?f=json', '') + '/query'
    const response: InterfaceResponseConsulta = await realizarConsulta('*', url, true, where)
    if (utilsModule?.logger()) console.log(response)
    if (response.error) {
      console.error(`${response.error.code} - ${response.error.message}`)
      setMensajeModal({
        deployed: true,
        type: typeMSM.error,
        tittle: 'Error en la consulta',
        body: `${response.error.code} - ${response.error.message}`,
        subBody: 'Puede ser que la condición de busqueda no quedó bien estructurada'
      })
      setIsLoading(false)
    } else {
      if (response.features.length > 0) {
        setResponseConsulta(response)
        drawFeaturesOnMap(response)
      } else {
        setMensajeModal({
          deployed: true,
          type: typeMSM.error,
          tittle: 'Sin resultados para esta consulta',
          body: 'Intenta con otros parámetros'
        })
      }
      setIsLoading(false)
    }
  }

  const limpiarCamposValores = () => {
    setCapasAttr([])
    setValores([])
    setCampo(null)
  }

  const onChangeCapa = ({ target }) => {
    if (utilsModule?.logger()) console.log(target.value)
    setIsLoading(true)
    if (graphicsLayerDeployed?.graphics.items.length > 0) {
      jimuMapView.view.map.removeAll()
    }
    getAtributosCapa(target)
    setCapaselected(target.value)
    limpiarCamposValores()
    setCondicionBusqueda('')
  }

  const handleChangeTextArea = ({ target }) => { setCondicionBusqueda(target.value) }

  
  const formularioConsulta = () => {
    return (
      <div className='consulta-avanzada-scroll'>
        {
          widgetModules?.INPUTSELECT(temas, getSubtemas, selTema, 'Tema')
        }
        {
          subtemas.length > 0 &&
            widgetModules?.INPUTSELECT(subtemas, getGrupoOrCapa, subtemaselected, 'Subtema')
        }
        {
          grupos.length > 0 &&
            widgetModules?.INPUTSELECT(grupos, getCapaByGrupo, selGrupo, 'Grupo')
        }
        {
          capas.length > 0 &&
            widgetModules?.INPUTSELECT(capas, onChangeCapa, capaselected, 'Capa')
        }
        {
          capasAttr.length > 0 &&
            widgetModules?.INPUTSELECT(capasAttr, handleCampos, campo, 'Campos')
        }
        {
          (valores.length > 0) &&
            widgetModules?.INPUTSELECT(valores, handleValor, valorSelected, 'Valores')
        }
        {
          campo &&
          <div className='align-items-center mt-1' style={{ paddingBottom: '1px', paddingTop: '1px' }}>
            {widgetModules?.INPUT_TEXTAREA(condicionBusqueda, handleChangeTextArea, 'Condición de búsqueda')}
            <div className='w-100 text-center' style={{ padding: '1px' }}>
              <Button
                // size='sm'
                type='primary'
                onClick={() => { setCondicionBusqueda('') } }
              >
                Borrar condición de búsqueda
              </Button>
            </div>
          </div>

        }
        {
          campo &&
          <div className='condition-buttons text-center pt-1' style={{ padding: '5px' }}>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('=') }}>=</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('BETWEEN') }}>{'<>'}</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('>') }}>{'>'}</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('<') }}>{'<'}</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('>=') }}>{'>='}</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('<=') }}>{'<='}</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('LIKE') }}>LIKE</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('AND') }}>AND</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('OR') }}>OR</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('NOT') }}>NOT</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('IS') }}>IS</Button>
            <Button type='primary' size='sm' className='mr-1 mb-1 color-deep-purple-100' onClick={() => { asignarSimbolCondicionBusqueda('NULL') }}>NULL</Button>
          </div>

        }
        {
          (condicionBusqueda && valores.length > 0) &&
          <>
            <SearchActionBar
                onSearch={_RealizarConsulta}
                onClear={limpiarCons}
                searchLabel='Consultar'
                clearLabel='Limpiar'
                helpText="Ingrese la condición de búsqueda y haga clic en Consultar para ejecutar la consulta. Use el botón Limpiar para reiniciar el formulario."
            />
          </>
        }
      </div>
    )
  }
  /**
   * Cuando hay respuesta de consulta, prepara y envía los datos al widget de resultados.
   */
  useEffect(() => {
    if (utilsModule?.logger()) console.log('effect responseConsulta')
    if (!responseConsulta) return
    const { features } = responseConsulta
    const dataGridColumns = Object.keys(features[0].attributes).map(key => ({ key: key, name: key }))
    const filas = features.map(({ attributes, geometry }) => ({ ...attributes, geometry }))
    if (utilsModule?.logger()) console.log(dataGridColumns)
    if (utilsModule?.logger()) console.log(filas)
    // setColumns(dataGridColumns)
    // setRows(filas)
    /* setTimeout(() => {
      setMostrarResultadoFeaturesConsulta(true)
    }, 10) */

    const spatialReference = responseConsulta.spatialReference
    /* const fields = [
        { name: 'DEPARTAMEN', alias: 'Departamento' },
        { name: 'MUNICIPIO', alias: 'Municipio' },
        { name: 'VEREDA', alias: 'Vereda' },
        { name: 'PCC', alias: 'PCC' },
        { name: 'SHAPE.AREA', alias: 'Área (m²)', type: 'number' },        
        { name: 'AREA_HA', alias: 'Área (HA)', type: 'number' }        
    ] */

    const fields = responseConsulta.fields

    abrirTablaResultados(features, fields, props, widgetResultId, spatialReference as unknown as __esri.SpatialReference)


  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseConsulta])

 
  // Detecta el cierre del widget y limpia el widget de resultados
  // Requiere: widgetState y limpiarYCerrarWidgetResultados definidos
  // Usa el estado global de Experience Builder para saber si el widget está cerrado
  // const widgetState = window.jimuConfig?.store?.getState()?.widgetsRuntimeInfo?.[props.id]?.state
  React.useEffect(() => {   
    //console.log({props})
    if (props.state === 'CLOSED') {
    limpiarYCerrarWidgetResultados(widgetResultId)
    }
  }, [props])


  /**
   * Cuando cambia el atributo seleccionado, consulta los valores disponibles.
   */
  useEffect(() => {
    if (campo)consultarValores()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campo])

  /**
   * Cuando se cargan los servicios, inicializa temas/subtemas/capas del formulario.
   */
  useEffect(() => {
    servicios && getJSONContenido(jsonSERV)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicios])

  useEffect(() => {
    if (props.state === 'CLOSED') {
      limpiarCons()
    }
  }, [props.state])

  useEffect(() => {
    // setResponseConsulta(dataPruebaResponse)
    import('../../../commonWidgets/widgetsModule').then(modulo => { setWidgetModules(modulo) })
    import('../../../utils/module').then(modulo => { setUtilsModule(modulo) })
    import('../../../api/servicios').then(modulo => { setServicios(modulo) })
    return () => {
      // Acción a realizar cuando el widget se cierra.
      if (utilsModule?.logger()) console.log('El widget se cerrará')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='consulta-avanzada-widget loading-host'>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}
      {
        formularioConsulta()
      }
      {
        isLoading && widgetModules?.OUR_LOADING()
      }
      {
        widgetModules?.MODAL(mensajeModal, setMensajeModal)
      }
    </div>
  )
}

export default ConsultaAvanzada

/**
 * Ejecuta una consulta REST sobre una capa de ArcGIS y retorna su respuesta en JSON.
 *
 * @param {string} campo Campos a consultar en outFields.
 * @param {string} url URL base del endpoint query.
 * @param {boolean} returnGeometry Indica si la geometría debe ser incluida.
 * @param {string} where Expresión SQL de filtrado.
 * @returns {Promise<any | undefined>}
 */
const realizarConsulta = async (campo: string, url: string, returnGeometry: boolean, where: string) => {
  const controller = new AbortController()
  const fixUrl = `${url}?where=${where}&geometryType=esriGeometryEnvelope&outFields=${campo}&returnGeometry=${returnGeometry}&f=pjson`
  // 'https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Ambiental_T_Ajustado/MapServer/14/query?where=1=1&geometryType=esriGeometryEnvelope&outFields=VEREDA&returnGeometry=false&f=pjson'
  try {
    const response = await fetch(fixUrl,
      {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow'
      })
    const _responseConsulta = await response.text()
    return JSON.parse(_responseConsulta)
  } catch (error) {
    console.error({ error })
  }
}

/**
 * Obtiene valores únicos y ordenados de un atributo para poblar el selector de valores.
 *
 * @param {InterfaceResponseConsulta} response Respuesta de consulta con features.
 * @param {string} campo Nombre del campo a extraer.
 * @returns {Array<{value: string | number, label: string | number}>}
 */
const getOrdenarDatos = (response: InterfaceResponseConsulta, campo: string) => {
  const { features } = response
  const justDatos = []
  features.forEach(feature => {
    justDatos.push(feature.attributes[campo])
  })

  // Eliminar duplicados usando un Set
  const uniqueArray = Array.from(new Set(justDatos))
  // Eliminar strings vacíos
  const filteredArray = uniqueArray.filter(item => (item !== '' && item !== ' '))
  if (filteredArray.length === 0) return []
  // Ordenar el arreglo
  const sortedArray = filteredArray.sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b // Ordenar números en orden ascendente
    } else if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b) // Ordenar strings alfabéticamente
    } else {
      return 0 // En caso de mezclar tipos, no hacer nada
    }
  })
  const sortedArrayObjet = []
  sortedArray.forEach(e => sortedArrayObjet.push({ value: e, label: e }))
  return sortedArrayObjet
}

/**
 * Filtro auxiliar equivalente a _.where para colecciones simples.
 *
 * @param {Array<any>} array Colección de elementos a filtrar.
 * @param {Record<string, any>} object Criterio de coincidencia exacta.
 * @returns {Array<any>}
 */
const where = (array, object) => {
  const keys = Object.keys(object)
  return array.filter(item => keys.every(key => item[key] === object[key]))
}

/**
 * Regresa el mapa al extent inicial capturado al abrir el widget.
 *
 * @param {JimuMapView} jimuMapView Vista activa del mapa.
 * @param {any} initialExtent Extensión inicial del mapa.
 * @returns {void}
 */
const goToInitialExtent = (jimuMapView: JimuMapView, initialExtent: any) => {
  if (jimuMapView && initialExtent) {
    jimuMapView.view.goTo(initialExtent, { duration: 1000 })
  }
}
