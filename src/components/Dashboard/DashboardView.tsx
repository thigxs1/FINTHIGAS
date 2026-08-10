import React from 'react';
import { SummaryCards } from '../SummaryCards';
import { ExpenseDonutChart } from './ExpenseDonutChart';
import { CashFlowChart } from './CashFlowChart';
import { BudgetProgress } from './BudgetProgress';
import { TopExpenses } from './TopExpenses';

export const DashboardView: React.FC = () => {
  return (
    <div>
      <SummaryCards />

      {/* Main Charts Row */}
      <div className="dashboard-grid">
        <ExpenseDonutChart />
        <CashFlowChart />
      </div>

      {/* Secondary Row: Budget Limit vs Top Expenses */}
      <div className="dashboard-grid">
        <BudgetProgress />
        <TopExpenses />
      </div>
    </div>
  );
};
