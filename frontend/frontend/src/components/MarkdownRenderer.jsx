import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Typography, Box, Paper, List, ListItem, Table, TableBody, TableCell, TableHead, TableRow, Alert } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Custom renderer for Markdown to Material UI
const MarkdownRenderer = ({ content }) => (
  <Box sx={{ my: 2 }}>
    <ReactMarkdown
      components={{
        h1: ({node, ...props}) => <Typography variant="h4" gutterBottom {...props} />,
        h2: ({node, ...props}) => <Typography variant="h5" gutterBottom {...props} />,
        h3: ({node, ...props}) => <Typography variant="h6" gutterBottom {...props} />,
        h4: ({node, ...props}) => <Typography variant="subtitle1" gutterBottom {...props} />,
        p: ({node, ...props}) => <Typography variant="body1" paragraph {...props} />,
        ul: ({node, ...props}) => <List sx={{ pl: 3 }} {...props} />,
        ol: ({node, ...props}) => <List sx={{ pl: 3, listStyleType: 'decimal' }} {...props} />,
        li: ({node, ...props}) => <ListItem sx={{ display: 'list-item', pl: 1 }} {...props} />,
        blockquote: ({node, ...props}) => <Alert severity="info" sx={{ my: 2, pl: 2, borderLeft: '4px solid #1976d2' }} {...props} />,
        code({node, inline, className, children, ...props}) {
          return !inline ? (
            <Paper sx={{ my: 2, p: 2, bgcolor: '#f5f5f5' }}>
              <SyntaxHighlighter style={materialLight} language={className?.replace('language-', '')} PreTag="div">
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </Paper>
          ) : (
            <Box component="span" sx={{ bgcolor: '#eee', px: 0.5, borderRadius: 1, fontFamily: 'monospace' }}>{children}</Box>
          );
        },
        table: ({node, ...props}) => <Table sx={{ my: 2 }} {...props} />,
        thead: ({node, ...props}) => <TableHead {...props} />,
        tbody: ({node, ...props}) => <TableBody {...props} />,
        tr: ({node, ...props}) => <TableRow {...props} />,
        th: ({node, ...props}) => <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f0f0' }} {...props} />,
        td: ({node, ...props}) => <TableCell {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  </Box>
);

export default MarkdownRenderer;
