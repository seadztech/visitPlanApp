import React from 'react'
import { Link, router } from '@inertiajs/react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { CardFooter } from '@/components/ui/card'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
}

export interface PaginatedData<T> {
  data: T[]
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number
  to: number
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: PaginatedData<T> | {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  route: string
  searchPlaceholder?: string
}

// Pagination Component
interface PaginationProps {
  route: string
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number
  to: number
  search?: string
}

function Pagination({
  route,
  currentPage,
  lastPage,
  perPage,
  total,
  from,
  to,
  search,
}: PaginationProps) {
  const goToPage = (page: number) => {
    router.get(
      route,
      { page, per_page: perPage, search },
      { preserveState: true, replace: true }
    )
  }

  const changePerPage = (value: string) => {
    router.get(
      route,
      { page: 1, per_page: value, search },
      { preserveState: true, replace: true }
    )
  }

  return (
    <CardFooter className="py-3">
      <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
        {/* Showing entries */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
          <span>
            Showing {from} to {to} of {total} entries
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row md:gap-6">
          {/* Rows per page */}
          <div className="hidden items-center gap-1.5 md:flex">
            <span className="text-sm">Rows per page</span>
            <Select value={String(perPage)} onValueChange={changePerPage}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <span className="min-w-[60px] text-center text-xs md:min-w-[80px] md:text-sm">
              Page {currentPage} of {lastPage}
            </span>

            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(lastPage)}
                disabled={currentPage === lastPage}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-3 w-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => goToPage(lastPage)}
                disabled={currentPage === lastPage}
              >
                <ChevronsRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CardFooter>
  )
}

export default function DataTable<T extends { id: number }>({
  columns,
  data,
  route,
  searchPlaceholder = 'Search...',
}: DataTableProps<T>) {
  // Normalize the data structure to handle both formats
  const normalizedData = 'current_page' in data 
    ? {
        data: data.data,
        currentPage: data.current_page,
        lastPage: data.last_page,
        perPage: data.per_page,
        total: data.total,
        from: data.from,
        to: data.to,
      }
    : data

  const handleSearch = (value: string) => {
    router.get(
      route,
      { search: value, page: 1 },
      { preserveState: true, replace: true }
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Loan Listings</CardTitle>
          <div className="w-full sm:w-64">
            <Input
              type="search"
              placeholder={searchPlaceholder}
              defaultValue={new URLSearchParams(window.location.search).get('search') || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const search = (e.target as HTMLInputElement).value
                  handleSearch(search)
                }
              }}
              onBlur={(e) => {
                if (e.target.value !== new URLSearchParams(window.location.search).get('search')) {
                  handleSearch(e.target.value)
                }
              }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="h-10 px-4 text-left font-medium text-muted-foreground"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {normalizedData.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                normalizedData.data.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/50">
                    {columns.map((column) => (
                      <td key={String(column.key)} className="p-4">
                        {column.render
                          ? column.render(row)
                          : String(row[column.key as keyof T] || '-')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {normalizedData.total > 0 && (
        <Pagination
          route={route}
          currentPage={normalizedData.currentPage}
          lastPage={normalizedData.lastPage}
          perPage={normalizedData.perPage}
          total={normalizedData.total}
          from={normalizedData.from}
          to={normalizedData.to}
          search={new URLSearchParams(window.location.search).get('search') || undefined}
        />
      )}
    </Card>
  )
}