import { z } from 'zod';
import { db } from './db.js';
import { tool } from '@openai/agents';

export function createTools(userId: string) {
  return [
    tool({
      name: 'set_monthly_income',
      description: 'Set or update monthly income/budget for the user',
      parameters: z.object({
        amount: z.number().positive().describe('Monthly income amount in rupees'),
      }),
      execute: async ({ amount }: { amount: number }) => {
        await db.setMonthlyIncome(userId, amount);
        const month = new Date().toISOString().slice(0, 7);
        const summary = await db.getRemainingCash(userId, month);

        return {
          success: true,
          income: amount,
          spent: summary.spent,
          remaining: summary.remaining,
          message: `Income set to ₹${amount}. Remaining: ₹${summary.remaining}`,
        };
      },
    }),

    tool({
      name: 'add_expense',
      description: 'Add a new expense with category and amount',
      parameters: z.object({
        category: z.string().describe('Category like sabji, pooja_saman, bijli_bill, etc'),
        amount: z.number().positive().describe('Expense amount in rupees'),
        description: z.string().optional().default('').describe('Optional description'),
      }),
      execute: async ({ category, amount, description }: { 
        category: string; 
        amount: number; 
        description?: string;
      }) => {
        const expense = await db.addExpense(userId, {
          category,
          amount,
          description: description || category,
        });

        const month = new Date().toISOString().slice(0, 7);
        const cash = await db.getRemainingCash(userId, month);

        return {
          success: true,
          expense,
          remaining: cash.remaining,
          message: `₹${amount} added to ${category}. Remaining: ₹${cash.remaining}`,
        };
      },
    }),

    tool({
      name: 'get_remaining_cash',
      description: 'Get remaining cash/balance for current month',
      parameters: z.object({}),
      execute: async () => {
        const month = new Date().toISOString().slice(0, 7);
        const result = await db.getRemainingCash(userId, month);

        return {
          ...result,
          message: `Income: ₹${result.income}, Spent: ₹${result.spent}, Remaining: ₹${result.remaining}`,
        };
      },
    }),

    tool({
      name: 'get_month_summary',
      description: 'Get complete expense summary for a specific month',
      parameters: z.object({
        monthOffset: z.number().default(0).describe('0 for current month, -1 for last month, etc'),
      }),
      execute: async ({ monthOffset }: { monthOffset: number }) => {
        const date = new Date();
        date.setMonth(date.getMonth() + monthOffset);
        const month = date.toISOString().slice(0, 7);

        const summary = await db.getMonthSummary(userId, month);
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        return {
          ...summary,
          month: monthName,
          message: `${monthName}: Total spent ₹${summary.total} across ${summary.count} expenses`,
        };
      },
    }),

    tool({
      name: 'get_category_total',
      description: 'Get total amount spent in a specific category',
      parameters: z.object({
        category: z.string().describe('Category name like sabji, pooja_saman, etc'),
        monthOffset: z.number().default(0).describe('0 for current month, -1 for last month'),
      }),
      execute: async ({ category, monthOffset }: { category: string; monthOffset: number }) => {
        const date = new Date();
        date.setMonth(date.getMonth() + monthOffset);
        const month = date.toISOString().slice(0, 7);

        const result = await db.getCategoryTotal(userId, category, month);
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        return {
          ...result,
          month: monthName,
          message: `${category}: ₹${result.total} spent in ${monthName} (${result.expenses.length} transactions)`,
        };
      },
    }),

    tool({
      name: 'list_recent_expenses',
      description: 'List recent expenses from current month',
      parameters: z.object({
        limit: z.number().default(10).describe('Number of expenses to show'),
      }),
      execute: async ({ limit }: { limit: number }) => {
        const month = new Date().toISOString().slice(0, 7);
        const expenses = await db.getMonthExpenses(userId, month);
        const recent = expenses.slice(0, limit);

        return {
          expenses: recent,
          total: expenses.length,
          message: `Showing ${recent.length} of ${expenses.length} expenses`,
        };
      },
    }),
  ];
}
