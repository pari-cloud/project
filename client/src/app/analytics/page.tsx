'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChartIcon,
  BarChart3,
  Download,
} from 'lucide-react';
import { transactionsAPI } from '@/lib/api';
import { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

interface TrendData {
  date: string;
  amount: number;
  type: 'income' | 'expense';
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m');
  const [categoryData, setCategoryData] = useState<{
    income: CategoryData[];
    expense: CategoryData[];
  }>({ income: [], expense: [] });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netIncome: 0,
    avgMonthlyIncome: 0,
    avgMonthlyExpense: 0,
    topCategory: '',
    topCategoryAmount: 0,
  });

  // Authentication protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    if (transactions.length > 0) {
      processAnalyticsData();
    }
  }, [transactions, timeRange]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await transactionsAPI.getAll();
      setTransactions(data);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    if (timeRange === 'all') return transactions;

    const now = new Date();
    const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
    const cutoffDate = subMonths(now, months);

    return transactions.filter(transaction => 
      parseISO(transaction.date) >= cutoffDate
    );
  };

  const processAnalyticsData = () => {
    const filteredTransactions = getFilteredTransactions();
    
    // Process category data
    const incomeByCategory: { [key: string]: number } = {};
    const expenseByCategory: { [key: string]: number } = {};
    
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        incomeByCategory[transaction.category] = 
          (incomeByCategory[transaction.category] || 0) + transaction.amount;
        totalIncome += transaction.amount;
      } else {
        expenseByCategory[transaction.category] = 
          (expenseByCategory[transaction.category] || 0) + transaction.amount;
        totalExpense += transaction.amount;
      }
    });

    // Convert to chart data
    const incomeData: CategoryData[] = Object.entries(incomeByCategory)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    const expenseData: CategoryData[] = Object.entries(expenseByCategory)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    setCategoryData({ income: incomeData, expense: expenseData });

    // Process monthly data
    const monthlyMap: { [key: string]: { income: number; expense: number } } = {};
    
    filteredTransactions.forEach(transaction => {
      const monthKey = format(parseISO(transaction.date), 'yyyy-MM');
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyMap[monthKey].income += transaction.amount;
      } else {
        monthlyMap[monthKey].expense += transaction.amount;
      }
    });

    const monthlyDataArray: MonthlyData[] = Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month: format(parseISO(month + '-01'), 'MMM yyyy'),
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setMonthlyData(monthlyDataArray);

    // Process trend data
    const trendMap: { [key: string]: { income: number; expense: number } } = {};
    
    filteredTransactions.forEach(transaction => {
      const dateKey = format(parseISO(transaction.date), 'yyyy-MM-dd');
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        trendMap[dateKey].income += transaction.amount;
      } else {
        trendMap[dateKey].expense += transaction.amount;
      }
    });

    const trendDataArray: TrendData[] = [];
    Object.entries(trendMap).forEach(([date, data]) => {
      if (data.income > 0) {
        trendDataArray.push({ date, amount: data.income, type: 'income' });
      }
      if (data.expense > 0) {
        trendDataArray.push({ date, amount: data.expense, type: 'expense' });
      }
    });

    setTrendData(trendDataArray.sort((a, b) => a.date.localeCompare(b.date)));

    // Calculate summary
    const netIncome = totalIncome - totalExpense;
    const monthsCount = monthlyDataArray.length || 1;
    const avgMonthlyIncome = totalIncome / monthsCount;
    const avgMonthlyExpense = totalExpense / monthsCount;
    
    const topExpenseCategory = expenseData[0];
    
    setSummary({
      totalIncome,
      totalExpense,
      netIncome,
      avgMonthlyIncome,
      avgMonthlyExpense,
      topCategory: topExpenseCategory?.name || 'N/A',
      topCategoryAmount: topExpenseCategory?.value || 0,
    });
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount'],
      ...getFilteredTransactions().map(t => [
        format(parseISO(t.date), 'yyyy-MM-dd'),
        t.type,
        t.category,
        t.description,
        t.amount.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${timeRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Visualize your financial data and trends</p>
          </div>
          
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${summary.totalIncome.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: ${summary.avgMonthlyIncome.toFixed(2)}/month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${summary.totalExpense.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: ${summary.avgMonthlyExpense.toFixed(2)}/month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <DollarSign className={`h-4 w-4 ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.netIncome.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.netIncome >= 0 ? 'Surplus' : 'Deficit'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.topCategory}</div>
              <p className="text-xs text-muted-foreground">
                ${summary.topCategoryAmount.toFixed(2)} spent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Income vs Expense by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Income vs Expenses</CardTitle>
              <CardDescription>Compare your monthly income and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Net Income Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Net Income Trend</CardTitle>
              <CardDescription>Track your monthly net income over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Net Income']} />
                  <Area 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Breakdown of your spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.expense.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData.expense}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.expense.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Income Sources</CardTitle>
              <CardDescription>Breakdown of your income by source</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.income.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData.income}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.income.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No income data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}