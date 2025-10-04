import React from 'react';
import TwoFactorSettings from '../components/TwoFactorSettings';

import { API_BASE_URL } from '../config';

const Profile2FA = () => {
  const token = localStorage.getItem('token');
  return (
    <TwoFactorSettings apiBaseUrl={API_BASE_URL} token={token} />
  );
};

export default Profile2FA;
