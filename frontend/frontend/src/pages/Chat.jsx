import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Chip,
  Stack,
  Collapse,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  SmartToy as BotIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import MarkdownRenderer from '../components/MarkdownRenderer';

// Use centralized axios client
import api from '../api';

// Common topics for suggestions
const COMMON_TOPICS = [
  "Tell me about your services",
  "How can I book a service?",
  "What are the available features?",
  "Help me with my account",
  "Technical support"
];

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(COMMON_TOPICS);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [historyAnchorEl, setHistoryAnchorEl] = useState(null);
  const [error, setError] = useState('');
  const chatBoxRef = useRef(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
        // Reset to default if parsing fails
        setMessages([{
          sender: 'bot',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          timestamp: new Date()
        }]);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
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
        "What other services are related to this?",
        "Show me examples"
      ])
    ].slice(0, 6);

    return relevantSuggestions;
  };

  const handleSendMessage = async (message) => {
    setLoading(true);
    setError('');

    try {
      console.log('Sending message to chat API (via api):', message);
      const res = await api.post('/api/chat', { message });
      const data = res.data;
      console.log('Response data:', data);

      if (res.status >= 400) {
        throw new Error(data.reply || `Server error: ${res.status} ${res.statusText}`);
      }

      if (!data || data.success === false) {
        throw new Error(data.reply || 'The AI service is currently unavailable');
      }

      const botMessage = {
        sender: 'bot',
        text: data.reply,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);

      // Update suggestions after bot response
      setSuggestions(generateSuggestions());
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        sender: 'bot',
        text: error.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const messageText = input.trim();
    const userMessage = {
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setInput('');
    setMessages((prev) => [...prev, userMessage]);
    await handleSendMessage(messageText);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    const userMessage = {
      sender: 'user',
      text: suggestion,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    await handleSendMessage(suggestion);
  };

  const handleHistoryClick = (event) => {
    setHistoryAnchorEl(event.currentTarget);
  };

  const handleHistoryClose = () => {
    setHistoryAnchorEl(null);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      setMessages([{
        sender: 'bot',
        text: 'Hello! I\'m your AI assistant. How can I help you today?',
        timestamp: new Date()
      }]);
      localStorage.removeItem('chatHistory');
      setSuggestions(COMMON_TOPICS);
      handleHistoryClose();
    }
  };

  const historyOpen = Boolean(historyAnchorEl);

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', p: 3, height: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          AI Chat Assistant
        </Typography>
        <IconButton onClick={handleHistoryClick} color="primary" title="Chat History">
          <HistoryIcon />
        </IconButton>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Chat History Menu */}
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
        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
          Recent Conversations:
        </Typography>
        {messages.slice(1).map((msg, idx) => (
          <MenuItem key={idx} sx={{
            whiteSpace: 'normal',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: '100%'
          }}>
            <Typography variant="caption" color="textSecondary">
              {msg.sender === 'user' ? 'You' : 'Bot'}:
            </Typography>
            <Typography variant="body2" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Chat Container */}
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          mb: 2,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        {/* Messages Area */}
        <Box
          ref={chatBoxRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            mb: 2,
            p: 1,
            background: '#ffffff',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {messages.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              {/* Avatar */}
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: msg.sender === 'user' ? '#1976d2' : '#4caf50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.5
              }}>
                {msg.sender === 'user' ? (
                  <PersonIcon sx={{ fontSize: 16, color: 'white' }} />
                ) : (
                  <BotIcon sx={{ fontSize: 16, color: 'white' }} />
                )}
              </Box>

              {/* Message Bubble */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  backgroundColor: msg.sender === 'user' ? '#1976d2' : '#f5f5f5',
                  color: msg.sender === 'user' ? '#fff' : '#222',
                  wordBreak: 'break-word',
                  fontSize: 16,
                  boxShadow: 1,
                  border: msg.isError ? '1px solid #f44336' : 'none',
                  maxWidth: '100%'
                }}
              >
                {msg.sender === 'bot' ? (
                  <MarkdownRenderer content={msg.text} />
                ) : (
                  msg.text
                )}
                <Typography variant="caption" sx={{
                  display: 'block',
                  mt: 0.5,
                  opacity: 0.7,
                  fontSize: '0.7rem'
                }}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                </Typography>
              </Box>
            </Box>
          ))}

          {/* Loading indicator */}
          {loading && (
            <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#4caf50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <BotIcon sx={{ fontSize: 16, color: 'white' }} />
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 3,
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Thinking...
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Suggestions */}
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
                  disabled={loading}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'primary.light', color: 'white' },
                    '&:disabled': { opacity: 0.6 }
                  }}
                />
              ))}
            </Stack>
          </Collapse>
        </Box>

        {/* Input Area */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            variant="outlined"
            placeholder={loading ? "Please wait..." : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={loading}
            sx={{
              opacity: loading ? 0.7 : 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white'
              }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            sx={{ minWidth: 80, height: 56 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chat;