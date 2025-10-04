import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, Typography, TextField, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const TwoFactorSettings = ({ apiBaseUrl, token }) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  // Removed unused 'step' state
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${apiBaseUrl}/api/2fa/status`, { headers: { Authorization: `Bearer ${token}` } });
      setEnabled(res.data.twoFactorEnabled);
    } catch (e) {
      setError('Failed to fetch 2FA status.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line
  }, []);

  const startSetup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${apiBaseUrl}/api/2fa/generate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setQr(res.data.qr);
      setSecret(res.data.secret);
  setOpen(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to start 2FA setup.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${apiBaseUrl}/api/2fa/verify`, { token: code }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('2FA enabled successfully!');
      setEnabled(true);
  setOpen(false);
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${apiBaseUrl}/api/2fa/disable`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('2FA disabled.');
      setEnabled(false);
  // No step state needed
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 3, border: '1px solid #eee', borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom>Two-Factor Authentication (2FA)</Typography>
      {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Typography variant="body1" sx={{ mb: 2 }}>
        Protect your account with an extra layer of security. Use an authenticator app (Google Authenticator, Authy, etc.) to scan a QR code and enter a code when logging in.
      </Typography>
      {enabled ? (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>2FA is enabled on your account.</Alert>
          <Button variant="outlined" color="error" onClick={disable2FA} disabled={loading}>Disable 2FA</Button>
        </>
      ) : (
        <Button variant="contained" color="primary" onClick={startSetup} disabled={loading}>Enable 2FA</Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Set Up 2FA</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Scan this QR code with your authenticator app:</Typography>
          {qr && <img src={qr} alt="2FA QR Code" style={{ width: 200, height: 200, marginBottom: 16 }} />}
          <Typography variant="body2" sx={{ mb: 2 }}>Or enter this secret manually: <b>{secret}</b></Typography>
          <TextField
            label="Enter 6-digit code"
            value={code}
            onChange={e => setCode(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={verifyCode} variant="contained" color="primary" disabled={loading || code.length !== 6}>Verify & Enable</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TwoFactorSettings;
