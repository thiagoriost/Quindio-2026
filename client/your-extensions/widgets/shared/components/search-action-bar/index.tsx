/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Button, /* Loading, */ Tooltip, Icon } from 'jimu-ui'
import HelpOutlined from 'jimu-icons/svg/outlined/suggested/help.svg'
import { validaLoggerLocalStorage} from "../../../shared/utils/export.utils"

// @ts-expect-error
import './style.scss'

/**
 * Props del componente {@link SearchActionBar}.
 */
export interface SearchActionBarProps {
  /**
   * Función que se ejecuta al hacer clic en el botón de búsqueda.
   */
  onSearch: () => void

  /**
   * Función que se ejecuta al hacer clic en el botón de limpiar.
   */
  onClear: () => void

  /**
   * Indica si el componente está en estado de carga.
   * Cuando es `true`, deshabilita los botones y cambia el texto del botón de búsqueda.
   * @default false
   */
  loading?: boolean

  /**
   * Deshabilita el botón de búsqueda.
   * @default false
   */
  disableSearch?: boolean

  /**
   * Deshabilita el botón de limpiar.
   * @default false
   */
  disableClear?: boolean

  /**
   * Texto personalizado para el botón de búsqueda.
   * @default "Buscar"
   */
  searchLabel?: string

  /**
   * Texto personalizado para el botón de limpiar.
   * @default "Limpiar"
   */
  clearLabel?: string

  /**
   * Texto de ayuda contextual mostrado en un tooltip.
   * Si está vacío, el ícono de ayuda no se renderiza.
   * @default ""
   */
  helpText?: string
  /**
   * Texto de error mostrado debajo de los botones.
   * Si está vacío, no se renderiza ningún mensaje de error.
   * @default ""
   */
  error?: string
}

/**
 * Barra de acciones reutilizable para componentes de búsqueda en widgets de
 * ArcGIS Experience Builder.
 *
 * Proporciona:
 * - Botón de **Buscar**
 * - Botón de **Limpiar**
 * - Ícono opcional de ayuda con tooltip
 *
 * Incluye manejo interno de estados `loading` y deshabilitación de botones,
 * evitando ejecuciones accidentales mientras se procesa una búsqueda.
 *
 * @component
 * @param {SearchActionBarProps} props - Propiedades del componente.
 * @returns {JSX.Element} Barra de acciones renderizada.
 *
 * @example
 * ```tsx
 * <SearchActionBar
 *   onSearch={handleSearch}
 *   onClear={handleClear}
 *   loading={isLoading}
 *   disableSearch={!formValid}
 *   helpText="Ingrese un número predial válido"
 * />
 * ```
 */
/**
 * @date 2026-02-13
 * @author Ing.CEF
 * @param param0
 * @dateUpdated 2026-02-17
 * @changes inclusión clase estilo btnsContner, desde style.scss por medio de un div contenedor
 * @returns {Object} HTML
 */
export const SearchActionBar: React.FC<SearchActionBarProps> = ({
  onSearch,
  onClear,
  loading = false,
  disableSearch = false,
  disableClear = false,
  searchLabel = 'Buscar',
  clearLabel = 'Limpiar',
  helpText = '',
  error = ''
}) => {

  /**
   * Maneja la acción de búsqueda.
   * Evita la ejecución si el componente está cargando
   * o si el botón está deshabilitado.
   */
  const handleSearch = () => {
    if(validaLoggerLocalStorage('logger')) console.log({loading, disableSearch})
    if (!loading && !disableSearch) {
      onSearch?.()
    }
  }

  /**
   * Maneja la acción de limpiar.
   * Evita la ejecución si el botón está deshabilitado.
   */
  const handleClear = () => {
    if (!disableClear) {
      onClear?.()
    }
  }

  return (
	<div className='btnsContner'>
	    <div className="search-action-bar">

	      {helpText && (
	        <Tooltip title={helpText} placement="bottom">
	          <span className="help-icon-wrapper mr-2">
	            <Icon icon={HelpOutlined} size={16} />
	          </span>
	        </Tooltip>
	      )}


	      <Button
	        type="default"
	        onClick={handleClear}
	        disabled={disableClear || loading}
	      >
	        {clearLabel}
	      </Button>

	      <Button
	        type="primary"
	        onClick={handleSearch}
	        disabled={disableSearch || loading}
	      >
	        {loading ? 'Buscando...' : searchLabel}
	      </Button>

	    </div>
      {disableSearch && (
        <div>
          {error}
        </div>
      )}
	</div>
  )
}
