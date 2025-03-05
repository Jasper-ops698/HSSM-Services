import React, { createContext, useState, useEffect, useContext } from 'react';

// Helper function to decode JWT and check for expiration
const decodeJWT = (token) => {
  try {
    if (!token) {
      console.error("Token is undefined or null.");
      return null;
    }

    const base64Url = token.split('.')[1]; // Get the payload part of the JWT (second part)
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Decode base64Url
    const decodedData = JSON.parse(atob(base64)); // Decode to JSON

    // Check if the token has expired (exp is in seconds, Date.now() is in milliseconds)
    if (decodedData.exp * 1000 < Date.now()) {
      console.error("Token has expired.");
      return null; // Token is expired
    }

    return decodedData; // Return the decoded data if the token is valid
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null; // Return null in case of any error (invalid token format, etc.)
  }
};

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Check token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserData = localStorage.getItem('userData');

    if (storedToken && storedUserData) {
      const decodedUser = decodeJWT(storedToken);
      if (decodedUser) {
        setUser(JSON.parse(storedUserData)); // Set user from localStorage if token is valid
      } else {
        console.error("Token is expired or invalid.");
        logout(); // If the token is expired or invalid, logout
      }
    } else {
      console.error("No token found.");
    }
  }, []);

  const login = (userData) => {
    const { token, user } = userData;
    
    // Save token and userData in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(user)); // Save user data in localStorage
    setUser(user); // Set user state
  };

  const logout = () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    localStorage.removeItem('userData'); // Optionally clear the user data
    setUser(null); // Clear user state
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access authentication context data
export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
