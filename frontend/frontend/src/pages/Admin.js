import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CircularProgress, Button, Pagination } from '@mui/material';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [hssmReports, setHssmReports] = useState([]);
  const [userRolesData, setUserRolesData] = useState({});
  const [requestStatusesData, setRequestStatusesData] = useState({});
  const [servicesCountData, setServicesCountData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [totalReports, setTotalReports] = useState(0); // Total reports for pagination count
  const itemsPerPage = 5; // Number of items per page

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        if (!token) {
          setError('Unauthorized! Please log in.');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch analytics data
        const { data } = await axios.get(`${API_BASE_URL}/api/admin/analytics`, { headers });

        // Fetch paginated HSSM reports, passing currentPage and itemsPerPage
        const reportsResponse = await axios.get(`${API_BASE_URL}/api/admin/hssmProviderReports?page=${currentPage}&limit=${itemsPerPage}`, { headers });

        setUsers(data.users);
        setRequests(data.requests);
        setServices(data.services);
        setHssmReports(reportsResponse.data.reports); // Array of reports
        setTotalReports(reportsResponse.data.totalReports); // Total number of reports for pagination

        // Set chart data
        setUserRolesData({
          labels: Object.keys(data.userRoles),
          datasets: [
            {
              data: Object.values(data.userRoles),
              backgroundColor: ['#ff0000', '#0000ff', '#008000', '#808080'],
            },
          ],
        });

        setRequestStatusesData({
          labels: Object.keys(data.requestStatuses),
          datasets: [
            {
              data: Object.values(data.requestStatuses),
              backgroundColor: ['#ffcc00', '#36a2eb', '#ff8e72'],
            },
          ],
        });

        setServicesCountData({
          labels: Object.keys(data.servicesCount),
          datasets: [
            {
              label: 'Services Count',
              data: Object.values(data.servicesCount),
              backgroundColor: Object.keys(data.servicesCount).map((_, index) => `hsl(${index * 30}, 70%, 50%)`),
            },
          ],
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, API_BASE_URL]); // Trigger fetch when currentPage or API_BASE_URL changes

  const handleDeleteProvider = async (id, role) => {
    try {
      const token = getToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      setIsLoading(true);
      await axios.delete(`${API_BASE_URL}/api/admin/${role}/${id}`, { headers });

      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
    } catch (err) {
      console.error(`Error deleting ${role}:`, err);
      setError(`Error deleting ${role}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableProvider = async (id, role) => {
    try {
      const token = getToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      setIsLoading(true);
      await axios.put(`${API_BASE_URL}/api/admin/${role}/${id}/disable`, {}, { headers });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === id ? { ...user, isDisabled: true } : user
        )
      );
    } catch (err) {
      console.error(`Error disabling ${role}:`, err);
      setError(`Error disabling ${role}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProvider = async (newProvider) => {
    try {
      const token = getToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/admin/addProvider`, newProvider, { headers });

      setUsers((prevUsers) => [...prevUsers, response.data]);
    } catch (err) {
      console.error('Error adding provider:', err);
      setError('Error adding provider.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value); // Update currentPage state to trigger fetch
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', color: 'red' }}>
        <p>{error}</p>
        <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>

      <Button
        variant="contained"
        style={{ backgroundColor: 'purple', color: 'white', marginLeft: '10px' }}
        onClick={() => window.location.href = '/total'}
      >
       Available Services
      </Button>

      <h2>Service Providers</h2>
      {users.filter((user) => user.role === 'service-provider').length === 0 ? (
        <p>No service providers found.</p>
      ) : (
        <ul>
          {users
            .filter((user) => user.role === 'service-provider')
            .map((user) => (
              <li key={user._id} style={{ marginBottom: '10px' }}>
                {user.name} - {user.email}
                <Button
                  variant="contained"
                  style={{ backgroundColor: 'red', color: 'white', marginLeft: '10px' }}
                  onClick={() => handleDeleteProvider(user._id, 'serviceProvider')}
                >
                  Delete
                </Button>
                <Button
                  variant="contained"
                  style={{ backgroundColor: 'blue', color: 'white', marginLeft: '10px' }}
                  onClick={() => handleDisableProvider(user._id, 'serviceProvider')}
                >
                  Disable
                </Button>
                <Button
                  variant="contained"
                  style={{ backgroundColor: 'green', color: 'white', marginLeft: '10px' }}
                  onClick={() => handleAddProvider(user._id, 'serviceProvider')}
                >
                  Enable
                </Button>
              </li>
            ))}
        </ul>
      )}

      <h2>HSSM Providers</h2>
      {users.filter((user) => user.role === 'HSSM-provider').length === 0 ? (
        <p>No HSSM providers found.</p>
      ) : (
        <ul>
          {users
            .filter((user) => user.role === 'HSSM-provider')
            .map((user) => (
              <li key={user._id} style={{ marginBottom: '10px' }}>
                {user.name} - {user.email}
                <Button
                  variant="contained"
                  style={{ backgroundColor: 'darkred', color: 'white', marginLeft: '10px' }}
                  onClick={() => handleDeleteProvider(user._id, 'hssmProvider')}
                >
                  Delete
                </Button>
                <Button
                  variant="contained"
                  style={{ backgroundColor: 'black', color: 'white', marginLeft: '10px' }}
                  onClick={() => handleDisableProvider(user._id, 'hssmProvider')}
                >
                  Disable
                </Button>
                <Button
                  variant="contained"
                  style={{ backgroundColor: 'green', color: 'white', marginLeft: '10px' }}
                  onClick={() => handleAddProvider(user._id, 'serviceProvider')}
                >
                  Enable
                </Button>
              </li>
            ))}
        </ul>
      )}

      <h2>HSSM Reports</h2>
      {hssmReports.length === 0 ? (
        <p>No reports from HSSM providers found.</p>
      ) : (
        <ul>
          {hssmReports.map((report) => (
            <li key={report.id} style={{ marginBottom: '10px' }}>
              {report.providerName}: {report.description}
            </li>
          ))}
        </ul>
      )}

      <Pagination
        count={Math.ceil(totalReports / itemsPerPage)} // Adjust the total pages based on totalReports
        page={currentPage}
        onChange={handlePageChange}
        style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}
      />

      <h2>Analytics</h2>
      <p>Total Users: {users.length}</p>
      <p>Total Requests: {requests.length}</p>
      <p>Total Services: {services.length}</p>

      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ width: '30%' }}>
          <h3>User Roles</h3>
          <Pie data={userRolesData} />
        </div>

        <div style={{ width: '30%' }}>
          <h3>Request Statuses</h3>
          <Pie data={requestStatusesData} />
        </div>

        <div style={{ width: '30%' }}>
          <h3>Services Count</h3>
          <Bar data={servicesCountData} options={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
