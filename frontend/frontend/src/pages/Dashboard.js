import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Base API instance
const proxy = 'https://multi-shop-chi.vercel.app';
const api = axios.create({
  baseURL: proxy || 'http://localhost:4000/api',
  headers: {
    'Access-Control-Allow-Origin': '*',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [modals, setModals] = useState({
    isRequestModalOpen: false,
    isCreateServiceModalOpen: false,
    isBookingModalOpen: false, // Booking modal
  });

  const [requestDetails, setRequestDetails] = useState({
    serviceType: '',
    description: '',
  });

  const [serviceDetails, setServiceDetails] = useState({
    name: '',
    description: '',
    price: '',
  });

  const [bookingDetails, setBookingDetails] = useState({
    serviceId: '',
    providerId: '',
    userId: user._id, // Assuming user is logged in and has _id
    date: '',
    time: '',
  });

  // Modal handlers
  const toggleModal = (modalName, isOpen) => {
    setModals((prev) => ({ ...prev, [modalName]: isOpen }));
  };

  // Form handlers
  const handleInputChange = (e, setState) => {
    const { id, value } = e.target;
    setState((prev) => ({ ...prev, [id]: value }));
  };

  // Submit handlers
  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/requests/', requestDetails);
      console.log('Request submitted:', response.data);
      toggleModal('isRequestModalOpen', false);
    } catch (err) {
      console.error('Error submitting request:', err.response?.data?.message || err.message);
    }
  };

  const handleCreateServiceSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/services/', serviceDetails);
      console.log('Service created:', response.data);
      toggleModal('isCreateServiceModalOpen', false);
    } catch (err) {
      console.error('Error creating service:', err.response?.data?.message || err.message);
    }
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/bookings/', bookingDetails);
      console.log('Booking submitted:', response.data);
      toggleModal('isBookingModalOpen', false);
    } catch (err) {
      console.error('Error booking service:', err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/dashboard');
        setDashboardData(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err.response?.data?.message || err.message);
        setError('Error fetching dashboard data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) return <div className="spinner"></div>;
  if (error) return <p>{error}</p>;

  const { totalRequests, requests } = dashboardData;

  return (
    <div className="dashboard-container">
      <h1>{user.role === 'individual' ? 'My Requests' : 'Service Provider Dashboard'}</h1>

      <p>Total Requests: {totalRequests}</p>

      <div>
        {user.role === 'individual' && (
          <div className="requests-section">
            <h2>My Requests</h2>
            <ul>
              {requests.map((request) => (
                <li key={request._id}>
                  <h3>{request.service.name}</h3>
                  <p>Status: {request.status}</p>
                  <p>Created At: {new Date(request.createdAt).toLocaleString()}</p>
                  {request.completed && (
                    <div className="rating-review">
                      <p>Rating: {request.rating}</p>
                      <p>Review: {request.review}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <button onClick={() => toggleModal('isRequestModalOpen', true)}>
              Request a Service
            </button>
            <button onClick={() => toggleModal('isBookingModalOpen', true)}>
              Book a Service
            </button>
          </div>
        )}

        {user.role === 'serviceProvider' && (
          <div className="requests-section">
            <h2>My Service Requests</h2>
            <ul>
              {requests.map((request) => (
                <li key={request._id}>
                  <h3>{request.service.name}</h3>
                  <p>User: {request.user.name}</p>
                  <p>Status: {request.status}</p>
                  <p>Created At: {new Date(request.createdAt).toLocaleString()}</p>
                  {request.completed && (
                    <div className="feedback">
                      <p>Rating: {request.rating}</p>
                      <p>Review: {request.review}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <button onClick={() => toggleModal('isCreateServiceModalOpen', true)}>
              Create a Service
            </button>
          </div>
        )}
      </div>

      {/* Request Modal */}
      <Modal
        isOpen={modals.isRequestModalOpen}
        onClose={() => toggleModal('isRequestModalOpen', false)}
        title="Request a Service"
      >
        <form onSubmit={handleRequestSubmit}>
          <label htmlFor="serviceType">Service Type:</label>
          <input
            type="text"
            id="serviceType"
            value={requestDetails.serviceType}
            onChange={(e) => handleInputChange(e, setRequestDetails)}
            required
          />
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={requestDetails.description}
            onChange={(e) => handleInputChange(e, setRequestDetails)}
            required
          ></textarea>
          <button type="submit">Submit Request</button>
        </form>
      </Modal>

      {/* Create Service Modal */}
      <Modal
        isOpen={modals.isCreateServiceModalOpen}
        onClose={() => toggleModal('isCreateServiceModalOpen', false)}
        title="Create a Service"
      >
        <form onSubmit={handleCreateServiceSubmit}>
          <label htmlFor="name">Service Name:</label>
          <input
            type="text"
            id="name"
            value={serviceDetails.name}
            onChange={(e) => handleInputChange(e, setServiceDetails)}
            required
          />
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={serviceDetails.description}
            onChange={(e) => handleInputChange(e, setServiceDetails)}
            required
          ></textarea>
          <label htmlFor="price">Price:</label>
          <input
            type="number"
            id="price"
            value={serviceDetails.price}
            onChange={(e) => handleInputChange(e, setServiceDetails)}
            required
          />
          <button type="submit">Create Service</button>
        </form>
      </Modal>

      {/* Booking Modal */}
      <Modal
        isOpen={modals.isBookingModalOpen}
        onClose={() => toggleModal('isBookingModalOpen', false)}
        title="Book a Service"
      >
        <form onSubmit={handleBookingSubmit}>
          <label htmlFor="serviceId">Service ID:</label>
          <input
            type="text"
            id="serviceId"
            value={bookingDetails.serviceId}
            onChange={(e) => handleInputChange(e, setBookingDetails)}
            required
          />
          <label htmlFor="providerId">Provider ID:</label>
          <input
            type="text"
            id="providerId"
            value={bookingDetails.providerId}
            onChange={(e) => handleInputChange(e, setBookingDetails)}
            required
          />
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={bookingDetails.date}
            onChange={(e) => handleInputChange(e, setBookingDetails)}
            required
          />
          <label htmlFor="time">Time:</label>
          <input
            type="time"
            id="time"
            value={bookingDetails.time}
            onChange={(e) => handleInputChange(e, setBookingDetails)}
            required
          />
          <button type="submit">Book Service</button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;