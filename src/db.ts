import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

export interface ExpenseData {
  amount: number;
  category: string;
  description: string;
  month?: string;
}

export interface UserData {
  telegramId: string;
  name?: string;
  monthlyIncome?: number;
}

export const db = {
  // User operations
  async getOrCreateUser(data: UserData) {
    return await prisma.user.upsert({
      where: { telegramId: data.telegramId },
      update: {},
      create: {
        telegramId: data.telegramId,
        name: data.name || 'User',
        monthlyIncome: data.monthlyIncome || 0,
      },
    });
  },

  async setMonthlyIncome(userId: string, amount: number) {
    return await prisma.user.update({
      where: { id: userId },
      data: { monthlyIncome: amount },
    });
  },

  async getUser(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  },

  // Expense operations
  async addExpense(userId: string, data: ExpenseData) {
    const month = data.month || new Date().toISOString().slice(0, 7);
    
    return await prisma.expense.create({
      data: {
        userId,
        amount: data.amount,
        category: data.category.toLowerCase().replace(/\s+/g, '_'),
        description: data.description,
        month,
      },
    });
  },

  async getMonthExpenses(userId: string, month: string) {
    return await prisma.expense.findMany({
      where: {
        userId,
        month,
      },
      orderBy: { date: 'desc' },
    });
  },

  async getCategoryTotal(userId: string, category: string, month: string) {
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        month,
        category: {
          contains: category.toLowerCase(),
        },
      },
    });

    return {
      expenses,
      total: expenses.reduce((sum:any, e:any) => sum + e.amount, 0),
    };
  },

  async getMonthSummary(userId: string, month: string) {
    const expenses = await prisma.expense.findMany({
      where: { userId, month },
    });
   
    const categoryWise = expenses.reduce((acc:any, exp:any) => {
      if (!acc[exp.category]) acc[exp.category] = 0;
      acc[exp.category] += exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = expenses.reduce((sum:any, e:any) => sum + e.amount, 0);

    return {
      expenses,
      categoryWise,
      total,
      count: expenses.length,
    };
  },

  async getRemainingCash(userId: string, month: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const summary = await this.getMonthSummary(userId, month);
    
    return {
      income: user?.monthlyIncome || 0,
      spent: summary.total,
      remaining: (user?.monthlyIncome || 0) - summary.total,
    };
  },
  async deleteExpense(expenseId: string) {
    return await prisma.expense.delete({
      where: { id: expenseId },
    });
  },

  async updateExpense(expenseId: string, data: { amount?: number; category?: string; description?: string }) {
    return await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(data.amount && { amount: data.amount }),
        ...(data.category && { category: data.category.toLowerCase().replace(/\s+/g, '_') }),
        ...(data.description && { description: data.description }),
      },
    });
  },
};

export default prisma;