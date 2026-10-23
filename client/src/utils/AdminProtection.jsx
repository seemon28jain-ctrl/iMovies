/**
 * AdminProtection.jsx - Route guard for admin users
 * Redirects to /login if no valid admin token exists in localStorage
 */
import { Navigate } from 'react-router-dom';

const AdminProtection = ({ children }) => {
  const token = localStorage.getItem('imovies-admin-token');
  return token ? children : <Navigate to="/login" replace />;
};

export default AdminProtection;
