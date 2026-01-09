import { PageProps } from '@inertiajs/core';
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Plus,
    Search,
    Calendar,
    Clock,
    Users,
    TrendingUp,
    TrendingDown,
    Banknote,
    Wallet
} from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';

// Define the Group type
interface Group {
    id: number;
    outpost_id: number;
    branch_id: string;
    village: string;
    credit_officer_id: string;
    group_id: string;
    group_name: string;
    group_product_id: string;
    savings_balance_b4: number;
    savings_balance_after: number;
    loan_balance_b4: number;
    loan_balance_after: number;
    arrears_b4: number;
    arrears_after: number;
    accts_b4: number;
    accts_after: number;
    venue: string;
    frequency: string;
    meeting_day: string;
    time: string;
    created_at: string;
    updated_at: string;
}

// Define props with groups
interface Props extends PageProps {
    groups: Group[];
    outpostId: string;
}

export default function OutPostGroups({ groups: initialGroups, outpostId }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortColumn, setSortColumn] = useState<keyof Group>('group_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Filter and sort groups
    const filteredGroups = initialGroups.filter(
        (group) =>
            group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.group_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.credit_officer_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort data
    const sortedGroups = [...filteredGroups].sort((a, b) => {
        if (sortDirection === 'asc') {
            return a[sortColumn] > b[sortColumn] ? 1 : -1;
        } else {
            return a[sortColumn] < b[sortColumn] ? 1 : -1;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedGroups.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedGroups = sortedGroups.slice(startIndex, startIndex + itemsPerPage);

    const handleSort = (column: keyof Group) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (timeString: string) => {
        return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Calculate totals
    const totalSavings = filteredGroups.reduce((sum, group) => sum + group.savings_balance_after, 0);
    const totalLoans = filteredGroups.reduce((sum, group) => sum + group.loan_balance_after, 0);
    const totalArrears = filteredGroups.reduce((sum, group) => sum + group.arrears_after, 0);
    const totalAccounts = filteredGroups.reduce((sum, group) => sum + group.accts_after, 0);

    // Get meeting frequency badge color
    const getFrequencyColor = (frequency: string) => {
        switch (frequency) {
            case 'W': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'M': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'F': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        }
    };

    // Get meeting day badge color
    const getDayColor = (day: string) => {
        const days: Record<string, string> = {
            'Monday': 'bg-blue-50 text-blue-700 border-blue-200',
            'Tuesday': 'bg-green-50 text-green-700 border-green-200',
            'Wednesday': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'Thursday': 'bg-purple-50 text-purple-700 border-purple-200',
            'Friday': 'bg-orange-50 text-orange-700 border-orange-200',
            'Saturday': 'bg-red-50 text-red-700 border-red-200',
            'Sunday': 'bg-indigo-50 text-indigo-700 border-indigo-200'
        };
        return days[day] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    return (
        <MainLayout title="Groups">
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Enhanced Header Section for md+ screens */}
                <div className="hidden md:block">
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Groups Listings for this</h1>
                                <p className="mt-2 text-muted-foreground">
                                    Managing {filteredGroups.length} groups for Outpost ID: {outpostId}
                                </p>
                            </div>

                        </div>
                    </div>



                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                            <div className="relative max-w-md">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search groups by name, village, or officer..."
                                    className="h-10 pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="gap-2">
                                <span>Export Data</span>
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <span>Generate Report</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Table Card */}
                <Card className="border shadow-sm md:shadow-md">
                    <CardHeader className="md:pb-3">
                        <div className="md:hidden">
                            {/* Mobile header */}
                            <div className="flex flex-col justify-between gap-4 sm:items-center">
                                <div className="text-center">Groups List</div>
                                <div>
                                    <CardDescription className="text-center">
                                        Showing {paginatedGroups.length} of {filteredGroups.length} groups
                                    </CardDescription>
                                </div>
                                <div className="flex w-full items-center gap-2 sm:w-auto">
                                    <div className="relative flex-1 sm:flex-initial">
                                        <Search className="absolute top-1/2 left-3 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search groups..."
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
                                <CardTitle className="text-lg font-semibold">Groups Overview</CardTitle>
                                <CardDescription>
                                    {filteredGroups.length} groups • Sorted by {sortColumn.replace('_', ' ')} ({sortDirection})
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
                                            onClick={() => handleSort('group_name')}
                                        >
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <span>Group Name</span>
                                                {sortColumn === 'group_name' && (
                                                    <span className="text-[10px] md:text-xs">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>



                                        <TableHead className="text-right text-xs font-medium md:text-sm md:font-semibold">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedGroups.length > 0 ? (
                                        paginatedGroups.map((group) => {
                                            const savingsChange = group.savings_balance_after - group.savings_balance_b4;
                                            const loanChange = group.loan_balance_after - group.loan_balance_b4;
                                            const arrearsChange = group.arrears_after - group.arrears_b4;
                                            const accountsChange = group.accts_after - group.accts_b4;

                                            return (
                                                <TableRow key={group.id} className="group hover:bg-muted/50">
                                                    <TableCell className="text-xs md:text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary/10 md:flex">
                                                                <Users className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium max-w-60">{group.group_name}</div>
                                                                <div className="mt-1 flex items-center gap-1">
                                                                    <Badge variant="outline" className="px-2 py-0.5 text-xs">
                                                                        {group.group_id}
                                                                    </Badge>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`px-2 py-0.5 text-xs ${getFrequencyColor(group.frequency)}`}
                                                                    >
                                                                        {group.frequency === 'W' ? 'Weekly' :
                                                                            group.frequency === 'M' ? 'Monthly' :
                                                                                group.frequency === 'F' ? 'Fortnightly' : group.frequency}
                                                                    </Badge>
                                                                </div>
                                                                <div className="mt-1 text-xs text-muted-foreground md:hidden">
                                                                    Officer: {group.credit_officer_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>





                                                    <TableCell className="text-right md:py-3">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                asChild
                                                                variant="default"
                                                                size="xs"
                                                                className="h-8 gap-1.5 px-2 text-xs hover:bg-primary/10 hover:text-primary md:size-sm md:px-3 md:text-sm"
                                                            >
                                                                <Link href={route('groups.show', group.id)}>
                                                                    <Eye className="h-3 w-3 md:h-4 md:w-4" />
                                                                    <span className="hidden md:inline">View Details</span>
                                                                    <span className="md:hidden">View</span>
                                                                </Link>
                                                            </Button>


                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-80 py-8 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="rounded-full bg-muted p-4">
                                                        <Users className="h-8 w-8 text-muted-foreground md:h-10 md:w-10" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium md:text-base">No groups found</p>
                                                        <p className="text-xs text-muted-foreground md:text-sm">
                                                            {searchTerm ? 'Try adjusting your search terms' : 'Start by creating your first group'}
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
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredGroups.length)} of{' '}
                                    {filteredGroups.length} groups
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

                                    {/* Mobile pagination buttons */}
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
                                            variant="outline"
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