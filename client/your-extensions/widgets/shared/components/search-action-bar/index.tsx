/**
 * @fileoverview Componente de barra de acciones de búsqueda reutilizable.
 * Proporciona botones de búsqueda y limpieza con estados de carga y ayuda contextual.
 *
 * @module shared/components/search-action-bar
 * @requires jimu-core
 * @requires jimu-ui
 *
 * @author IGAC - DIP
 * @since 2024
 */

/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Button, /* Loading, */ Tooltip, Icon } from 'jimu-ui'
import HelpOutlined from 'jimu-icons/svg/outlined/suggested/help.svg'
import './style.scss'

/**
 * Propiedades del componente SearchActionBar.
 *
 * @interface SearchActionBarProps
 */
export interface SearchActionBarProps {
  /** Callback ejecutado al hacer clic en el botón de búsqueda */
  onSearch: () => void
  /** Callback ejecutado al hacer clic en el botón de limpiar */
  onClear: () => void
  /** Indica si la búsqueda está en progreso (muestra estado de carga) */
  loading?: boolean
  /** Deshabilita el botón de búsqueda */
  disableSearch?: boolean
  /** Deshabilita el botón de limpiar */
  disableClear?: boolean
  /** Texto del botón de búsqueda */
  searchLabel?: string
  /** Texto del botón de limpiar */
  clearLabel?: string
  /** Texto de ayuda mostrado en tooltip */
  helpText?: string
}

/**
 * Barra de acciones de búsqueda con botones de buscar y limpiar.
 * Incluye soporte para estados de carga, deshabilitación y tooltip de ayuda.
 *
 * @component
 * @param {SearchActionBarProps} props - Propiedades del componente
 * @returns {JSX.Element} Barra de acciones con botones de búsqueda y limpieza
 *
 * @example
 * <SearchActionBar
 *   onSearch={() => handleSearch()}
 *   onClear={() => handleClear()}
 *   loading={isLoading}
 *   helpText="Busca por nombre o código"
 * />
 */
export const SearchActionBar: React.FC<SearchActionBarProps> = ({
  onSearch,
  onClear,
  loading = false,
  disableSearch = false,
  disableClear = false,
  searchLabel = 'Buscar',
  clearLabel = 'Limpiar',
  helpText = ''
}) => {

  /**
   * Manejador del evento de búsqueda.
   * Solo ejecuta si no está cargando y no está deshabilitado.
   *
   * @returns {void}
   */
  const handleSearch = () => {
    if (!loading && !disableSearch) {
      onSearch?.()
    }
  }

  /**
   * Manejador del evento de limpieza.
   * Solo ejecuta si no está deshabilitado.
   *
   * @returns {void}
   */
  const handleClear = () => {
    if (!disableClear) {
      onClear?.()
    }
  }

  return (
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
        {/* Asi para cargar spinner dentro del boton sin que se mueva el texto
        {loading && <Loading width={16} height={16} className="mr-2" />}
        {searchLabel}
      */}

        {loading ? 'Buscando...' : searchLabel}
      </Button>

    </div>
  )
}
