import { React } from 'jimu-core'
import TablaResultados from './TablaResultados/TablaResultados'
import InputSelect from './InputSelect/InputSelect'
import InputTextArea from './InputTextArea/InputTextArea'
import ModalComponent from './modal/ModalComponent'
import TabIndicadores from './TabIndicadores/TabIndicadores'
import OurLoading from './our_loading/OurLoading'

const TABLARESULTADOS = ({ rows, columns, jimuMapView, lastGeometriDeployed, LayerSelectedDeployed, graphicsLayerDeployed, setLastGeometriDeployed, setMostrarResultadoFeaturesConsulta }) => (
    <TablaResultados
        rows={rows}
        columns={columns}
        jimuMapView={jimuMapView}
        lastGeometriDeployed={lastGeometriDeployed}
        LayerSelectedDeployed={LayerSelectedDeployed}
        graphicsLayerDeployed={graphicsLayerDeployed}
        setLastGeometriDeployed={setLastGeometriDeployed}
        setMostrarResultadoFeaturesConsulta={setMostrarResultadoFeaturesConsulta}
    />
)

const INPUTSELECT = (dataArray, onChange, value, label, campo) => (
    <InputSelect dataArray={dataArray} onChange={onChange}
        value={value} label={label} campo={campo}
    />
)

const INPUT_TEXTAREA = (value, onChange, label) => (
    <InputTextArea
        value={value}
        onChange={onChange}
        label={label}
    />
)
/**
 *
 * @param mensajeModal {deployed:boolean, tittle: string, body:string, type:, subBody:string}
 * @param setMensajeModal
 * @returns
 */
const MODAL = (mensajeModal, setMensajeModal) => (
    <ModalComponent
        mensajeModal={mensajeModal}
        setMensajeModal={setMensajeModal}
    />
)

const FILTROS_INDICADORES = (dispatch, departamentos, jimuMapView) => (
    <TabIndicadores dispatch={dispatch} departamentos={departamentos} jimuMapView={jimuMapView}/>
)

const OUR_LOADING = () => (
    <OurLoading />
)

export {
  TABLARESULTADOS,
  INPUTSELECT,
  INPUT_TEXTAREA,
  MODAL,
  FILTROS_INDICADORES,
  OUR_LOADING
}
