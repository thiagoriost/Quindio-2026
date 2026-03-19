/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { Button } from 'jimu-ui'

interface Props {
  total: number
  page?: number
  totalPages?: number
  onPrev?: () => void
  onNext?: () => void
}

export const ResultFooter = ({
  total,
  page = 1,
  totalPages = 1,
  onPrev,
  onNext
}: Props) => {

  return (
    <div
      style={{
        borderTop: '1px solid #ddd',
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f4f4f4',
        width: '-webkit-fill-available',
        marginRight: 10
      }}
    >

      <div style={{ fontSize: 12 }}>
        Total registros: {total}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        <Button
          size="sm"
          type="secondary"
          disabled={page <= 1}
          onClick={onPrev}
        >
          Anterior
        </Button>

        <span style={{ fontSize: 12 }}>
          Página {page} de {totalPages}
        </span>

        <Button
          size="sm"
          type="secondary"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          Siguiente
        </Button>

      </div>

    </div>
  )
}