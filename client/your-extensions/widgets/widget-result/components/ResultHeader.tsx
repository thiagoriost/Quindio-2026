/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Button } from 'jimu-ui'

interface Props {
  title: string
  onReturn?: () => void
  onExport?: () => void
}

export const ResultHeader = ({ title, onReturn, onExport }: Props) => {

  return (
    <div
      style={{
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        overflow: 'hidden'
      }}
    >

      {/* TOP BAR */}
      <div
        style={{
          background: '#8ca252',
          color: '#fff',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ fontWeight: 600 }}>
          {title}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ cursor: 'pointer' }}>⌃</span>
          <span style={{ cursor: 'pointer' }}>✕</span>
        </div>
      </div>

      {/* ACTION BAR */}
      <div
        style={{
          background: '#f4f4f4',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >

        <Button
          size="sm"
          type="secondary"
          onClick={onReturn}
        >
          Nueva búsqueda
        </Button>

        <Button
          size="sm"
          type="primary"
          onClick={onExport}
        >
          Exportar
        </Button>

      </div>

    </div>
  )
}