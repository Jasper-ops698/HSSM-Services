import React from "react";
import { Link } from "react-router-dom";
import { Typography, Button, Box } from "@mui/material";

const NotFound = () => {
  return (
    <Box
      sx={{
        textAlign: "center",
        padding: "2rem",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography variant="h3" gutterBottom>
        404: Page Not Found
      </Typography>
      <Typography variant="body1" gutterBottom>
        Oops! The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        component={Link}
        to="/"
        sx={{ marginTop: "1rem" }}
      >
        Go Back to Home
      </Button>
    </Box>
  );
};

export default NotFound;
