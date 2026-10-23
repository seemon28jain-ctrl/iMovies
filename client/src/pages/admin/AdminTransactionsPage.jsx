/**
 * AdminTransactionsPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Admin Portal page for managing all platform payment transactions and Razorpay refunds.
 */
import AdminSidebar from '../../components/AdminSidebar';
import AdminTransactions from '../../components/AdminTransactions';

const AdminTransactionsPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-dark, #050505)' }}>
      <AdminSidebar />
      <div className="flex-grow-1 p-4 overflow-auto" style={{ maxHeight: '100vh' }}>
        <AdminTransactions />
      </div>
    </div>
  );
};

export default AdminTransactionsPage;