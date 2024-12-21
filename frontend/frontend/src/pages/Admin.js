import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Base API instance
const proxy = 'https://multi-shop-chi.vercel.app';
const api = axios.create({
  baseURL: proxy || 'http://localhost:4000/api',
  headers: {
    'Access-Control-Allow-Origin': '*',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/admin/analytics', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUsers(data.users);
        setRequests(data.requests);
        setServices(data.services);
      } catch (error) {
        setError('Error fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteServiceProvider = async (id) => {
    try {
      await api.delete(`/admin/serviceProvider/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(users.filter(user => user._id !== id));
    } catch (error) {
      console.error('Error deleting service provider:', error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Service Providers</h2>
      <ul>
        {users.filter(user => user.role === 'serviceProvider').map(user => (
          <li key={user._id}>
            {user.name} - {user.email}
            <button onClick={() => handleDeleteServiceProvider(user._id)}>Delete</button>
          </li>
        ))}
      </ul>
      <h2>Analytics</h2>
      <p>Total Users: {users.length}</p>
      <p>Total Requests: {requests.length}</p>
      <p>Total Services: {services.length}</p>
    </div>
  );
};

export default AdminDashboard;
