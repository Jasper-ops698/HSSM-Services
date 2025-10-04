import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, TextField, Paper, IconButton, Menu, MenuItem, Chip, Stack, Collapse } from '@mui/material';
import { Link } from 'react-router-dom';
import Footer from './AboutPage';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import Modal from '@mui/material/Modal';
import CircularProgress from '@mui/material/CircularProgress';

// Centralized API base URL
import api from '../api';

// Common topics for suggestions
const COMMON_TOPICS = [
  "Tell me about your services",
  "How can I book a service?",
];

const CustomChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(COMMON_TOPICS);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [historyAnchorEl, setHistoryAnchorEl] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const chatBoxRef = React.useRef(null);
  const [isPublicMode, setIsPublicMode] = useState(false);

  // Check authentication status and load chat history
  useEffect(() => {
    const token = localStorage.getItem('token');
    const authenticated = !!token;

    if (!authenticated) {
      // For unauthenticated visitors provide a navigation assistant and allow public messages
      setIsPublicMode(true);
      setMessages([
        { sender: 'bot', text: '👋 Welcome! I\'m the Navigation Assistant — ask about the site, features, or how to get started. You can chat here without logging in.' }
      ]);
      return;
    }

    const loadChatHistory = async () => {
      try {
        const response = await api.get('/api/chat/history', { params: { limit: 20 } });
        const data = response.data;
        if (data && data.success && data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    // Messages are now stored on the server, no need for localStorage
    // This effect is kept for any future local caching needs
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate suggestions based on chat history
  const generateSuggestions = () => {
    const userMessages = messages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.text);
    
    // If user has no history, return common topics
    if (userMessages.length === 0) return COMMON_TOPICS;

    // Find frequently used keywords
    const keywords = userMessages.join(' ').toLowerCase()
      .split(' ')
      .filter(word => word.length > 3);
    
    // Count keyword frequency
    const keywordCount = {};
    keywords.forEach(word => {
      keywordCount[word] = (keywordCount[word] || 0) + 1;
    });

    // Generate relevant suggestions
    const relevantSuggestions = [
      ...new Set([
        ...COMMON_TOPICS,
        `Tell me more about ${Object.keys(keywordCount).sort((a, b) => keywordCount[b] - keywordCount[a])[0] || 'services'}`,
        "Can you explain the previous answer in more detail?",
        "What other services are related to this?"
      ])
    ].slice(0, 5);

    return relevantSuggestions;
  };

  const handleSendMessage = async (message) => {
    setLoading(true);
    setIsTyping(true);
      try {
        console.log('Sending message to chat API:', message);

        const token = localStorage.getItem('token');
        const isAuthenticated = !!token;
        const endpoint = isAuthenticated ? '/api/chat' : '/api/chat/public';

        // Use centralized axios client
        let response;
        try {
          response = await api.post(endpoint, { message });
        } catch (err) {
          const status = err.response?.status;
          const data = err.response?.data || {};

          if (status === 401) {
            setMessages((prev) => [
              ...prev,
              {
                sender: 'bot',
                text: '🔐 Your session has expired. Please log in again.',
                isError: true,
                timestamp: new Date().toISOString()
              }
            ]);
            setIsTyping(false);
            return;
          }

          if (status === 429) {
            const retryAfter = data.retryAfter || 60;
            setMessages((prev) => [
              ...prev,
              {
                sender: 'bot',
                text: `${data.reply || 'Service is busy'} (Please wait ${Math.ceil(retryAfter / 60)} minute(s) before trying again)`,
                isError: true,
                timestamp: new Date().toISOString()
              }
            ]);
            setIsTyping(false);
            return;
          }

          // Generic network/server error
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: data.reply || `Server error: ${status || 'network error'}`,
              isError: true,
              timestamp: new Date().toISOString()
            }
          ]);
          setIsTyping(false);
          return;
        }

        const data = response.data;
        if (!data || !data.success) {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: data?.reply || 'The AI service is currently unavailable',
              isError: true,
              timestamp: new Date().toISOString()
            }
          ]);
          setIsTyping(false);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply,
            timestamp: new Date().toISOString()
          }
        ]);

        // If the user was unauthenticated, ensure public mode remains true
        setIsPublicMode(!isAuthenticated);

        // Update suggestions after bot response
        setSuggestions(generateSuggestions());
      } catch (error) {
        console.error('Chat error:', error);

        let errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';

        // Add helpful context for common errors
        if ((error.message || '').includes('rate limit') || (error.message || '').includes('busy')) {
          errorMessage += '\n\n💡 Tip: The AI assistant is popular! Try again in a few minutes.';
        } else if ((error.message || '').includes('timeout')) {
          errorMessage += '\n\n💡 Tip: The service is taking longer than usual. Please try again.';
        } else if ((error.message || '').includes('session') || (error.message || '').includes('login')) {
          errorMessage += '\n\n🔐 Please log in to continue chatting.';
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: errorMessage,
            isError: true,
            canRetry: true,
            originalMessage: message,
            timestamp: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
        setIsTyping(false);
      }
  };

  const clearChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to clear chat history.');
        return;
      }

      try {
        const response = await api.delete('/api/chat/history');
        if (response.status === 200) {
          setMessages([{ sender: 'bot', text: 'Hello! How can I assist you today?' }]);
          setSuggestions(COMMON_TOPICS);
        } else {
          alert('Failed to clear chat history. Please try again.');
        }
      } catch (error) {
        console.error('Error clearing chat history:', error);
        alert('Failed to clear chat history. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      alert('Failed to clear chat history. Please try again.');
    }
  };

  const handleRetryMessage = async (originalMessage) => {
    if (!originalMessage || loading) return;
    
    // Remove the error message from the chat
    setMessages(prev => prev.filter(msg => !msg.canRetry || msg.originalMessage !== originalMessage));
    
    // Retry sending the message
    await handleSendMessage(originalMessage);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const messageText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { 
      sender: 'user', 
      text: messageText,
      timestamp: new Date().toISOString()
    }]);
    await handleSendMessage(messageText);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setMessages((prev) => [...prev, { 
      sender: 'user', 
      text: suggestion,
      timestamp: new Date().toISOString()
    }]);
    handleSendMessage(suggestion);
  };

  const handleHistoryClick = (event) => {
    setHistoryAnchorEl(event.currentTarget);
  };

  const handleHistoryClose = () => {
    setHistoryAnchorEl(null);
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your chat history? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to clear chat history.');
        handleHistoryClose();
        return;
      }

      try {
        const response = await api.delete('/api/chat/history');
        if (response.status === 200) {
          setMessages([{ sender: 'bot', text: 'Hello! How can I assist you today?' }]);
          setSuggestions(COMMON_TOPICS);
          handleHistoryClose();
        } else {
          alert('Failed to clear chat history. Please try again.');
        }
      } catch (error) {
        console.error('Error clearing chat history:', error);
        alert('Failed to clear chat history. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      alert('Failed to clear chat history. Please try again.');
    }
  };

  const historyOpen = Boolean(historyAnchorEl);

  return (
    <Paper elevation={3} sx={{ 
      p: 2, 
      maxWidth: '100%', 
      m: 'auto', 
      height: '100%',
      maxHeight: '100%',
      display: 'flex', 
      flexDirection: 'column',
      borderRadius: 3
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1,
        pb: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          {isPublicMode ? 'Navigation Assistant' : 'AI Assistant'}
          {isPublicMode && (
            <Box component="span" sx={{ fontSize: '0.8rem', color: '#ff9800', bgcolor: 'rgba(255,152,0,0.1)', px: 1, borderRadius: 1 }}>
              Navigation Only
            </Box>
          )}
        </Typography>
        <IconButton onClick={handleHistoryClick} color="primary" title="Chat History" size="small">
          <HistoryIcon />
        </IconButton>
        <Menu
          anchorEl={historyAnchorEl}
          open={historyOpen}
          onClose={handleHistoryClose}
          PaperProps={{
            style: {
              maxHeight: 300,
              width: '250px',
            },
          }}
        >
          <MenuItem onClick={handleClearHistory} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} /> Clear History
          </MenuItem>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', my: 1 }} />
          {messages.slice(1).map((msg, idx) => (
            <MenuItem key={idx} sx={{ 
              whiteSpace: 'normal',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}>
              <Typography variant="caption" color="textSecondary">
                {msg.sender === 'user' ? 'You' : 'Bot'}:
              </Typography>
              <Typography variant="body2">
                {msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>


      <Box
        ref={chatBoxRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          mb: 2,
          p: 1,
          background: '#f9f9f9',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              mb: 1.5,
              p: 1.5,
              borderRadius: 3,
              backgroundColor: msg.sender === 'user' ? '#1976d2' : '#e0e0e0',
              color: msg.sender === 'user' ? '#fff' : '#222',
              wordBreak: 'break-word',
              fontSize: 16,
              boxShadow: 1,
            }}
          >
            {msg.sender === 'bot' ? (
              <MarkdownRenderer content={msg.text} />
            ) : (
              msg.text
            )}
            {msg.timestamp && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mt: 0.5, 
                  opacity: 0.7,
                  fontSize: '0.7rem'
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Typography>
            )}
            {msg.canRetry && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => handleRetryMessage(msg.originalMessage)}
                sx={{ 
                  mt: 1, 
                  minHeight: 24,
                  fontSize: '0.7rem',
                  padding: '2px 8px'
                }}
                disabled={loading}
              >
                Retry
              </Button>
            )}
          </Box>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <Box
            sx={{
              alignSelf: 'flex-start',
              maxWidth: '80%',
              mb: 1.5,
              p: 1.5,
              borderRadius: 3,
              backgroundColor: '#e0e0e0',
              color: '#222',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              boxShadow: 1,
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Box 
                sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  backgroundColor: '#666',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  '@keyframes bounce': {
                    '0%, 80%, 100%': { transform: 'scale(0)' },
                    '40%': { transform: 'scale(1)' }
                  }
                }}
                style={{ animationDelay: '0s' }}
              />
              <Box 
                sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  backgroundColor: '#666',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  '@keyframes bounce': {
                    '0%, 80%, 100%': { transform: 'scale(0)' },
                    '40%': { transform: 'scale(1)' }
                  }
                }}
                style={{ animationDelay: '0.16s' }}
              />
              <Box 
                sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  backgroundColor: '#666',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  '@keyframes bounce': {
                    '0%, 80%, 100%': { transform: 'scale(0)' },
                    '40%': { transform: 'scale(1)' }
                  }
                }}
                style={{ animationDelay: '0.32s' }}
              />
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              AI is typing...
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSuggestionsOpen((open) => !open)}
          sx={{ mb: 1 }}
        >
          {suggestionsOpen ? 'Hide Suggestions' : 'Show Suggestions'}
        </Button>
        <Collapse in={suggestionsOpen}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'primary.light', color: 'white' }
                }}
              />
            ))}
          </Stack>
        </Collapse>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          variant="outlined"
          placeholder={loading ? "AI is thinking..." : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
          sx={{ 
            opacity: loading ? 0.7 : 1,
            '& .MuiOutlinedInput-root': {
              '&.Mui-disabled': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={clearChatHistory}
            disabled={loading}
            size="small"
            sx={{ minWidth: 100 }}
          >
            Clear Chat
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            sx={{ minWidth: 80 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

const Home = () => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main content */}
      <Box sx={{ flex: 1, textAlign: 'center', padding: 4 }}>
        <Typography variant="h3" sx={{ marginBottom: 3 }}>
          Welcome to our Services
        </Typography>
        <Typography variant="h6" sx={{ marginBottom: 3 }}>
          We make work easier.
        </Typography>
        <Button variant="contained" color="primary" component={Link} to="/signup" sx={{ marginRight: 2 }}>
          Get Started
        </Button>
        <Button variant="outlined" color="primary" component={Link} to="/login">
          Login
        </Button>
        {/* Chat Icon Button (fixed at bottom right) */}
        <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}>
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: '50%', minWidth: 0, width: 56, height: 56, boxShadow: 4 }}
            onClick={() => setChatOpen(true)}
            aria-label="Open chat"
          >
            <ChatIcon fontSize="large" />
          </Button>
        </Box>
        {/* Chat Modal */}
        <Modal open={chatOpen} onClose={() => setChatOpen(false)}>
          <Box sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 96 },
            right: { xs: 16, sm: 32 },
            width: { xs: 'calc(100vw - 32px)', sm: 420 },
            maxWidth: '95vw',
            maxHeight: { xs: 'calc(100vh - 120px)', sm: '500px' },
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 0,
            outline: 'none',
            zIndex: 1400,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <CustomChat />
          </Box>
        </Modal>
      </Box>
      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Home;
