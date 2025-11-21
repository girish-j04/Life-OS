import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, TrendingDown, TrendingUp, RefreshCw, Settings, X, BarChart3, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts';
import type { Transaction } from '@/types';
import { PhotoPreview } from '@/components/PhotoPreview';

export function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [budgetInputValue, setBudgetInputValue] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeChart, setActiveChart] = useState<'category' | 'trends' | 'daily' | 'comparison'>('category');

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await storage.transactions.getAll();
      setTransactions(data);

      // Load budget setting
      const settings = await storage.settings.get();
      if (settings?.monthlyBudget) {
        setMonthlyBudget(settings.monthlyBudget);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    const confirmed = window.confirm('Delete this transaction? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await storage.transactions.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Could not delete the transaction. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const saveBudget = async () => {
    const budget = parseFloat(budgetInputValue);
    if (isNaN(budget) || budget <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    try {
      await storage.settings.update({ monthlyBudget: budget });
      setMonthlyBudget(budget);
      setShowBudgetInput(false);
      setBudgetInputValue('');
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Failed to save budget. Please try again.');
    }
  };

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Calculate this month's expenses
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMonthExpenses = transactions
    .filter((t) => t.type === 'expense' && isWithinInterval(t.date, { start: monthStart, end: monthEnd }))
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetPercentage = monthlyBudget > 0 ? (thisMonthExpenses / monthlyBudget) * 100 : 0;
  const budgetRemaining = monthlyBudget - thisMonthExpenses;

  // Calculate category breakdown for pie chart
  const categoryData = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  // Color mapping for categories
  const COLORS = {
    'Food & Dining': '#f97316', // orange
    'Housing': '#3b82f6', // blue
    'Transportation': '#eab308', // yellow
    'Entertainment': '#a855f7', // purple
    'Shopping': '#ec4899', // pink
    'Health': '#10b981', // green
    'Work': '#06b6d4', // cyan
    'Subscriptions': '#f43f5e', // red
    'Other': '#64748b', // slate
  };

  const getColor = (category: string, index: number) => {
    return COLORS[category as keyof typeof COLORS] || `hsl(${index * 45}, 70%, 60%)`;
  };

  // Calculate spending trends (last 6 months)
  const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(now, 5 - i);
    const monthStartDate = startOfMonth(monthDate);
    const monthEndDate = endOfMonth(monthDate);

    const monthExpenses = transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(t.date, { start: monthStartDate, end: monthEndDate }))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthIncome = transactions
      .filter((t) => t.type === 'income' && isWithinInterval(t.date, { start: monthStartDate, end: monthEndDate }))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: format(monthDate, 'MMM'),
      expenses: monthExpenses,
      income: monthIncome,
      net: monthIncome - monthExpenses,
    };
  });

  // Calculate daily spending (last 7 days)
  const last7Days = eachDayOfInterval({
    start: subMonths(now, 0).setDate(now.getDate() - 6),
    end: now,
  });

  const dailySpending = last7Days.map((day) => {
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd = new Date(day.setHours(23, 59, 59, 999));

    const dayExpenses = transactions
      .filter((t) => t.type === 'expense' && isWithinInterval(t.date, { start: dayStart, end: dayEnd }))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      day: format(day, 'EEE'),
      amount: dayExpenses,
    };
  });

  // Top spending categories (unused for now, but may be used in future analytics)
  // const topCategories = categoryData.slice(0, 5);

  // Average daily spending
  const avgDailySpending = thisMonthExpenses / new Date().getDate();

  // Spending insights
  const insights = {
    mostExpensiveDay: dailySpending.reduce((max, day) => day.amount > max.amount ? day : max, dailySpending[0]),
    topCategory: categoryData[0],
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="h-8 w-8 text-primary-green" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-dark-text">Finance</h1>
          <p className="text-neutral-600 dark:text-dark-subtext">{transactions.length} transactions</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setShowBudgetInput(!showBudgetInput);
            setBudgetInputValue(monthlyBudget > 0 ? monthlyBudget.toString() : '');
          }}
          className="h-10 w-10"
        >
          {showBudgetInput ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
        </Button>
      </div>

      {/* Budget Input */}
      {showBudgetInput && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="border-primary-blue">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-dark-text">
                    Monthly Budget
                  </label>
                  <p className="text-xs text-neutral-600 dark:text-dark-subtext mb-2">
                    Set your monthly spending limit to track your budget
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter amount (e.g., 2000)"
                      value={budgetInputValue}
                      onChange={(e) => setBudgetInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveBudget();
                      }}
                    />
                    <Button onClick={saveBudget} className="bg-primary-green text-white">
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Monthly Budget Progress */}
      {monthlyBudget > 0 && (
        <Card className={`border-l-4 ${budgetPercentage >= 100 ? 'border-l-primary-red' : budgetPercentage >= 80 ? 'border-l-primary-yellow' : 'border-l-primary-green'}`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-dark-subtext">This Month's Budget</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
                    ${thisMonthExpenses.toFixed(2)} / ${monthlyBudget.toFixed(2)}
                  </p>
                </div>
                <div className={`text-right ${budgetRemaining >= 0 ? 'text-primary-green' : 'text-primary-red'}`}>
                  <p className="text-sm font-medium">
                    {budgetRemaining >= 0 ? 'Remaining' : 'Over Budget'}
                  </p>
                  <p className="text-xl font-bold">
                    ${Math.abs(budgetRemaining).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-neutral-200 dark:bg-dark-border rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      budgetPercentage >= 100
                        ? 'bg-primary-red'
                        : budgetPercentage >= 80
                          ? 'bg-primary-yellow'
                          : 'bg-primary-green'
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-neutral-600 dark:text-dark-subtext">
                    {budgetPercentage.toFixed(1)}% used
                  </p>
                  {budgetPercentage >= 80 && budgetPercentage < 100 && (
                    <p className="text-xs font-medium text-primary-yellow">⚠️ Approaching limit</p>
                  )}
                  {budgetPercentage >= 100 && (
                    <p className="text-xs font-medium text-primary-red">🚨 Budget exceeded!</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary-green">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-dark-subtext">Total Income</p>
                <p className="text-3xl font-bold text-primary-green">${totalIncome.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary-red">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-dark-subtext">Total Expenses</p>
                <p className="text-3xl font-bold text-primary-red">${totalExpense.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-primary-red" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary-blue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-dark-subtext">Balance</p>
                <p className={`text-3xl font-bold ${balance >= 0 ? 'text-primary-green' : 'text-primary-red'}`}>
                  ${balance.toFixed(2)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-primary-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Toggle Button */}
      {transactions.length > 0 && (
        <Button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="w-full btn-te bg-primary-blue text-white h-14 text-lg"
          variant="default"
        >
          <BarChart3 className="h-5 w-5 mr-2" />
          {showAnalytics ? 'Hide' : 'Show'} Spending Analytics
          {showAnalytics ? <ChevronUp className="h-5 w-5 ml-2" /> : <ChevronDown className="h-5 w-5 ml-2" />}
        </Button>
      )}

      {/* Interactive Analytics Section */}
      <AnimatePresence>
        {showAnalytics && categoryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-primary-purple">
                <CardContent className="p-4">
                  <p className="text-xs text-neutral-600 dark:text-dark-subtext uppercase font-mono">Top Category</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-dark-text">{insights.topCategory?.name || 'N/A'}</p>
                  <p className="text-sm text-neutral-600 dark:text-dark-subtext">
                    ${insights.topCategory?.value.toFixed(2) || '0.00'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary-orange">
                <CardContent className="p-4">
                  <p className="text-xs text-neutral-600 dark:text-dark-subtext uppercase font-mono">Avg Daily</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-dark-text">${avgDailySpending.toFixed(2)}</p>
                  <p className="text-sm text-neutral-600 dark:text-dark-subtext">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-l-4 ${insights.savingsRate >= 20 ? 'border-l-primary-green' : insights.savingsRate >= 0 ? 'border-l-primary-yellow' : 'border-l-primary-red'}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-neutral-600 dark:text-dark-subtext uppercase font-mono">Savings Rate</p>
                  <p className={`text-2xl font-bold ${insights.savingsRate >= 20 ? 'text-primary-green' : insights.savingsRate >= 0 ? 'text-primary-yellow' : 'text-primary-red'}`}>
                    {insights.savingsRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-dark-subtext">
                    {insights.savingsRate >= 20 ? 'Great!' : insights.savingsRate >= 0 ? 'Good' : 'Overspending'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart Type Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={activeChart === 'category' ? 'default' : 'outline'}
                onClick={() => setActiveChart('category')}
                className={activeChart === 'category' ? 'bg-primary-purple text-white' : ''}
              >
                Category Breakdown
              </Button>
              <Button
                variant={activeChart === 'trends' ? 'default' : 'outline'}
                onClick={() => setActiveChart('trends')}
                className={activeChart === 'trends' ? 'bg-primary-blue text-white' : ''}
              >
                6-Month Trends
              </Button>
              <Button
                variant={activeChart === 'daily' ? 'default' : 'outline'}
                onClick={() => setActiveChart('daily')}
                className={activeChart === 'daily' ? 'bg-primary-green text-white' : ''}
              >
                Daily (7 Days)
              </Button>
              <Button
                variant={activeChart === 'comparison' ? 'default' : 'outline'}
                onClick={() => setActiveChart('comparison')}
                className={activeChart === 'comparison' ? 'bg-primary-orange text-white' : ''}
              >
                Income vs Expenses
              </Button>
            </div>

            {/* Dynamic Chart Display */}
            <Card>
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {activeChart === 'category' && (
                    <motion.div
                      key="category"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-dark-text mb-4">Spending by Category</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(entry.name, index)} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => `$${value.toFixed(2)}`}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '2px solid #171717',
                                borderRadius: '8px',
                                padding: '8px',
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Category List */}
                      <div className="mt-6 space-y-2">
                        {categoryData.map((cat, index) => {
                          const percentage = (cat.value / totalExpense) * 100;
                          return (
                            <div key={cat.name} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getColor(cat.name, index) }}
                                  />
                                  <span className="text-sm font-medium text-neutral-900 dark:text-dark-text">
                                    {cat.name}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-neutral-900 dark:text-dark-text">
                                  ${cat.value.toFixed(2)} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-neutral-200 dark:bg-dark-border rounded-full h-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5, delay: index * 0.1 }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: getColor(cat.name, index) }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {activeChart === 'trends' && (
                    <motion.div
                      key="trends"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-dark-text mb-4">6-Month Spending Trends</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyTrends}>
                            <defs>
                              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
                            <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )}

                  {activeChart === 'daily' && (
                    <motion.div
                      key="daily"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-dark-text mb-4">Daily Spending (Last 7 Days)</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailySpending}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                            <Bar dataKey="amount" fill="#f97316" name="Spending" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="mt-4 text-sm text-neutral-600 dark:text-dark-subtext text-center">
                        Highest: <span className="font-bold text-primary-orange">{insights.mostExpensiveDay?.day}</span> with ${insights.mostExpensiveDay?.amount.toFixed(2)}
                      </p>
                    </motion.div>
                  )}

                  {activeChart === 'comparison' && (
                    <motion.div
                      key="comparison"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-dark-text mb-4">Income vs Expenses (6 Months)</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="income" fill="#10b981" name="Income" />
                            <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-neutral-600 dark:text-dark-subtext">Avg Income</p>
                          <p className="text-lg font-bold text-primary-green">
                            ${(monthlyTrends.reduce((sum, m) => sum + m.income, 0) / monthlyTrends.length).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-600 dark:text-dark-subtext">Avg Expenses</p>
                          <p className="text-lg font-bold text-primary-red">
                            ${(monthlyTrends.reduce((sum, m) => sum + m.expenses, 0) / monthlyTrends.length).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-600 dark:text-dark-subtext">Avg Net</p>
                          <p className={`text-lg font-bold ${monthlyTrends.reduce((sum, m) => sum + m.net, 0) >= 0 ? 'text-primary-green' : 'text-primary-red'}`}>
                            ${(monthlyTrends.reduce((sum, m) => sum + m.net, 0) / monthlyTrends.length).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Transactions */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-dark-text">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <Wallet className="h-12 w-12 mx-auto text-neutral-400 dark:text-dark-subtext" />
              <p className="text-neutral-600 dark:text-dark-subtext">
                No transactions yet. Use the capture box to log one!
              </p>
              <p className="text-sm text-neutral-600 dark:text-dark-subtext">
                Try: "Spent $45 on groceries" or "Got paid $3000"
              </p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`transition-colors hover:border-${transaction.type === 'income' ? 'primary-green' : 'primary-red'}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-primary-green" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-primary-red" />
                        )}
                        <span className="font-semibold text-neutral-900 dark:text-dark-text">
                          {transaction.category}
                        </span>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-neutral-600 dark:text-dark-subtext">
                          {transaction.description}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 dark:text-dark-subtext">
                        {format(transaction.date, 'MMM d, yyyy h:mm a')}
                      </p>
                      {transaction.photoUrl && (
                        <div className="pt-2 md:hidden">
                          <PhotoPreview
                            src={transaction.photoUrl}
                            alt={`Attachment for ${transaction.category}`}
                            className="w-full"
                            thumbnailClassName="h-32 w-full"
                            label={transaction.type === 'income' ? 'Income' : 'Receipt'}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-end md:ml-auto">
                      {transaction.photoUrl && (
                        <div className="hidden md:block">
                          <PhotoPreview
                            src={transaction.photoUrl}
                            alt={`Attachment for ${transaction.category}`}
                            className="w-32"
                            thumbnailClassName="h-24 w-32"
                            label={transaction.type === 'income' ? 'Income' : 'Receipt'}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold ${transaction.type === 'income' ? 'text-primary-green' : 'text-primary-red'}`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="rounded-xl border-2 border-neutral-900 dark:border-dark-border shadow-te-brutal-sm hover:-translate-y-0.5 transition-transform"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          disabled={deletingId === transaction.id}
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
