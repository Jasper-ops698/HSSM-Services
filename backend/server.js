const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const connectToDatabase = require("./db");

// Import routes
const bookingRoutes = require("./routes/bookingRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const authRoutes = require("./routes/authRoutes");
const mpesaCallback = require("./routes/mpesaCallback");

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

connectToDatabase()
  .then(() => {
    // Route Middleware
    app.use("/api/auth", authRoutes);
    app.use("/api/services", serviceRoutes);
    app.use("/api/bookings", bookingRoutes);
    app.use("/api/payment", mpesaCallback);

    // Simple Home Route to Confirm Server is Running
    app.get("/", (req, res) => {
      res.send("Welcome to the Local Service App API");
    });

    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("Failed to connect to the database:", err));
