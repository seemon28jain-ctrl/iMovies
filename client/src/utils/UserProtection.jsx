/**
 * UserProtection.jsx - Route guard for authenticated users
 * Redirects to /login if no valid user token exists in localStorage
 */
import { Navigate } from 'react-router-dom';

const UserProtection = ({ children }) => {
  const token = localStorage.getItem('imovies-token');
  return token ? children : <Navigate to="/login" replace />;
};

export default UserProtection;
