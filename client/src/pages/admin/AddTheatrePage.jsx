/**
 * AddTheatrePage.jsx - Admin page to register new theatres and configure seating tiers
 * Features:
 *  - Theatre info: name, unique theatreId, location
 *  - Pricing per tier: Balcony, Middle, Lower
 *  - Interactive seat capacity generator (rows & cols)
 *  - Seat structure compiler (balconySeats, middleSeats, lowerSeats)
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faCheckCircle, faCouch, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';

const AddTheatrePage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    theatreName: '',
    location: '',
    balconySeatPrice: 350,
    middleSeatPrice: 220,
    lowerSeatPrice: 150,
  });

  // Seat generation config
  const [seatConfig, setSeatConfig] = useState({
    balconyRows: ['A', 'B'],
    balconyCols: 10,
    middleRows: ['C', 'D', 'E'],
    middleCols: 12,
    lowerRows: ['F', 'G'],
    lowerCols: 12,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name.includes('Price') ? Number(value) : value,
    }));
  };

  // Compile seats objects according to Mongoose schema
  const compiledSeats = useMemo(() => {
    const buildSection = (rows, cols) => {
      const seats = {};
      rows.forEach((row) => {
        for (let col = 1; col <= cols; col++) {
          const seatId = `${row}${col}`;
          seats[seatId] = {
            seatNumber: seatId,
            row,
            col,
          };
        }
      });
      return seats;
    };

    return {
      balconySeats: buildSection(seatConfig.balconyRows, seatConfig.balconyCols),
      middleSeats: buildSection(seatConfig.middleRows, seatConfig.middleCols),
      lowerSeats: buildSection(seatConfig.lowerRows, seatConfig.lowerCols),
    };
  }, [seatConfig]);

  const totalSeats =
    Object.keys(compiledSeats.balconySeats).length +
    Object.keys(compiledSeats.middleSeats).length +
    Object.keys(compiledSeats.lowerSeats).length;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.theatreName.trim()) {
      toast.error('Theatre name is required.');
      return;
    }
    if (!form.location.trim()) {
      toast.error('Location is required.');
      return;
    }

    try {
      setSubmitting(true);
      const autoSlug = form.theatreName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'theatre';
      const autoTheatreId = `${autoSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        ...form,
        theatreId: autoTheatreId,
        balconySeats: compiledSeats.balconySeats,
        middleSeats: compiledSeats.middleSeats,
        lowerSeats: compiledSeats.lowerSeats,
      };

      const res = await api.post('/theatre', payload);
      if (res.data.success) {
        toast.success('Theatre and seat layout saved successfully!');
        navigate('/managecatalog?tab=theatres');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save theatre.');
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
              <FontAwesomeIcon icon={faBuilding} className="text-info me-2" />
              Add Theatre Location
            </h2>
            <p className="text-secondary small mb-0">Register cinema screens and configure seat tier layouts</p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-10">
            <form onSubmit={handleSubmit} className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 shadow p-4">
              {/* Theatre Info */}
              <h5 className="text-info fw-bold mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                1. Cinema Details
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-md-7">
                  <label className="form-label small text-secondary">Theatre Name *</label>
                  <input
                    type="text"
                    name="theatreName"
                    value={form.theatreName}
                    onChange={handleInputChange}
                    className="form-control bg-black text-white border-secondary border-opacity-50"
                    placeholder="e.g. PVR Director's Cut"
                    required
                  />
                </div>

                <div className="col-md-5">
                  <label className="form-label small text-secondary">City / Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    className="form-control bg-black text-white border-secondary border-opacity-50"
                    placeholder="e.g. Saket, New Delhi"
                    required
                  />
                </div>
              </div>

              {/* Pricing Configuration */}
              <h5 className="text-info fw-bold mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                2. Seat Tier Pricing
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label small text-secondary">Balcony Seat Price (₹) *</label>
                  <input
                    type="number"
                    name="balconySeatPrice"
                    value={form.balconySeatPrice}
                    onChange={handleInputChange}
                    className="form-control bg-black text-white border-secondary border-opacity-50"
                    min="1"
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small text-secondary">Middle Seat Price (₹) *</label>
                  <input
                    type="number"
                    name="middleSeatPrice"
                    value={form.middleSeatPrice}
                    onChange={handleInputChange}
                    className="form-control bg-black text-white border-secondary border-opacity-50"
                    min="1"
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small text-secondary">Lower Seat Price (₹) *</label>
                  <input
                    type="number"
                    name="lowerSeatPrice"
                    value={form.lowerSeatPrice}
                    onChange={handleInputChange}
                    className="form-control bg-black text-white border-secondary border-opacity-50"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Seating Layout Generator */}
              <h5 className="text-info fw-bold mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                3. Seating Capacity & Layout Configuration
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="p-3 bg-black bg-opacity-25 rounded-3 border border-secondary border-opacity-10">
                    <span className="badge bg-danger mb-2">Balcony Tier</span>
                    <p className="small text-secondary mb-1">Rows: {seatConfig.balconyRows.join(', ')}</p>
                    <label className="small text-secondary">Seats per row:</label>
                    <input
                      type="number"
                      min="4"
                      max="20"
                      value={seatConfig.balconyCols}
                      onChange={(e) =>
                        setSeatConfig({ ...seatConfig, balconyCols: Number(e.target.value) })
                      }
                      className="form-control form-control-sm bg-black text-white border-secondary mt-1"
                    />
                    <div className="small text-info mt-2">
                      Total: {Object.keys(compiledSeats.balconySeats).length} seats
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="p-3 bg-black bg-opacity-25 rounded-3 border border-secondary border-opacity-10">
                    <span className="badge bg-primary mb-2">Middle Tier</span>
                    <p className="small text-secondary mb-1">Rows: {seatConfig.middleRows.join(', ')}</p>
                    <label className="small text-secondary">Seats per row:</label>
                    <input
                      type="number"
                      min="4"
                      max="20"
                      value={seatConfig.middleCols}
                      onChange={(e) =>
                        setSeatConfig({ ...seatConfig, middleCols: Number(e.target.value) })
                      }
                      className="form-control form-control-sm bg-black text-white border-secondary mt-1"
                    />
                    <div className="small text-info mt-2">
                      Total: {Object.keys(compiledSeats.middleSeats).length} seats
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="p-3 bg-black bg-opacity-25 rounded-3 border border-secondary border-opacity-10">
                    <span className="badge bg-secondary mb-2">Lower Tier</span>
                    <p className="small text-secondary mb-1">Rows: {seatConfig.lowerRows.join(', ')}</p>
                    <label className="small text-secondary">Seats per row:</label>
                    <input
                      type="number"
                      min="4"
                      max="20"
                      value={seatConfig.lowerCols}
                      onChange={(e) =>
                        setSeatConfig({ ...seatConfig, lowerCols: Number(e.target.value) })
                      }
                      className="form-control form-control-sm bg-black text-white border-secondary mt-1"
                    />
                    <div className="small text-info mt-2">
                      Total: {Object.keys(compiledSeats.lowerSeats).length} seats
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout Preview Summary */}
              <div className="p-3 bg-black bg-opacity-40 rounded-3 mb-4 d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faCouch} className="text-info me-2" />
                  <strong>Total Screen Capacity: </strong>
                  <span className="text-white fs-5 fw-bold">{totalSeats}</span> seats
                </div>
                <div className="small text-secondary">
                  Ready to link with upcoming shows
                </div>
              </div>

              {/* Submit Button */}
              <div className="d-flex justify-content-end gap-3">
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
                  className="btn btn-info px-4 fw-semibold text-dark"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  {submitting ? 'Creating Theatre...' : 'Register Theatre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTheatrePage;
