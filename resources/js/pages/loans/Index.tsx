import { PageProps } from '@inertiajs/core'
import { Link, router } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import MainLayout from '../Layouts/MainLayout'
import { Eye, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MapPin, MapPinOff } from 'lucide-react'

interface LoanListing {
  id: number
  account_title: string
  client_id: string
  village?: string
  group_name?: string
  mobile: string
  loan_type?: string
  disbursed_amount?: number
  latitude?: string
  longitude?: string
  updated_at: string
}

interface Props extends PageProps {
  listings: {
    data: LoanListing[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  stats: {
    total: number
    with_location: number
    without_location: number
    location_percentage: number
  }
  filters?: {
    search?: string
  }
}

export default function Index({ listings, stats, filters = {} }: Props) {
  const handleSearch = (value: string) => {
    router.get(
      route('loans.listing.index'),
      { search: value, page: 1 },
      { preserveState: true, replace: true }
    )
  }

  const goToPage = (page: number) => {
    router.get(
      route('loans.listing.index'),
      { page, per_page: listings.per_page, search: filters.search },
      { preserveState: true, replace: true }
    )
  }

  const changePerPage = (value: string) => {
    router.get(
      route('loans.listing.index'),
      { page: 1, per_page: value, search: filters.search },
      { preserveState: true, replace: true }
    )
  }

  const currentSearch = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('search') || ''
    : filters.search || ''

  return (
    <MainLayout title="Loan Listings">
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* Location Statistics Cards */}
        <div className=" ">
         

          {/* Location Coverage Card */}
          <Card className="border shadow-sm max-w-screen">
            <CardContent className="">
              <div className=" max-w-screen md:flex flex-row items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location Coverage</p>
                  <h3 className="mt-2 text-3xl font-bold text-blue-600">{stats.location_percentage}%</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stats.with_location} of {stats.total} records
                  </p>
                </div>
                <div className="relative">
                  <div className="h-16 w-16">
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeDasharray={`${stats.location_percentage}, 100`}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Header Section */}
        <div className="hidden md:block">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Loan Listings Management</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor and manage all loan applications with location tracking
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="absolute right-10">
              <div className="relative max-w-screen">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search loans by account title, client ID, or mobile..."
                  className="h-10 pl-10"
                  defaultValue={currentSearch}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch((e.target as HTMLInputElement).value)
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value !== currentSearch) {
                      handleSearch(e.target.value)
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <Card className="border shadow-sm md:shadow-md">
          <CardHeader className="md:pb-3">
            <div className="md:hidden">
              <div className="flex flex-col justify-between gap-4 sm:items-center">
                <div className="text-center">Loan Listings</div>
                <div>
                  <CardDescription className="text-center">
                    Showing {listings.data.length} of {listings.total} loans
                  </CardDescription>
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute top-1/2 left-3 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search loans..."
                      className="h-9 w-full pl-8 text-sm"
                      defaultValue={currentSearch}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch((e.target as HTMLInputElement).value)
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value !== currentSearch) {
                          handleSearch(e.target.value)
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Loan Listings</CardTitle>
                <CardDescription>
                  {listings.total} loans found • Page {listings.current_page} of {listings.last_page}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">Rows:</span>
                  <Select
                    value={String(listings.per_page)}
                    onValueChange={changePerPage}
                  >
                    <SelectTrigger className="h-8 w-20">
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
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* MOBILE VIEW - CARDS */}
            <div className="space-y-4 md:hidden">
              {listings.data.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No loans found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {filters.search ? 'Try adjusting your search terms' : 'No loan records available'}
                    </p>
                  </div>
                </div>
              ) : (
                listings.data.map((listing) => (
                  <div key={listing.id} className="rounded-lg border bg-card p-4 shadow-sm">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{listing.account_title}</h3>
                        <p className="text-sm text-muted-foreground">ID: {listing.client_id}</p>
                      </div>
                      <Badge 
                        className={`ml-2 ${
                          listing.latitude && listing.longitude
                            ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'
                        }`}
                      >
                        {listing.latitude && listing.longitude ? 'Location Set' : 'No Location'}
                      </Badge>
                    </div>

                    {/* Card Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">Village</p>
                        <p className="truncate">{listing.village || '-'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">Group</p>
                        <p className="truncate">{listing.group_name || '-'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">Mobile</p>
                        <p>{listing.mobile}</p>
                      </div>
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">Loan Type</p>
                        <p className="truncate">{listing.loan_type || '-'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">Amount</p>
                        <p className="font-semibold">
                          {listing.disbursed_amount ? listing.disbursed_amount.toLocaleString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">Updated</p>
                        <p>{listing.updated_at ? new Date(listing.updated_at).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>

                    {/* Coordinates Section */}
                    <div className="mb-4 p-3 bg-muted/30 rounded-md">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="font-medium text-xs text-muted-foreground">Longitude</p>
                          <strong className={`text-sm ${listing.longitude ? 'text-primary' : 'text-muted-foreground'}`}>
                            {listing.longitude ? listing.longitude : 'Not set'}
                          </strong>
                        </div>
                        <div>
                          <p className="font-medium text-xs text-muted-foreground">Latitude</p>
                          <strong className={`text-sm ${listing.latitude ? 'text-primary' : 'text-muted-foreground'}`}>
                            {listing.latitude ? listing.latitude : 'Not set'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        DB ID: {listing.id}
                      </div>
                      <Button asChild size="sm" variant="default" className="gap-1">
                        <Link href={route('loans.listing.show', listing.id)}>
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP VIEW - TABLE */}
            <div className="hidden md:block overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-sm font-semibold">DB ID</TableHead>
                    <TableHead className="text-sm font-semibold">Account Title</TableHead>
                    <TableHead className="text-sm font-semibold">Client ID</TableHead>
                    <TableHead className="text-sm font-semibold">Village</TableHead>
                    <TableHead className="text-sm font-semibold">Group</TableHead>
                    <TableHead className="text-sm font-semibold">Mobile</TableHead>
                    <TableHead className="text-sm font-semibold">Loan Type</TableHead>
                    <TableHead className="text-sm font-semibold">Amount</TableHead>
                    <TableHead className="text-sm font-semibold">Location Status</TableHead>
                    <TableHead className="text-sm font-semibold">Updated</TableHead>
                    <TableHead className="text-sm font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-80 py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="rounded-full bg-muted p-4">
                            <Search className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">No loans found</p>
                            <p className="text-xs text-muted-foreground">
                              {filters.search ? 'Try adjusting your search terms' : 'No loan records available'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    listings.data.map((listing) => (
                      <TableRow key={listing.id} className="border hover:bg-muted/50">
                        <TableCell className="py-3 font-medium">{listing.id}</TableCell>
                        <TableCell className="py-3">
                          <div className="font-medium">{listing.account_title}</div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {listing.client_id}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">{listing.village || '-'}</TableCell>
                        <TableCell className="py-3">{listing.group_name || '-'}</TableCell>
                        <TableCell className="py-3 font-medium">{listing.mobile}</TableCell>
                        <TableCell className="py-3">{listing.loan_type || '-'}</TableCell>
                        <TableCell className="py-3 font-medium">
                          {listing.disbursed_amount
                            ? `Ksh ${Number(listing.disbursed_amount).toLocaleString()}`
                            : '-'}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={`w-fit px-2 py-1 text-xs font-medium ${
                                listing.latitude && listing.longitude
                                  ? 'border-green-200 bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                            >
                              {listing.latitude && listing.longitude ? 'Location Set' : 'No Location'}
                            </Badge>
                            {listing.latitude && listing.longitude && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <div className="truncate max-w-[180px]">
                                  Lat: {listing.latitude}, Lng: {listing.longitude}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-sm">
                          {listing.updated_at
                            ? new Date(listing.updated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Button asChild size="sm" variant="default" className="gap-1">
                            <Link href={route('loans.listing.show', listing.id)}>
                              <Eye className="h-4 w-4" />
                              <span className="hidden lg:inline">View Details</span>
                              <span className="lg:hidden">View</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* PAGINATION */}
          {listings.total > 0 && (
            <CardFooter className="py-3 border-t">
              <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
                {/* Showing entries */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
                  <span>
                    Showing {listings.from} to {listings.to} of {listings.total} entries
                  </span>
                </div>

                <div className="flex flex-col items-center gap-3 sm:flex-row md:gap-6">
                  {/* Rows per page - Desktop only */}
                  <div className="hidden items-center gap-1.5 md:flex">
                    <span className="text-sm">Rows per page</span>
                    <Select value={String(listings.per_page)} onValueChange={changePerPage}>
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
                        disabled={listings.current_page === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => goToPage(listings.current_page - 1)}
                        disabled={listings.current_page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>

                    <span className="min-w-[60px] text-center text-xs md:min-w-[80px] md:text-sm">
                      Page {listings.current_page} of {listings.last_page}
                    </span>

                    <div className="hidden md:flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => goToPage(listings.current_page + 1)}
                        disabled={listings.current_page === listings.last_page}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => goToPage(listings.last_page)}
                        disabled={listings.current_page === listings.last_page}
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
                        disabled={listings.current_page === 1}
                      >
                        <ChevronsLeft className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => goToPage(listings.current_page - 1)}
                        disabled={listings.current_page === 1}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => goToPage(listings.current_page + 1)}
                        disabled={listings.current_page === listings.last_page}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => goToPage(listings.last_page)}
                        disabled={listings.current_page === listings.last_page}
                      >
                        <ChevronsRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </MainLayout>
  )
}