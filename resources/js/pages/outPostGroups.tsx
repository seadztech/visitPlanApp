import { PageProps } from '@inertiajs/core';
import { router } from '@inertiajs/react'; // Add this import
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
import { useState, useEffect } from 'react'; // Add useEffect
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
import { debounce } from 'lodash'; // Add this import

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
    comment_status: 'pending' | 'in-progress' | 'completed';
    remaining_comments: number;
    total_comments: number;
}

// Define props with pagination
interface Props extends PageProps {
    groups: Group[];
    outpostId: string;
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search: string;
        sort_by: string;
        sort_dir: string;
        per_page: number;
    };
}

export default function OutPostGroups({ 
    groups: initialGroups, 
    outpostId, 
    pagination, 
    filters 
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [currentPage, setCurrentPage] = useState(pagination.current_page);
    const [itemsPerPage, setItemsPerPage] = useState(pagination.per_page);
    const [sortColumn, setSortColumn] = useState<keyof Group>(filters.sort_by as keyof Group);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters.sort_dir as 'asc' | 'desc');

    // Debounced search function
    const debouncedSearch = debounce((search: string) => {
        router.get(route('outpost.groups', outpostId), {
            search: search,
            page: 1, // Reset to first page on search
            per_page: itemsPerPage,
            sort_by: sortColumn,
            sort_dir: sortDirection,
        }, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    }, 500);

    // Handle search change
    useEffect(() => {
        if (searchTerm !== filters.search) {
            debouncedSearch(searchTerm);
        }
        
        // Cleanup
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchTerm]);

    // Handle pagination change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(route('outpost.groups', outpostId), {
            search: searchTerm,
            page: page,
            per_page: itemsPerPage,
            sort_by: sortColumn,
            sort_dir: sortDirection,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Handle items per page change
    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1); // Reset to first page
        router.get(route('outpost.groups', outpostId), {
            search: searchTerm,
            page: 1,
            per_page: value,
            sort_by: sortColumn,
            sort_dir: sortDirection,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Handle sort
    const handleSort = (column: keyof Group) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        
        router.get(route('outpost.groups', outpostId), {
            search: searchTerm,
            page: currentPage,
            per_page: itemsPerPage,
            sort_by: column,
            sort_dir: newDirection,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Remove client-side sorting and filtering
    // The data is already sorted and filtered from the backend

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

    // Calculate totals (you might want to move these to backend)
    const totalSavings = initialGroups.reduce((sum, group) => sum + group.savings_balance_after, 0);
    const totalLoans = initialGroups.reduce((sum, group) => sum + group.loan_balance_after, 0);
    const totalArrears = initialGroups.reduce((sum, group) => sum + group.arrears_after, 0);
    const totalAccounts = initialGroups.reduce((sum, group) => sum + group.accts_after, 0);

    // Get comment status counts (you might want to move these to backend)
    const completedCount = initialGroups.filter(g => g.comment_status === 'completed').length;
    const inProgressCount = initialGroups.filter(g => g.comment_status === 'in-progress').length;
    const pendingCount = initialGroups.filter(g => g.comment_status === 'pending').length;

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

    // Render comment status with badge
    const renderCommentStatus = (group: Group) => {
        const getStatusConfig = (status: string) => {
            switch (status) {
                case 'completed':
                    return {
                        label: 'Completed',
                        badgeClass: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-300',
                        progressClass: 'bg-green-500',
                    };
                case 'in-progress':
                    return {
                        label: group.remaining_comments === 1 ? 'In Progress' : `In Progress (${group.remaining_comments} left)`,
                        badgeClass: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300',
                        progressClass: 'bg-yellow-500',
                    };
                case 'pending':
                    return {
                        label: 'Pending',
                        badgeClass: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-300',
                        progressClass: 'bg-gray-500',
                    };
                default:
                    return {
                        label: 'Unknown',
                        badgeClass: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-300',
                        progressClass: 'bg-gray-500',
                        description: ''
                    };
            }
        };

        const config = getStatusConfig(group.comment_status);
        
        return (
            <div className="space-y-2">
                <div className="flex flex-col gap-1">
                    <Badge 
                        variant="outline" 
                        className={`px-1 py-0.5 text-xs font-medium ${config.badgeClass}`}
                    >
                        {config.label}
                    </Badge>
                </div>
                
                {/* Progress Bar */}
                {group.total_comments > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                                {group.total_comments - group.remaining_comments}/{group.total_comments}
                            </span>
                        </div>
                        <Progress 
                            value={((group.total_comments - group.remaining_comments) / group.total_comments) * 100} 
                            className="h-1.5"
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <MainLayout title="Groups">
            <div className="space-y-6 p-4 lg:p-8">
                {/* Enhanced Header Section for md+ screens */}
                <div className="hidden md:block">
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Groups Listings</h1>
                                <p className="mt-2 text-muted-foreground">
                                    Managing {pagination.total} groups for Outpost ID: {outpostId}
                                    {searchTerm && ` (${initialGroups.length} filtered)`}
                                </p>
                            </div>
                            
                            {/* Comment Status Summary */}
                            <div className="flex gap-3">
                                <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-sm">
                                        Completed: {completedCount}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                    <span className="text-sm">
                                        In Progress: {inProgressCount}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                                    <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                                    <span className="text-sm">
                                        Pending: {pendingCount}
                                    </span>
                                </div>
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
                                <div className="text-center">
                                    <h2 className="text-lg font-semibold">Groups List</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Outpost ID: {outpostId}
                                    </p>
                                </div>
                                <div>
                                    <CardDescription className="text-center">
                                        Showing {pagination.from} to {pagination.to} of {pagination.total} groups
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
                                    {pagination.total} groups • Sorted by {sortColumn.replace('_', ' ')} ({sortDirection})
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm text-muted-foreground">Rows:</span>
                                    <Select
                                        value={itemsPerPage.toString()}
                                        onValueChange={(value) => handleItemsPerPageChange(Number(value))}
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
                        <div className="overflow-hidden rounded-lg border md:rounded-xl max-w-screen">
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

                                        <TableHead
                                            className="cursor-pointer text-xs font-medium hover:bg-muted md:text-sm md:font-semibold"
                                            onClick={() => handleSort('comment_status')}
                                        >
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <span>Status</span>
                                                {sortColumn === 'comment_status' && (
                                                    <span className="text-[10px] md:text-xs">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>

                                        <TableHead
                                            className="hidden cursor-pointer text-xs font-medium hover:bg-muted md:table-cell md:text-sm md:font-semibold"
                                            onClick={() => handleSort('village')}
                                        >
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <span>Village</span>
                                                {sortColumn === 'village' && (
                                                    <span className="text-[10px] md:text-xs">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>

                                        <TableHead
                                            className="hidden cursor-pointer text-xs font-medium hover:bg-muted md:table-cell md:text-sm md:font-semibold"
                                            onClick={() => handleSort('meeting_day')}
                                        >
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <span>Meeting Day</span>
                                                {sortColumn === 'meeting_day' && (
                                                    <span className="text-[10px] md:text-xs">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>

                                        <TableHead
                                            className="hidden cursor-pointer text-xs font-medium hover:bg-muted md:table-cell md:text-sm md:font-semibold"
                                            onClick={() => handleSort('savings_balance_after')}
                                        >
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <span>Savings Balance</span>
                                                {sortColumn === 'savings_balance_after' && (
                                                    <span className="text-[10px] md:text-xs">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>

                                        <TableHead
                                            className="hidden cursor-pointer text-xs font-medium hover:bg-muted md:table-cell md:text-sm md:font-semibold"
                                            onClick={() => handleSort('loan_balance_after')}
                                        >
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <span>Loan Balance</span>
                                                {sortColumn === 'loan_balance_after' && (
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
                                    {initialGroups.length > 0 ? (
                                        initialGroups.map((group) => {
                                            const savingsChange = group.savings_balance_after - group.savings_balance_b4;
                                            const loanChange = group.loan_balance_after - group.loan_balance_b4;

                                            return (
                                                <TableRow key={group.id} className="group hover:bg-muted/50 max-w-screen">
                                                    <TableCell className="text-xs md:text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary/10 md:flex">
                                                                <Users className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="w-10 text-xs md:text-sm">{group.group_name}</div>
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

                                                    <TableCell className="text-xs md:text-sm">
                                                        {renderCommentStatus(group)}
                                                    </TableCell>

                                                    <TableCell className="hidden md:table-cell md:text-sm">
                                                        <div className="font-medium">{group.village}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Officer: {group.credit_officer_id}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="hidden md:table-cell md:text-sm">
                                                        <div className="space-y-1">
                                                            <Badge variant="outline" className={getDayColor(group.meeting_day)}>
                                                                {group.meeting_day}
                                                            </Badge>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{formatTime(group.time)}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="hidden md:table-cell md:text-sm">
                                                        <div className="font-medium">{formatCurrency(group.savings_balance_after)}</div>
                                                        <div className={`flex items-center gap-1 text-xs ${savingsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {savingsChange >= 0 ? (
                                                                <TrendingUp className="h-3 w-3" />
                                                            ) : (
                                                                <TrendingDown className="h-3 w-3" />
                                                            )}
                                                            <span>{savingsChange >= 0 ? '+' : ''}{formatCurrency(savingsChange)}</span>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="hidden md:table-cell md:text-sm">
                                                        <div className="font-medium">{formatCurrency(group.loan_balance_after)}</div>
                                                        <div className={`flex items-center gap-1 text-xs ${loanChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {loanChange >= 0 ? (
                                                                <TrendingUp className="h-3 w-3" />
                                                            ) : (
                                                                <TrendingDown className="h-3 w-3" />
                                                            )}
                                                            <span>{loanChange >= 0 ? '+' : ''}{formatCurrency(loanChange)}</span>
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
                                            <TableCell colSpan={8} className="h-80 py-8 text-center">
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
                                    Showing {pagination.from} to {pagination.to} of {pagination.total} groups
                                </span>
                            </div>

                            <div className="flex flex-col items-center gap-3 sm:flex-row md:gap-6">
                                <div className="hidden items-center gap-1.5 md:flex">
                                    <span className="text-sm">Rows per page</span>
                                    <Select
                                        value={itemsPerPage.toString()}
                                        onValueChange={(value) => handleItemsPerPageChange(Number(value))}
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
                                            onClick={() => handlePageChange(1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <span className="min-w-[60px] text-center text-xs md:min-w-[80px] md:text-sm">
                                        Page {currentPage} of {pagination.last_page}
                                    </span>

                                    <div className="hidden md:block">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === pagination.last_page}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handlePageChange(pagination.last_page)}
                                            disabled={currentPage === pagination.last_page}
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
                                            onClick={() => handlePageChange(1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronsLeft className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === pagination.last_page}
                                        >
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="xs"
                                            className="h-7 w-7 p-0"
                                            onClick={() => handlePageChange(pagination.last_page)}
                                            disabled={currentPage === pagination.last_page}
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