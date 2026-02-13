/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Button, Loading, Tooltip, Icon } from 'jimu-ui'
import HelpOutlined from 'jimu-icons/svg/outlined/suggested/help.svg'
import './style.scss'

export interface SearchActionBarProps {
  onSearch: () => void
  onClear: () => void
  loading?: boolean
  disableSearch?: boolean
  disableClear?: boolean
  searchLabel?: string
  clearLabel?: string
  helpText?: string
}

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

  const handleSearch = () => {
    if (!loading && !disableSearch) {
      onSearch?.()
    }
  }

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
