import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  className?: string
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  className,
  emptyMessage = 'No records yet — connect your data source to populate this table.',
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className='w-full min-w-[720px] border-collapse text-sm'>
        <thead>
          <tr className='border-b border-border/60 text-left text-micro uppercase tracking-wide text-brand-muted'>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-2.5 font-medium first:px-6', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className='px-6 py-10 text-center text-sm text-brand-muted'
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                className='border-b border-border/40 last:border-0 hover:bg-brand-cornflower/5'
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 first:px-6', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
