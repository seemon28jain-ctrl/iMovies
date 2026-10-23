/**
 * App.jsx - Root application component
 * Sets up React Router with lazy-loaded pages and route protection
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Loader from './components/Loader';
import UserProtection from './utils/UserProtection';
import AdminProtection from './utils/AdminProtection';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

// Lazy load all pages for code splitting
const LandingPage      = lazy(() => import('./pages/LandingPage'));
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const RegisterPage     = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage  = lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'));
const HomePage         = lazy(() => import('./pages/HomePage'));
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'));
const MovieShowsPage   = lazy(() => import('./pages/MovieShowsPage'));
const SeatMapPage      = lazy(() => import('./pages/SeatMapPage'));
const BookingsPage     = lazy(() => import('./pages/BookingsPage'));
const FavoritesPage    = lazy(() => import('./pages/FavoritesPage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageCatalogPage = lazy(() => import('./pages/admin/ManageCatalogPage'));
const AddMoviePage     = lazy(() => import('./pages/admin/AddMoviePage'));
const AddTheatrePage   = lazy(() => import('./pages/admin/AddTheatrePage'));
const AddShowPage      = lazy(() => import('./pages/admin/AddShowPage'));
const AddAdminPage     = lazy(() => import('./pages/admin/AddAdminPage'));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'));
const AdminTransactionsPage = lazy(() => import('./pages/admin/AdminTransactionsPage'));

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Global Toast Notifications */}
        <ToastContainer
          theme="dark"
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />

        {/* Lazy-loaded routes wrapped in Suspense */}
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/landing" replace />} />

            {/* Public Routes */}
            <Route path="/landing"  element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verifyemail"  element={<Navigate to="/verify-email" replace />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/forgotpassword"  element={<Navigate to="/forgot-password" replace />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/resetpassword"  element={<Navigate to="/reset-password" replace />} />

            {/* User Protected Routes */}
            <Route path="/home"
              element={<UserProtection><HomePage /></UserProtection>} />
            <Route path="/moviedetails/:movieId"
              element={<UserProtection><MovieDetailsPage /></UserProtection>} />
            <Route path="/movieshows/:movieId"
              element={<UserProtection><MovieShowsPage /></UserProtection>} />
            <Route path="/seatslug/:showId"
              element={<UserProtection><SeatMapPage /></UserProtection>} />
            <Route path="/bookings"
              element={<UserProtection><BookingsPage /></UserProtection>} />
            <Route path="/favoriteshows"
              element={<UserProtection><FavoritesPage /></UserProtection>} />
            <Route path="/profile"
              element={<UserProtection><ProfilePage /></UserProtection>} />

            {/* Admin Protected Routes */}
            <Route path="/admin"
              element={<AdminProtection><AdminDashboard /></AdminProtection>} />
            <Route path="/managecatalog"
              element={<AdminProtection><ManageCatalogPage /></AdminProtection>} />
            <Route path="/managemovies"
              element={<Navigate to="/managecatalog?tab=movies" replace />} />
            <Route path="/managetheatres"
              element={<Navigate to="/managecatalog?tab=theatres" replace />} />
            <Route path="/manageshows"
              element={<Navigate to="/managecatalog?tab=shows" replace />} />
            <Route path="/addmovie"
              element={<AdminProtection><AddMoviePage /></AdminProtection>} />
            <Route path="/addtheatre"
              element={<AdminProtection><AddTheatrePage /></AdminProtection>} />
            <Route path="/addshow"
              element={<AdminProtection><AddShowPage /></AdminProtection>} />
            <Route path="/addadmin"
              element={<AdminProtection><AddAdminPage /></AdminProtection>} />
            <Route path="/adminbookings"
              element={<AdminProtection><AdminBookingsPage /></AdminProtection>} />
            <Route path="/admintransactions"
              element={<AdminProtection><AdminTransactionsPage /></AdminProtection>} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
