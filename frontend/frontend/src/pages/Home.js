import React, { useState, useEffect } from "react";
import axios from "axios";

const Home = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      const response = await axios.get("http://localhost:4000/api/services");
      setServices(response.data);
    };
    fetchServices();
  }, []);

  return (
    <div>
      <h1>Available Services</h1>
      <ul>
        {services.map((service) => (
          <li key={service._id}>
            {service.name} - ${service.price} (Provider: {service.providerId.name})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;