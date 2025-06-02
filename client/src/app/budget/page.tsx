'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { transactionsAPI } from '@/lib/api';
import { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

interface Budget {
  _id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: string;
  endDate: string;
  status: 'on-track' | 'warning' | 'exceeded';
}

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  period: z.enum(['monthly', 'weekly', 'yearly']),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other'];

export default function BudgetPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      period: 'monthly',
    },
  });

  // Authentication protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transactionsData] = await Promise.all([
        transactionsAPI.getAll(),
        // budgetsAPI.getAll() - would be implemented
      ]);
      
      setTransactions(transactionsData);
      
      // Mock budget data for demonstration
      const mockBudgets: Budget[] = [
        {
          _id: '1',
          category: 'Food',
          amount: 500,
          spent: 320,
          period: 'monthly',
          startDate: startOfMonth(new Date()).toISOString(),
          endDate: endOfMonth(new Date()).toISOString(),
          status: 'on-track',
        },
        {
          _id: '2',
          category: 'Transportation',
          amount: 200,
          spent: 180,
          period: 'monthly',
          startDate: startOfMonth(new Date()).toISOString(),
          endDate: endOfMonth(new Date()).toISOString(),
          status: 'warning',
        },
        {
          _id: '3',
          category: 'Entertainment',
          amount: 150,
          spent: 200,
          period: 'monthly',
          startDate: startOfMonth(new Date()).toISOString(),
          endDate: endOfMonth(new Date()).toISOString(),
          status: 'exceeded',
        },
      ];
      
      setBudgets(mockBudgets);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSpentAmount = (category: string, period: 'monthly' | 'weekly' | 'yearly') => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default: // monthly
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return transactions
      .filter(t => 
        t.type === 'expense' &&
        t.category === category &&
        parseISO(t.date) >= startDate &&
        parseISO(t.date) <= endDate
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBudgetStatus = (spent: number, budget: number): Budget['status'] => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    return 'on-track';
  };

  const getStatusColor = (status: Budget['status']) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'exceeded':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: Budget['status']) => {
    switch (status) {
      case 'on-track':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'exceeded':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const onSubmit = async (data: BudgetFormData) => {
    try {
      const spent = calculateSpentAmount(data.category, data.period);
      const status = getBudgetStatus(spent, data.amount);
      
      const budgetData = {
        ...data,
        spent,
        status,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      if (editingBudget) {
        // Update existing budget
        setBudgets(prev => prev.map(b => 
          b._id === editingBudget._id 
            ? { ...budgetData, _id: editingBudget._id }
            : b
        ));
        toast.success('Budget updated successfully');
      } else {
        // Create new budget
        const newBudget: Budget = {
          ...budgetData,
          _id: Date.now().toString(),
        };
        setBudgets(prev => [...prev, newBudget]);
        toast.success('Budget created successfully');
      }
      
      setIsDialogOpen(false);
      setEditingBudget(null);
      reset();
    } catch (error) {
      toast.error(editingBudget ? 'Failed to update budget' : 'Failed to create budget');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setValue('category', budget.category);
    setValue('amount', budget.amount);
    setValue('period', budget.period);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      setBudgets(prev => prev.filter(b => b._id !== id));
      toast.success('Budget deleted successfully');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBudget(null);
    reset();
  };

  const filteredBudgets = budgets.filter(budget => budget.period === selectedPeriod);

  const totalBudget = filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = filteredBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const budgetSummary = {
    onTrack: filteredBudgets.filter(b => b.status === 'on-track').length,
    warning: filteredBudgets.filter(b => b.status === 'warning').length,
    exceeded: filteredBudgets.filter(b => b.status === 'exceeded').length,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Budget Management</h1>
            <p className="text-muted-foreground">Track and manage your spending budgets</p>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingBudget ? 'Edit Budget' : 'Create New Budget'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBudget 
                      ? 'Update the budget details below.'
                      : 'Set up a new budget to track your spending.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => setValue('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Budget Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('amount', { valueAsNumber: true })}
                    />
                    {errors.amount && (
                      <p className="text-sm text-destructive">{errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period">Period</Label>
                    <Select onValueChange={(value) => setValue('period', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.period && (
                      <p className="text-sm text-destructive">{errors.period.message}</p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingBudget ? 'Update' : 'Create'} Budget
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBudget.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {selectedPeriod} budget limit
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <DollarSign className={`h-4 w-4 ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalRemaining).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetSummary.onTrack}</div>
              <p className="text-xs text-muted-foreground">
                {budgetSummary.warning} warning, {budgetSummary.exceeded} exceeded
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Budgets
            </CardTitle>
            <CardDescription>
              Track your spending against your budget limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                ))}
              </div>
            ) : filteredBudgets.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No budgets found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first {selectedPeriod} budget to start tracking your spending.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBudgets.map((budget) => {
                  const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
                  const remaining = budget.amount - budget.spent;
                  
                  return (
                    <div
                      key={budget._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`p-2 rounded-full ${getStatusColor(budget.status)} bg-muted`}>
                          {getStatusIcon(budget.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{budget.category}</h4>
                            <Badge 
                              variant={budget.status === 'on-track' ? 'default' : budget.status === 'warning' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {budget.status === 'on-track' ? 'On Track' : 
                               budget.status === 'warning' ? 'Warning' : 'Exceeded'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>${budget.spent.toFixed(2)} spent</span>
                              <span>${budget.amount.toFixed(2)} budget</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{percentage.toFixed(1)}% used</span>
                              <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ${Math.abs(remaining).toFixed(2)} {remaining >= 0 ? 'remaining' : 'over'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(budget)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(budget._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}