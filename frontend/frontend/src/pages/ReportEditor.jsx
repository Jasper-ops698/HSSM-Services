import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Paper,
  Grid,
} from '@mui/material';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save, ArrowBack } from '@mui/icons-material';

import { API_BASE_URL } from '../config';

const ReportEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const debounceTimeout = useRef(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTitle(res.data.title);
        setContent(res.data.markdownContent);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };
  
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/reports/${id}`,
        { title, markdownContent: content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optionally show a success message
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save report.');
    } finally {
      setSaving(false);
    }
  }, [id, title, content]);
  
  // Debounced save
  useEffect(() => {
    if (content || title) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            handleSave();
        }, 1500); // Auto-save after 1.5 seconds of inactivity
    }
    return () => clearTimeout(debounceTimeout.current);
  }, [content, title, handleSave]);


  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/report-center')}>
          Back to Report Center
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>
          Report Editor
        </Typography>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
      
      <TextField
        fullWidth
        label="Report Title"
        value={title}
        onChange={handleTitleChange}
        variant="outlined"
        sx={{ mb: 2 }}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '70vh', overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Markdown Editor</Typography>
            <TextField
              multiline
              fullWidth
              rows={25}
              value={content}
              onChange={handleContentChange}
              variant="outlined"
              placeholder="Type your markdown here..."
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '70vh', overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Live Preview</Typography>
            <Box className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportEditor;
