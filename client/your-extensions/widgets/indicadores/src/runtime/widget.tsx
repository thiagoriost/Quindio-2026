import React, { useEffect, useState, useRef/* , useCallback */ } from 'react'
import { type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView/* , loadArcGISJSAPIModules */ } from 'jimu-arcgis'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, Filler } from 'chart.js'
import { Bar/* , Bubble, Line  */ } from 'react-chartjs-2'
// import { loadModules } from 'esri-loader'
import { type InterfaceFeatureSelected } from '../types/interfacesIndicadores'
// import { PieChart } from 'jimu-ui/advanced/lib/chart/pie'
import '../styles/style.css'
import { Pagination } from 'jimu-ui'
import { typeMSM } from '../../../commonWidgets/modal/interfaces'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
)

interface Grafico {
  label: string
  value: number
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tiposGraficos: Grafico[] = [
  { label: 'Vertical Bar Chart', value: 0 },
  { label: 'Horizontal Bar Chart', value: 1 },
  { label: 'Area Chart', value: 2 },
  { label: 'Bubble Chart', value: 3 }
]

const Indicadores = (props: AllWidgetProps<any>) => {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>()
  const [initialExtent, setInitialExtent] = useState(null)
  const [utilsModule, setUtilsModule] = useState<any>(null)
  // const [widgetModules, setWidgetModules] = useState<any>(null)
  // const [graficoSeleccionado, setGraficoSeleccionado] = useState<number | null>(null)
  const [dataGrafico, setDataGrafico] = useState<any>([])
  // const [dataGraficByAnnual, setDataGraficByAnnual] = useState(undefined)
  const [options, setOptions] = useState<any>(null)
  // const [selectedData, setSelectedData] = useState<any>(null)
  /* const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Indicator',
        data: [],
        backgroundColor: 'rgba(75,192,192,0.6)'
      }
    ]
  }) */
  // const [featureSelected, setFeatureSelected] = useState<InterfaceFeatureSelected>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [responseQueryCapa, setResponseQueryCapa] = useState(null)
  // const [contador, setContador] = useState()
  // const [poligonoSeleccionado, setPoligonoSeleccionado] = useState(undefined)
  const [currentpage, setCurrentpage] = useState(1)
  const [totalPage, setTotalPage] = useState(0)
  const [mensajeModal, setMensajeModal] = useState({
    deployed: false,
    type: typeMSM.info,
    tittle: '',
    body: '',
    subBody: ''
  })
  const [widgetModules, setWidgetModules] = useState(null)

  const chartRef = useRef(null)

  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
      setInitialExtent(jmv.view.extent)
    }
  }

  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (chartRef.current) {
      /* const chart = chartRef.current
      if (utilsModule.logger()) console.log(featureSelected.attributes)
      const points = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, true)
      if (points.length) {
        const firstPoint = points[0]
        const label = chart.data.labels.length>0 ? chart.data.labels[firstPoint.index] : ''
        const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index]
        const datasetLabel = chart.data.datasets[firstPoint.datasetIndex].label
        if (utilsModule.logger()) console.log({ label, value, datasetLabel })
        setSelectedData({ label, value, datasetLabel,...featureSelected.attributes })
      }else{
        setSelectedData(null)
      } */
    }/* else{
      setSelectedData(null)
    } */
  }

  const getDataLayerToRenderGrafic = (_featureSelected: InterfaceFeatureSelected) => {
    if (utilsModule.logger()) console.log({ _featureSelected, responseQueryCapa })
    const logica = (attToFilter) => {
      attToFilter.forEach(att => {
        const data = []
        const filter = responseQueryCapa.features.filter(e => e.attributes[att] === _featureSelected.attributes[att])
        filter.forEach(e => data.push(e.attributes))
        if (utilsModule.logger()) console.log(data)
        const distributionByDepartment = data.reduce((acc, curr) => {
          acc[curr.DEPARTAMEN] = (acc[curr.DEPARTAMEN] || 0) + 1
          return acc
        }, {})

        if (utilsModule.logger())console.log('Distribución por Departamento:', distributionByDepartment)

        // Distribución por Municipio
        const distributionByMunicipio = data.reduce((acc, curr) => {
          acc[curr.MUNICIPIO] = (acc[curr.MUNICIPIO] || 0) + 1
          return acc
        }, {})

        if (utilsModule.logger())console.log('Distribución por Municipio:', distributionByMunicipio)

        // Diversidad de Municipios en un Departamento
        const diversityByDepartment = data.reduce((acc, curr) => {
          acc[curr.DEPARTAMEN] = acc[curr.DEPARTAMEN] || new Set()
          acc[curr.DEPARTAMEN].add(curr.MUNICIPIO)
          return acc
        }, {})

        const diversityCountByDepartment = Object.keys(diversityByDepartment).map(depart => ({
          DEPARTAMEN: depart,
          numMunicipios: diversityByDepartment[depart].size
        }))

        if (utilsModule.logger())console.log('Diversidad de Municipios por Departamento:', diversityCountByDepartment)

        // Concentración por PCC
        const concentrationByPCC = data.reduce((acc, curr) => {
          acc[curr.PCC] = (acc[curr.PCC] || 0) + 1
          return acc
        }, {})
        const labels = Object.keys(concentrationByPCC)
        const values = Object.values(concentrationByPCC)

        if (utilsModule.logger())console.log('Concentración por PCC:', concentrationByPCC)
        const chartData = {
          labels: labels,
          datasets: [
            {
              label: 'Concentración por PCC',
              data: values,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }
          ]
        }
        setDataGrafico(chartData)
        const options = {
          responsive: true,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              enabled: true
            },
            datalabels: {
              anchor: 'end',
              align: 'top',
              formatter: Math.round,
              font: {
                weight: 'bold'
              }
            },
            title: {
              display: true,
              text: 'Concentración por PCC'
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        }
        setOptions(options)
        // setGraficoSeleccionado(0)
      })
    }
    logica(['MUNICIPIO'/*, "VEREDA", "PCC" */])
  }

  const generateChartData = (data, fieldlabel, fieldValue, leyenda, departmentSelect) => {
    // const parsedData = JSON.parse(data)
    const labels = []
    const metaData = {}
    if (!data) {
      if (utilsModule.logger())console.error('El poligono seleccionada no presenta atributos')
      return {
        labels: ['Sin data'], // Ordenar etiquetas para asegurar consistencia
        datasets: [
          {
            label: 'El municipio seleccionado no presenta información',
            // label: 'Cantidad de Predios',
            data: [0],
            backgroundColor: utilsModule.getRandomRGBA()
          }
        ]
      }
    } else if (!departmentSelect) { // para la grafica a nivel nacional
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (leyenda === 'Cantidad de predios por tipo' || leyenda === 'Cantidad de área por tipo') ? leyenda.replace('por tipo', '').trim() : leyenda
      return {
        labels: [fieldValue], //: labels.sort(), // Ordenar etiquetas para asegurar consistencia
        datasets: [
          {
            label: fieldValue,
            // label: 'Cantidad de Predios',
            data: [data[fieldValue]],
            backgroundColor: utilsModule.getRandomRGBA()
          }
        ]
      }
    } else {
      data.forEach(item => {
        // const {  tipo_predio, cantidad_predios  } = item.attributes
        // const {  fieldlabel, fieldValue  } = item.attributes
        const att = item.attributes ? item.attributes : item
        const findLabel = att[fieldlabel]
        const findValues = att[fieldValue]

        // Añadir fieldlabel a las etiquetas si no está presente
        if (!labels.includes(findLabel)) {
          labels.push(findLabel)
          metaData[findLabel] = 0
        }

        // Sumar findValues al findLabel correspondiente
        metaData[findLabel] += findValues
      })

      const dataValues = labels.map(label => metaData[label])

      return {
        labels, //: labels.sort(), // Ordenar etiquetas para asegurar consistencia
        datasets: [
          {
            label: leyenda,
            // label: 'Cantidad de Predios',
            data: dataValues,
            backgroundColor: utilsModule.getRandomRGBA()
          }
        ]
      }
    }

    /* return {
      labels: labels.sort(), // Ordenar etiquetas para asegurar consistencia
      datasets,
    } */
  }

  /**
   *
   * @param param0 Ajusta data para renderizar la grafica estadistica a nivel municipal
   */
  const _fixDataToRenderGrafig = ({ poligonoSeleccionado, selectIndicadores, departmentSelect }) => {
    const { geometry, symbol, attributes, popupTemplate } = poligonoSeleccionado
    const { fieldlabel, fieldValue, leyenda, descripcion } = selectIndicadores
    if (utilsModule.logger())console.log({ fieldlabel, fieldValue, leyenda, descripcion, geometry, symbol, attributes, popupTemplate })

    setTotalPage(departmentSelect ? fieldlabel.length : 0)
    /*
      const chartData = generateChartData(attributes.dataIndicadores, fieldlabel[0], fieldValue, leyenda[0])
      setDataGrafico(chartData)
      // const chartDataByAnnual = generateChartData(attributes.dataIndicadores, fieldlabel[1], fieldValue, leyenda[1])
      const orderDataByAnnual = ordenarDatos(generateChartData(attributes.dataIndicadores, fieldlabel[1], fieldValue, leyenda[1]))
      setDataGraficByAnnual(orderDataByAnnual)
      if (utilsModule.logger())console.log({chartData, orderDataByAnnual})
     */
    const dataToRenderGraphics = []
    fieldlabel.forEach((fl, i) => {
      let attr = attributes.dataIndicadores ? attributes.dataIndicadores : attributes
      if (attr !== 'object' && !attr.length) {
        attr = [attr]
      }
      if (fl.includes('anio')) {
        dataToRenderGraphics.push(ordenarDatos(generateChartData(attr, fl, fieldValue, leyenda[i], departmentSelect)))
      } else if (attr) {
        dataToRenderGraphics.push(generateChartData(attr, fl, fieldValue, leyenda[i], departmentSelect))
      } else if (!departmentSelect || attributes[fieldValue]) { // cuando es nacional o municipal
        const atr = attributes[fieldValue] ? [attributes] : attributes
        dataToRenderGraphics.push(generateChartData(atr, fl, fieldValue, leyenda[i], departmentSelect))
      } else {
        if (utilsModule.logger()) {
          console.log('el municipio no presenta data estadistica',
            { poligonoSeleccionado, selectIndicadores, departmentSelect, attributes, fl, fieldValue, leyenda, attr })
        }
      }
    })
    setDataGrafico(dataToRenderGraphics)

    setOptions({
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
        title: {
          display: true,
          text: `${descripcion} - Municipio: ${poligonoSeleccionado.attributes.mpnombre ? poligonoSeleccionado.attributes.mpnombre : poligonoSeleccionado.attributes[0].attributes.mpnombre} - Departamento: ${departmentSelect?.label ? departmentSelect.label : poligonoSeleccionado.attributes.depto}`
        },
        tooltip: {
          enabled: true
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: Math.round,
          font: {
            weight: 'bold'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
    if (utilsModule.logger())console.log({ dataToRenderGraphics })
  }

  /**
   *
   * @param param0 Ajusta data para renderizar la grafica estadistica a nivel departamental y nacional
   */
  const fixDataToRenderStadisticGraphic = (fieldlabelNal, fieldValueNal, features, leyenda, descripcion) => {
    const DATASET = []
    // 1. Agrupar por 'tipo_predio' y 'anio'
    const groupBy = (arr, key) => arr.reduce((acc, obj) => {
      const value = obj.attributes[key]
      acc[value] = acc[value] || []
      acc[value].push(obj.attributes)
      return acc
    }, {})

    fieldlabelNal.forEach((FL, i) => {
      const groupedByLabel = groupBy(features, FL)
      if (groupedByLabel.undefined) {
        console.error('Uno de los campos no coincide con algun ajuste de campos en el servicio', { fieldlabelNal, fieldValueNal, features, leyenda, descripcion })
        return
      }
      const labels = Object.keys(groupedByLabel)
      const data = labels.map(label => {
        return groupedByLabel[label].reduce((sum, item) => sum + item[fieldValueNal], 0)
      })

      DATASET.push({
        datasets: [{
          backgroundColor: utilsModule.getRandomRGBA(),
          data,
          label: leyenda[i]
        }],
        labels
      })
    })

    setDataGrafico(DATASET)
    if (utilsModule.logger())console.log({ DATASET })
    setOptions({
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
        title: {
          display: true,
          text: `${descripcion} - Municipio: ${poligonoSeleccionado.attributes.mpnombre ? poligonoSeleccionado.attributes.mpnombre : poligonoSeleccionado.attributes[0].attributes.mpnombre} - Departamento: ${departmentSelect?.label ? departmentSelect.label : poligonoSeleccionado.attributes.depto}`

        },
        tooltip: {
          enabled: true
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: Math.round,
          font: {
            weight: 'bold'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
    setTotalPage(fieldlabelNal.length)
  }

  useEffect(() => {
    if (!jimuMapView || !responseQueryCapa) return
    // Añadir evento de clic para capturar la información de la geometría seleccionada
    if (utilsModule.logger()) console.log('effect => responseQueryCapa')
    jimuMapView.view.on('click', async (event) => {
      try {
        // setSelectedData(null)
        const screenPoint = {
          x: event.x,
          y: event.y
        }
        const hitTestResult: any = await jimuMapView.view.hitTest(screenPoint)
        if (utilsModule.logger()) console.log(hitTestResult)
        const graphic = hitTestResult.results[0].graphic
        if (graphic) {
          const attributes = graphic.attributes
          if (utilsModule.logger()) console.log('Selected feature attributes:', attributes)
          const att = hitTestResult.results[0].graphic.attributes
          const _featureSelected = responseQueryCapa.features.find(e => e.attributes.OBJECTID_1 === att.OBJECTID_1)
          if (utilsModule.logger()) console.log(_featureSelected)
          // setFeatureSelected(_featureSelected)
          getDataLayerToRenderGrafic(_featureSelected)
        }
      } catch (error) {
        if (utilsModule.logger()) console.error('Error capturing geometry information:', error)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseQueryCapa])

  /* useEffect(() => {
    if (utilsModule.logger()) console.log(jimuMapView)
    if (!jimuMapView) return
    if (utilsModule.logger()) console.log("effect => jimuMapView")

    // fetchData("https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/Ambiental_T_Ajustado/MapServer/14", jimuMapView)
    return () => {}
  }, [jimuMapView]) */

  useEffect(() => {
    if (props.hasOwnProperty('stateProps')) {
      const dataFromDispatch = JSON.parse(props.stateProps.dataFromDispatch)
      let descripcion: string = '', extentAjustado
      if (utilsModule?.logger()) console.log({ props, id: props.id, dataFromDispatch })
      if (dataFromDispatch?.clear) {
        if (utilsModule?.logger()) console.log('clearing graphic')
        setDataGrafico([])
        setOptions(null)
      } else if (dataFromDispatch?.nacional || dataFromDispatch?.municipal) {
        let fieldlabel, dataAlfanumerica, deparmetSelected=undefined, municipioSelected=undefined
        if (dataFromDispatch?.nacional) {
          const { dataAlfanumericaNal, indiSelected } = dataFromDispatch.nacional
          extentAjustado = dataFromDispatch.nacional.extentAjustado
          descripcion = indiSelected.descripcion
          fieldlabel = indiSelected.fieldlabelNal
          dataAlfanumerica = dataAlfanumericaNal
          deparmetSelected= indiSelected.deparmetSelected
          municipioSelected = indiSelected.municipioSelected
        }
        if (dataAlfanumerica.error) {
          setMensajeModal({
            deployed: true,
            type: typeMSM.warning,
            tittle: 'Info',
            body: 'El indicador seleccionado no presenta información alfanumerica a nivel nacional',
            subBody: ''
          })
          return
        }
        setDataGrafico(dataAlfanumerica)
        setOptions({
          responsive: true,
          plugins: {
            legend: { position: 'top' as const },
            title: {
              display: true,
              text: `${descripcion} ${deparmetSelected ? `- Departamento:  ${deparmetSelected}` : ''}${municipioSelected ? ` - Municipio:  ${municipioSelected}` : ''}  `
            },
            tooltip: {
              enabled: true
            },
            datalabels: {
              anchor: 'end',
              align: 'top',
              formatter: Math.round,
              font: {
                weight: 'bold'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        })
        setTotalPage(fieldlabel.length)
        setTimeout(() => {
            jimuMapView.view.extent = extentAjustado?extentAjustado:initialExtent
        }, 1000)
      } else if (dataFromDispatch?.departamental) {
        if (utilsModule?.logger()) console.log(dataFromDispatch.departamental)
        const { itemSelected, selectIndicadores, filtroSoloFeaturesDelDepartaSeleccionado } = dataFromDispatch.departamental
        const { fieldlabelDepartal, fieldValueDepartal, leyendaDepartal, descripcion } = selectIndicadores
        fixDataToRenderStadisticGraphic(fieldlabelDepartal, fieldValueDepartal, filtroSoloFeaturesDelDepartaSeleccionado, leyendaDepartal, descripcion + ' - Dpto: ' + itemSelected.denombre)
      } else {
        if (utilsModule?.logger()) console.error('Upss', { props, id: props.id, dataFromDispatch })
      }
      setCurrentpage(1)
    }

    return () => {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props])

  useEffect(() => {
    import('../../../utils/module').then(modulo => {
      setUtilsModule(modulo)
      if (modulo.logger()) console.log(props, props.id)
    })
    import('../../../commonWidgets/widgetsModule').then(modulo => { setWidgetModules(modulo) })
    /* // este codigo sirve para probar los tipos de graficos
    setTimeout(() => {
      console.log(5555555)
      setDataGrafico([
        {
          datasets: [
            {
              backgroundColor: 'rgba(131, 66, 181, 0.5)',
              data: [0.017, 0.003],
              showLine: true,
              label: 'Porcentaje de área por año'
            }],
          labels: ['Procesos De Titulación De Baldíos Y Bienes Fiscales Patrimoniales Con Ocupación Previa A Persona Natural', 'Hectáreas Formalizadas Mediante Reconocimiento De Sentencias En Cumplimiento A La Sentencia De Unificación Su – 288']
          // labels: ['Procesos De Titulación De Baldíos Y Bienes Fiscales ', 'Procesos De Formalización De Propiedad Privada Rural']
        }])
      setOptions(
        {
          responsive: true,
          plugins: {
            legend: {
              position: 'top'
            }
          },
          scales: {
            x: {
              ticks: {
                callback: function (value, index, values) {
                  // Abreviar las etiquetas si son demasiado largas
                  const label = this.getLabelForValue(value)
                  return label.length > 10 ? label.slice(0, 10) + '...' : label
                }
              }
            }
          }
        }
        {
          responsive: true,
          scales: {
            x: {
              ticks: {
                maxRotation: 45, // Rotación máxima de las etiquetas
                minRotation: 30 // Rotación mínima de las etiquetas
              }
            }
          }
        }
        {
          responsive: true,
          scales: {
            x: {
              ticks: {
                font: {
                  size: 10 // Ajustar tamaño de fuente
                }
              }
            }
          }
        }
        {
          indexAxis: 'y', // Cambia la orientación de las barras a horizontal
          responsive: true,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              enabled: true
            }
          },
          scales: {
            x: {
              beginAtZero: true // Asegúrate de que el eje x comience en 0
            },
            y: {
              ticks: {
                callback: function (value) {
                  // Puedes ajustar la visibilidad o abreviar etiquetas largas si es necesario
                  return value.length > 10 ? value.slice(0, 10) + '...' : value
                }
              }
            }
          }
        }
      )
    }, 6000)
 */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-100 p-3  text-white" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds[0]} onActiveViewChange={activeViewChangeHandler} />
      )}
      <>
        {
          (dataGrafico.length > 0/*  && poligonoSeleccionado.departmentSelect */) && (
            <div style={{ padding: '10px', width: '100%', height: '400px', border: 'solid', borderRadius: '10px', backgroundColor: 'white', display: 'flex', justifyContent: 'center' }}>
              {
                totalPage > 1 &&
                  <Pagination
                    current={currentpage}
                    size="default"
                    totalPage={totalPage}
                    onChangePage={e => { setCurrentpage(e) }}
                  />
              }
              {
                  dataGrafico.map((d, i) => (
                    currentpage === (i + 1) &&
                    <Bar options={options} data={d} ref={chartRef} onClick={handleChartClick} />
                  ))
              }
          </div>
          )}
        {
          widgetModules?.MODAL(mensajeModal, setMensajeModal)
        }
      </>
    </div>
  )
}

export default Indicadores

const ordenarDatos = (data) => {
  // Combinar las etiquetas y los valores correspondientes en un solo array de objetos
  const combinedData = data.labels.map((label, index) => ({
    label: label,
    value: data.datasets[0].data[index]
  }))

  // Ordenar el array combinado por las etiquetas
  combinedData.sort((a, b) => a.label - b.label)

  // Separar de nuevo las etiquetas y los valores ordenados
  const labelsOrdenados = combinedData.map(item => item.label)
  const dataOrdenada = combinedData.map(item => item.value)

  // Asignar las etiquetas y valores ordenados al objeto original
  data.labels = labelsOrdenados
  data.datasets[0].data = dataOrdenada
  return data
}
