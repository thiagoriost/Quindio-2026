import { React } from 'jimu-core'
import { Table, Button, Loading } from 'jimu-ui'
import { exportService } from '../../services/export.service'

interface ColumnConfig {
    field: string
    label: string
    width?: string | number
}

interface ResultTableProps<T = any> {
    data: T[]
    rawFeatures?: __esri.Graphic[]
    columns: ColumnConfig[]
    pageSize?: number
    enableExport?: boolean
    loading?: boolean
    onBack?: () => void
    onRowClick?: (row: T, index: number) => void
}

export const ResultTable = <T extends Record<string, any>>({
    data,
    rawFeatures,
    columns,
    pageSize = 10,
    enableExport = false,
    loading = false,
    onBack,
    onRowClick
}: ResultTableProps<T>) => {

    const [page, setPage] = React.useState(0)
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)

    const totalPages = Math.ceil(data.length / pageSize)

    const paginatedData = React.useMemo(() => {
        const start = page * pageSize
        return data.slice(start, start + pageSize)
    }, [data, page, pageSize])

    const handleExport = () => {
        if (!rawFeatures || rawFeatures.length === 0) return
        exportService.exportCSV(rawFeatures, 'resultados.csv')
    }

    const handleRowClick = (row: T, index: number) => {
        setSelectedIndex(index)
        onRowClick?.(row, index)
    }

    const next = () => {
        if (page < totalPages - 1) setPage(p => p + 1)
    }

    const prev = () => {
        if (page > 0) setPage(p => p - 1)
    }

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden'
            }}
        >

            {/* HEADER */}
            <div style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8
            }}>
                {onBack ? (
                    <Button size="sm" onClick={onBack}>
                        Nueva búsqueda
                    </Button>
                ) : <div />}

                {enableExport && (
                    <Button
                        size="sm"
                        type="primary"
                        onClick={handleExport}
                        disabled={!rawFeatures?.length}
                    >
                        Exportar
                    </Button>
                )}
            </div>

            {/* TABLE AREA (ÚNICO SCROLL) */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto'
                }}
            >
                <Table hover style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col.field} style={{ width: col.width }}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedData.map((row, index) => (
                            <tr
                                key={index}
                                onClick={() => handleRowClick(row, index)}
                                style={{
                                    cursor: onRowClick ? 'pointer' : 'default',
                                    backgroundColor:
                                        selectedIndex === index ? '#e7f1ff' : undefined
                                }}
                            >
                                {columns.map(col => (
                                    <td key={col.field}>
                                        {row[col.field]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* FOOTER */}
            <div
                style={{
                    flexShrink: 0,
                    borderTop: '1px solid #eee',
                    paddingTop: 8,
                    marginTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <div>
                    Total registros: <strong>{data.length}</strong>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Button size="sm" disabled={page === 0} onClick={prev}>
                            Anterior
                        </Button>

                        <span>
                            Página {page + 1} de {totalPages}
                        </span>

                        <Button
                            size="sm"
                            disabled={page >= totalPages - 1}
                            onClick={next}
                        >
                            Siguiente
                        </Button>
                    </div>
                )}
            </div>

            {loading && <Loading />}
        </div>
    )
}