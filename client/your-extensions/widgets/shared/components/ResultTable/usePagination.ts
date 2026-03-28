import { useState, useMemo } from 'react'

export const usePagination = <T>(
  data: T[],
  pageSize: number
) => {

  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(data.length / pageSize)

  const paginatedData = useMemo(() => {
    const start = page * pageSize
    return data.slice(start, start + pageSize)
  }, [data, page, pageSize])

  const next = () => setPage(p => Math.min(p + 1, totalPages - 1))
  const prev = () => setPage(p => Math.max(p - 1, 0))

  return {
    page,
    totalPages,
    paginatedData,
    next,
    prev,
    setPage
  }
}