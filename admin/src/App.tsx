import { Routes, Route, Navigate } from 'react-router-dom';
import HQLayout from './layouts/HQLayout';
import BranchLayout from './layouts/BranchLayout';
import Login from './pages/Login';

// HQ pages
import HQDashboard from './pages/hq/Dashboard';
import BranchList from './pages/hq/branches/BranchList';
import BranchForm from './pages/hq/branches/BranchForm';
import RiderListHQ from './pages/hq/riders/RiderList';
import CustomerListHQ from './pages/hq/customers/CustomerList';
import DeliveryJobListHQ from './pages/hq/jobs/DeliveryJobList';
import UserListHQ from './pages/hq/users/UserList';
import PaymentListHQ from './pages/hq/payments/PaymentList';
import PayoutListHQ from './pages/hq/payouts/PayoutList';
import SupportListHQ from './pages/hq/support/SupportList';
import KnowledgeListHQ from './pages/hq/knowledge/KnowledgeList';

// Branch pages — core
import BranchDashboard from './pages/branch/Dashboard';
import RiderListBranch from './pages/branch/riders/RiderList';
import CustomerListBranch from './pages/branch/customers/CustomerList';
import DeliveryJobListBranch from './pages/branch/jobs/DeliveryJobList';
import ExpenseList from './pages/branch/expenses/ExpenseList';
import SalesTransactionList from './pages/branch/sales/SalesTransactionList';
import CreateSale from './pages/branch/sales/CreateSale';
import SupportListBranch from './pages/branch/support/SupportList';

// Branch pages — operations
import DailySummary from './pages/branch/DailySummary';
import EndOfDayClosing from './pages/branch/EndOfDayClosing';
import BroadcastDispatch from './pages/branch/BroadcastDispatch';
import Attendance from './pages/branch/Attendance';

// Branch pages — reports
import DeliveryReports from './pages/branch/reports/DeliveryReports';
import RevenueReports from './pages/branch/reports/RevenueReports';
import RiderPerformance from './pages/branch/reports/RiderPerformance';
import OperationsReports from './pages/branch/reports/OperationsReports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('alin_admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* HQ Portal */}
      <Route path="/hq" element={<ProtectedRoute><HQLayout /></ProtectedRoute>}>
        <Route index element={<HQDashboard />} />
        <Route path="branches" element={<BranchList />} />
        <Route path="branches/new" element={<BranchForm />} />
        <Route path="branches/:id/edit" element={<BranchForm />} />
        <Route path="riders" element={<RiderListHQ />} />
        <Route path="customers" element={<CustomerListHQ />} />
        <Route path="jobs" element={<DeliveryJobListHQ />} />
        <Route path="users" element={<UserListHQ />} />
        <Route path="payments" element={<PaymentListHQ />} />
        <Route path="payouts" element={<PayoutListHQ />} />
        <Route path="support" element={<SupportListHQ />} />
        <Route path="knowledge" element={<KnowledgeListHQ />} />
      </Route>

      {/* Branch Portal */}
      <Route path="/branch" element={<ProtectedRoute><BranchLayout /></ProtectedRoute>}>
        <Route index element={<BranchDashboard />} />

        {/* Operations */}
        <Route path="daily-summary" element={<DailySummary />} />
        <Route path="eod-closing" element={<EndOfDayClosing />} />
        <Route path="broadcast" element={<BroadcastDispatch />} />
        <Route path="attendance" element={<Attendance />} />

        {/* Records */}
        <Route path="riders" element={<RiderListBranch />} />
        <Route path="customers" element={<CustomerListBranch />} />
        <Route path="jobs" element={<DeliveryJobListBranch />} />
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="sales" element={<SalesTransactionList />} />
        <Route path="sales/create" element={<CreateSale />} />
        <Route path="support" element={<SupportListBranch />} />

        {/* Reports */}
        <Route path="reports/deliveries" element={<DeliveryReports />} />
        <Route path="reports/revenue" element={<RevenueReports />} />
        <Route path="reports/riders" element={<RiderPerformance />} />
        <Route path="reports/operations" element={<OperationsReports />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
