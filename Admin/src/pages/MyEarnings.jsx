import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Wallet,
    IndianRupee,
    TrendingUp,
    CalendarDays,
    PackageCheck,
    ArrowUpRight,
    ChartColumn,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const API = 'http://localhost:8000/delivery';

const MyEarnings = () => {
    const [earnings, setEarnings] = useState({
        todayEarning: 0,
        weeklyEarning: 0,
        monthlyEarning: 0,
        totalEarnings: 0,
        totalDeliveries: 0
    });

    const [history, setHistory] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    // BACKEND FILTERS
    const [sortBy, setSortBy] = useState('newest');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalRecords: 0,
        limit: 10
    });

    // FETCH DATA FROM BACKEND
    useEffect(() => {
        const fetchMyEarnings = async () => {
            try {
                setTableLoading(true);

                const res = await axios.get(
                    `${API}/my-earnings`,
                    {
                        withCredentials: true,
                        params: {
                            startDate: startDate || undefined,
                            endDate: endDate || undefined,
                            sortBy,
                            page,
                            limit: 10
                        }
                    }
                );

                if (res.data.success) {
                    setEarnings(res.data.earnings);
                    setHistory(res.data.earningsHistory || []);
                    setChartData(res.data.chartData || []);
                    setPagination(res.data.pagination);
                }

            } catch (error) {
                toast.error(
                    error.response?.data?.message ||
                    'Unable to fetch earnings'
                );
            } finally {
                setLoading(false);
                setTableLoading(false);
            }
        };

        fetchMyEarnings();

    }, [sortBy, startDate, endDate, page]);

    // FORMAT AMOUNT
    const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        });
    };

    // FORMAT DATE
    const formatDate = (date) => {
        if (!date) return '-';

        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // FORMAT GRAPH DATE
    const formatDay = (date) => {
        if (!date) return '';

        return new Date(`${date}T12:00:00`).toLocaleDateString(
            'en-IN',
            { weekday: 'short' }
        );
    };

    // SUMMARY CARDS
    const summaryCards = [
        {
            title: "Today's Earnings",
            value: earnings.todayEarning,
            icon: IndianRupee,
            color: 'bg-blue-50 text-blue-600',
            iconBg: 'bg-blue-100',
            description: 'Earnings today'
        },
        {
            title: 'Weekly Earnings',
            value: earnings.weeklyEarning,
            icon: TrendingUp,
            color: 'bg-purple-50 text-purple-600',
            iconBg: 'bg-purple-100',
            description: 'This week'
        },
        {
            title: 'Monthly Earnings',
            value: earnings.monthlyEarning,
            icon: CalendarDays,
            color: 'bg-orange-50 text-orange-600',
            iconBg: 'bg-orange-100',
            description: 'This month'
        },
        {
            title: 'Total Earnings',
            value: earnings.totalEarnings,
            icon: Wallet,
            color: 'bg-green-50 text-green-600',
            iconBg: 'bg-green-100',
            description: 'Lifetime earnings'
        }
    ];

    // GRAPH MAX VALUE
    const maxEarning = Math.max(
        ...chartData.map(item => Number(item.earning) || 0),
        1
    );

    // LOADING SCREEN
    if (loading) {
        return (
            <div className="min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-purple-100 border-t-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-7">

            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between sm:items-center gap-4 mb-5 sm:mb-7">

                <div className="min-w-0">

                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <Wallet size={20} />
                        </div>

                        <span className="text-xs sm:text-sm font-semibold text-purple-700">
                            DELIVERY PARTNER
                        </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
                        My Earnings
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Track your delivery earnings and performance.
                    </p>

                </div>

                <div className="w-fit max-w-full flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">

                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0"></div>

                    <span className="text-xs sm:text-sm font-medium text-slate-600">
                        Earnings Overview
                    </span>

                </div>

            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 mb-5 sm:mb-6">

                {summaryCards.map((card, index) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 min-w-0"
                        >

                            <div className="flex justify-between items-start gap-3">

                                <div className="min-w-0">

                                    <p className="text-xs sm:text-sm font-medium text-slate-500">
                                        {card.title}
                                    </p>

                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2 sm:mt-3 break-words">
                                        {formatAmount(card.value)}
                                    </h2>

                                </div>

                                <div className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl flex items-center justify-center ${card.iconBg} ${card.color.split(' ')[1]}`}>
                                    <Icon size={21} />
                                </div>

                            </div>

                            <div className="flex items-center gap-1.5 mt-4 sm:mt-5 text-xs text-slate-400">
                                <ArrowUpRight size={15} />
                                {card.description}
                            </div>

                        </div>
                    );
                })}

            </div>

            {/* GRAPH + DELIVERY PERFORMANCE */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-5 mb-5 sm:mb-6">

                {/* EARNING GRAPH */}
                <div className="xl:col-span-2 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 md:p-6 min-w-0">

                    <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between sm:items-center gap-3 mb-6 sm:mb-8">

                        <div className="min-w-0">

                            <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                Earnings Overview
                            </h2>

                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Your daily earnings for the last 7 days
                            </p>

                        </div>

                        <div className="w-fit flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold">
                            <ChartColumn size={17} />
                            Last 7 Days
                        </div>

                    </div>

                    {/* CHART */}
                    {chartData.length > 0 ? (

                        <div className="h-52 sm:h-64 flex items-end gap-1.5 sm:gap-5 px-0.5 sm:px-1 min-w-0">

                            {chartData.map((item, index) => {
                                const amount = Number(item.earning) || 0;

                                const height = amount > 0
                                    ? Math.max((amount / maxEarning) * 100, 5)
                                    : 2;

                                return (
                                    <div
                                        key={item.date || index}
                                        className="flex-1 min-w-0 h-full flex flex-col items-center justify-end"
                                    >

                                        <span className="text-[9px] sm:text-xs font-semibold text-slate-600 mb-2 whitespace-nowrap">
                                            {formatAmount(amount)}
                                        </span>

                                        <div className="w-full flex-1 flex items-end justify-center border-b border-slate-200">

                                            <div
                                                title={`${item.date}: ${formatAmount(amount)}`}
                                                style={{ height: `${height}%` }}
                                                className={`w-full max-w-12 rounded-t-md sm:rounded-t-lg transition-all duration-500 ${
                                                    amount > 0
                                                        ? 'bg-purple-500 hover:bg-purple-700'
                                                        : 'bg-slate-100'
                                                }`}
                                            />

                                        </div>

                                        <span className="text-[10px] sm:text-xs text-slate-500 font-medium mt-2 sm:mt-3">
                                            {formatDay(item.date)}
                                        </span>

                                    </div>
                                );
                            })}

                        </div>

                    ) : (

                        <div className="h-52 sm:h-64 flex flex-col items-center justify-center text-slate-400 text-center px-2">

                            <ChartColumn size={35} className="mb-3" />

                            <p className="font-medium text-sm sm:text-base text-slate-600">
                                No graph data available
                            </p>

                            <p className="text-xs sm:text-sm mt-1">
                                Your earnings will appear here after deliveries.
                            </p>

                        </div>

                    )}

                </div>

                {/* DELIVERY PERFORMANCE */}
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col justify-between min-w-0">

                    <div>

                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <PackageCheck size={23} />
                        </div>

                        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-5 sm:mt-6">
                            Total Completed Deliveries
                        </p>

                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2">
                            {earnings.totalDeliveries}
                        </h2>

                        <p className="text-xs sm:text-sm text-slate-400 mt-2">
                            Successfully delivered orders
                        </p>

                    </div>

                    <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-slate-100">

                        <p className="text-xs sm:text-sm text-slate-500 mb-2">
                            Average earning per delivery
                        </p>

                        <h3 className="text-lg sm:text-xl font-bold text-green-600 break-words">
                            {formatAmount(
                                earnings.totalDeliveries > 0
                                    ? earnings.totalEarnings / earnings.totalDeliveries
                                    : 0
                            )}
                        </h3>

                    </div>

                </div>

            </div>

            {/* EARNINGS HISTORY */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0">

                {/* HISTORY HEADER */}
                <div className="p-4 sm:p-5 md:p-6 border-b border-slate-100">

                    <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between sm:items-center gap-3 mb-5">

                        <div className="min-w-0">

                            <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                Earnings History
                            </h2>

                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Your completed deliveries and earnings records
                            </p>

                        </div>

                        <div className="w-fit max-w-full bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold">
                            {pagination.totalRecords || 0} Total Records
                        </div>

                    </div>

                    {/* BACKEND FILTERS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">

                        {/* SORTING */}
                        <div className="min-w-0">

                            <label className="text-xs font-semibold text-slate-500 mb-2 block">
                                SORT BY
                            </label>

                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full min-w-0 border border-slate-200 bg-white rounded-xl px-3 py-2.5 sm:py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>

                        </div>

                        {/* START DATE */}
                        <div className="min-w-0">

                            <label className="text-xs font-semibold text-slate-500 mb-2 block">
                                FROM DATE
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                max={endDate || undefined}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full min-w-0 border border-slate-200 bg-white rounded-xl px-3 py-2.5 sm:py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                            />

                        </div>

                        {/* END DATE */}
                        <div className="min-w-0">

                            <label className="text-xs font-semibold text-slate-500 mb-2 block">
                                TO DATE
                            </label>

                            <input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full min-w-0 border border-slate-200 bg-white rounded-xl px-3 py-2.5 sm:py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                            />

                        </div>

                    </div>

                    <div className="flex justify-end mt-3">

                        <button
                            onClick={() => {
                                setSortBy('newest');
                                setStartDate('');
                                setEndDate('');
                                setPage(1);
                            }}
                            className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-800"
                        >
                            Clear All Filters
                        </button>

                    </div>

                </div>

                {/* TABLE */}
                <div className="relative w-full min-w-0 overflow-x-auto">

                    {tableLoading && (
                        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-9 w-9 border-4 border-purple-100 border-t-purple-600"></div>
                        </div>
                    )}

                    <table className="w-full min-w-[650px] text-sm text-left">

                        <thead className="bg-slate-50 text-slate-600">

                            <tr>

                                <th className="px-3 sm:px-5 py-3 sm:py-4 font-semibold whitespace-nowrap">
                                    ORDER DETAILS
                                </th>

                                <th className="px-3 sm:px-5 py-3 sm:py-4 font-semibold whitespace-nowrap">
                                    ORDER AMOUNT
                                </th>

                                <th className="px-3 sm:px-5 py-3 sm:py-4 font-semibold whitespace-nowrap">
                                    MY EARNING (3%)
                                </th>

                                <th className="px-3 sm:px-5 py-3 sm:py-4 font-semibold whitespace-nowrap">
                                    DELIVERY DATE
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {history.length > 0 ? (

                                history.map((item) => (

                                    <tr
                                        key={item.orderId}
                                        className="border-t border-slate-100 hover:bg-purple-50/40 transition"
                                    >

                                        <td className="px-3 sm:px-5 py-3 sm:py-4">

                                            <p className="font-semibold text-slate-800">
                                                {item.orderNumber || item.orderId}
                                            </p>

                                            <p className="text-xs text-slate-400 mt-1">
                                                Delivery completed
                                            </p>

                                        </td>

                                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-slate-600 whitespace-nowrap">
                                            {formatAmount(item.orderAmount)}
                                        </td>

                                        <td className="px-3 sm:px-5 py-3 sm:py-4 font-bold text-green-600 whitespace-nowrap">
                                            {formatAmount(item.earning)}
                                        </td>

                                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-slate-600 whitespace-nowrap">
                                            {formatDate(item.deliveredAt)}
                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>

                                    <td
                                        colSpan="4"
                                        className="text-center py-10 sm:py-14"
                                    >

                                        <div className="flex flex-col items-center px-3">

                                            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                                                <Wallet size={25} />
                                            </div>

                                            <p className="font-semibold text-sm sm:text-base text-slate-700">
                                                No earnings found
                                            </p>

                                            <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                                Try changing your filters or date range.
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

                {/* PAGINATION */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 sm:p-5 border-t border-slate-100">

                    <p className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
                        Showing page{' '}
                        <span className="font-semibold text-slate-700">
                            {pagination.currentPage || 1}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-slate-700">
                            {pagination.totalPages || 0}
                        </span>
                    </p>

                    <div className="w-full sm:w-auto flex items-center justify-center gap-2">

                        <button
                            disabled={page <= 1 || tableLoading}
                            onClick={() => setPage(prev => prev - 1)}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium text-slate-600 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={17} />
                            Previous
                        </button>

                        <button
                            disabled={
                                !pagination.totalPages ||
                                page >= pagination.totalPages ||
                                tableLoading
                            }
                            onClick={() => setPage(prev => prev + 1)}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium text-slate-600 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight size={17} />
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default MyEarnings;