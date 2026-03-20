import { React } from 'jimu-core'
import TablaResultados from './TablaResultados/TablaResultados'
import InputSelect from './InputSelect/InputSelect'
import InputTextArea from './InputTextArea/InputTextArea'
import ModalComponent from './modal/ModalComponent'
import TabIndicadores from './TabIndicadores/TabIndicadores'
import OurLoading from './our_loading/OurLoading'

/**
 * Wrapper para renderizar la tabla de resultados de consulta.
 */
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

/**
 * Wrapper para el selector reutilizable.
 */
const INPUTSELECT = (dataArray, onChange, value, label, campo) => (
    <InputSelect dataArray={dataArray} onChange={onChange}
        value={value} label={label} campo={campo}
    />
)

/**
 * Wrapper para el campo de texto multilínea.
 */
const INPUT_TEXTAREA = (value, onChange, label) => (
    <InputTextArea
        value={value}
        onChange={onChange}
        label={label}
    />
)

/**
 * Renderiza el modal de mensajes del módulo.
 *
 * @param {Object} mensajeModal
 * @param {boolean} mensajeModal.deployed Indica si el modal está visible.
 * @param {string} mensajeModal.title Título del modal.
 * @param {string} mensajeModal.body Mensaje principal del modal.
 * @param {string} [mensajeModal.type] Tipo de mensaje (por ejemplo: info, warning, error).
 * @param {string} [mensajeModal.subBody] Mensaje secundario opcional.
 * @param {(payload: Object) => void} setMensajeModal Setter del estado del modal.
 * @returns {JSX.Element}
 */
const MODAL = (mensajeModal, setMensajeModal) => (
    <ModalComponent
        mensajeModal={mensajeModal}
        setMensajeModal={setMensajeModal}
    />
)

/**
 * Wrapper para la pestaña de filtros de indicadores.
 */
const FILTROS_INDICADORES = (dispatch, departamentos, jimuMapView) => (
    <TabIndicadores dispatch={dispatch} departamentos={departamentos} jimuMapView={jimuMapView}/>
)

/**
 * Wrapper para el loader del módulo.
 */
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
