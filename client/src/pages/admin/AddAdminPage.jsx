/**
 * AddAdminPage.jsx - Admin page to grant administrative privileges to new sub-admins
 * Features:
 *  - Username, email, and password form
 *  - Validates and creates a new admin user in MongoDB
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faEnvelope, faLock, faUser, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';

const AddAdminPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters.');
      return;
    }
    if (!form.email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/admin/subadmin', form);
      if (res.data.success) {
        toast.success(`Sub-admin "${form.username}" created successfully!`);
        setForm({ username: '', email: '', password: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sub-admin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex' }}>
      <AdminSidebar />

      <div className="flex-grow-1 p-4 overflow-auto" style={{ maxHeight: '100vh' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary border-opacity-25">
          <div>
            <h2 className="text-white fw-bold mb-1">
              <FontAwesomeIcon icon={faUserPlus} className="text-success me-2" />
              Add Administrator
            </h2>
            <p className="text-secondary small mb-0">Grant administrative permissions to manage movies, theatres, and bookings</p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-6">
            <form onSubmit={handleSubmit} className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 shadow p-4">
              <h5 className="text-success fw-bold mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                New Sub-Admin Credentials
              </h5>

              <div className="mb-3">
                <label className="form-label small text-secondary">
                  <FontAwesomeIcon icon={faUser} className="me-1 text-info" /> Admin Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleInputChange}
                  className="form-control bg-black text-white border-secondary border-opacity-50"
                  placeholder="e.g. admin_sarah"
                  minLength="3"
                  maxLength="20"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary">
                  <FontAwesomeIcon icon={faEnvelope} className="me-1 text-info" /> Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="form-control bg-black text-white border-secondary border-opacity-50"
                  placeholder="sarah@imovies.com"
                  maxLength="50"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label small text-secondary">
                  <FontAwesomeIcon icon={faLock} className="me-1 text-info" /> Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  className="form-control bg-black text-white border-secondary border-opacity-50"
                  placeholder="••••••••"
                  minLength="6"
                  required
                />
                <div className="form-text text-secondary small">Minimum 6 characters.</div>
              </div>

              <div className="d-flex justify-content-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="btn btn-outline-secondary text-white px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-success px-4 fw-semibold"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  {submitting ? 'Creating...' : 'Create Sub-Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAdminPage;
