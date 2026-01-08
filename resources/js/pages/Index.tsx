import { PageProps } from '@inertiajs/core';
import { Building2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import MainLayout from './Layouts/MainLayout';

// ShadCN Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from '@inertiajs/react';

// Define the Outpost type
interface Outpost {
    id: number;
    branch_code: string;
    name: string;
    created_at: string;
    updated_at: string;
}

// Define props with outposts
interface Props extends PageProps {
    outposts: Outpost[];
}

export default function Welcome({ outposts }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortColumn, setSortColumn] = useState<keyof Outpost>('id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Filter and sort outposts
    const filteredOutposts = outposts.filter(
        (outpost) =>
            outpost.name.toLowerCase().includes(searchTerm.toLowerCase()) || outpost.branch_code.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Sort data
    const sortedOutposts = [...filteredOutposts].sort((a, b) => {
        if (sortDirection === 'asc') {
            return a[sortColumn] > b[sortColumn] ? 1 : -1;
        } else {
            return a[sortColumn] < b[sortColumn] ? 1 : -1;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedOutposts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOutposts = sortedOutposts.slice(startIndex, startIndex + itemsPerPage);

    const handleSort = (column: keyof Outpost) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

  

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <MainLayout title="Outposts">
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Enhanced Header Section for md+ screens */}
                <div className="hidden md:block">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Outposts Management</h1>
                        <p className="mt-2 text-muted-foreground">Manage and monitor all your organization's outposts</p>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                            <div className="relative max-w-md">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search outposts by name or branch code..."
                                    className="h-10 pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                       
                    </div>
                </div>

                {/* Main Table Card - Enhanced for md+ screens */}
                <Card className="border shadow-sm md:shadow-md">
                    <CardHeader className="md:pb-3">
                        <div className="md:hidden">
                            {/* Mobile header remains unchanged */}
                            <div className="flex flex-col justify-between gap-4 sm:items-center">
                                <div className="text-center">Outposts List</div>
                                <div>
                                    <CardDescription className="text-center">
                                        Showing {paginatedOutposts.length} of {filteredOutposts.length} outposts
                                    </CardDescription>
                                </div>
                                <div className="flex w-full items-center gap-2 sm:w-auto">
                                    <div className="relative flex-1 sm:flex-initial">
                                        <Search className="absolute top-1/2 left-3 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search outposts..."
                                            className="h-9 w-full pl-8 text-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="hidden md:flex md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold">Outposts</CardTitle>
                                <CardDescription>
                                    {filteredOutposts.length} outposts found • Sorted by {sortColumn} ({sortDirection})
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm text-muted-foreground">Rows:</span>
                                    <Select
                                        value={itemsPerPage.toString()}
                                        onValueChange={(value) => {
                                            setItemsPerPage(Number(value));
                                            setCurrentPage(1);
                                        }}
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
                    
                    <CardContent className="p-0">
                        <div className="overflow-hidden rounded-lg border md:rounded-xl">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead 
                                            className="cursor-pointer text-xs font-medium hover:bg-muted md:text-sm md:font-semibold" 
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <span>Outpost Name</span>
                                                {sortColumn === 'name' && (
                                                    <span className="text-[10px] md:text-xs">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="cursor-pointer text-xs font-medium hover:bg-muted md:text-sm md:font-semibold" 
                                            onClick={() => handleSort('branch_code')}
                                        >
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <span>Branch Code</span>
                                                {sortColumn === 'branch_code' && (
                                                    <span className="text-[10px] md:text-xs">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="hidden text-xs font-medium md:table-cell md:text-sm md:font-semibold">
                                            Created
                                        </TableHead>
                                        <TableHead className="hidden text-xs font-medium md:table-cell md:text-sm md:font-semibold">
                                            Updated
                                        </TableHead>
                                        <TableHead className="text-right text-xs font-medium md:text-sm md:font-semibold">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedOutposts.length > 0 ? (
                                        paginatedOutposts.map((outpost) => (
                                            <TableRow key={outpost.id} className="group hover:bg-muted/50">
                                                <TableCell className="text-xs md:text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary/10 md:flex">
                                                            <Building2 className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">{outpost.name}</span>
                                                            <div className="mt-1 text-xs text-muted-foreground md:hidden">
                                                                Created: {formatDate(outpost.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="md:py-3">
                                                    <Badge variant="secondary" className="px-2 py-1 font-mono text-xs md:text-sm">
                                                        {outpost.branch_code}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden text-xs md:table-cell md:text-sm">
                                                    {formatDate(outpost.created_at)}
                                                </TableCell>
                                                <TableCell className="hidden text-xs md:table-cell md:text-sm">
                                                    {formatDate(outpost.updated_at)}
                                                </TableCell>
                                                <TableCell className="text-right md:py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            asChild 
                                                            variant="ghost" 
                                                            size="xs" 
                                                            className="h-8 gap-1.5 px-2 text-xs bg-primary text-primary-foreground hover:text-primary md:size-sm md:px-3 md:text-sm"
                                                        >
                                                            <Link href={route('outposts.groups', outpost.id)}>
                                                                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                                                                <span className="hidden md:inline">View Details</span>
                                                                <span className="md:hidden">View</span>
                                                            </Link>
                                                        </Button>
                                                      
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-80 py-8 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="rounded-full bg-muted p-4">
                                                        <Building2 className="h-8 w-8 text-muted-foreground md:h-10 md:w-10" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium md:text-base">No outposts found</p>
                                                        <p className="text-xs text-muted-foreground md:text-sm">
                                                            {searchTerm ? 'Try adjusting your search terms' : 'Start by creating your first outpost'}
                                                        </p>
                                                    </div>
                                                    
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    
                    <CardFooter className="py-3">
                        <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
                                <span>
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOutposts.length)} of{' '}
                                    {filteredOutposts.length} entries
                                </span>
                            </div>

                            <div className="flex flex-col items-center gap-3 sm:flex-row md:gap-6">
                                <div className="hidden items-center gap-1.5 md:flex">
                                    <span className="text-sm">Rows per page</span>
                                    <Select
                                        value={itemsPerPage.toString()}
                                        onValueChange={(value) => {
                                            setItemsPerPage(Number(value));
                                            setCurrentPage(1);
                                        }}
                                    >
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

                                <div className="flex items-center gap-1.5">
                                    <div className="hidden md:block">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <span className="min-w-[60px] text-center text-xs md:min-w-[80px] md:text-sm">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <div className="hidden md:block">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Mobile pagination buttons (unchanged) */}
                                    <div className="md:hidden">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronsLeft className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="xs"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronsRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardFooter>
                </Card>

              
            </div>
        </MainLayout>
    );
}