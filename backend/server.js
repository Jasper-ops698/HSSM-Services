const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectToDatabase = require("./db");

dotenv.config(); // Load environment variables

const app = express();

// Security Middleware
app.use(helmet());

// Logging Middleware
app.use(morgan("dev"));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS
const allowedOrigins = ['http://localhost:3000', 'https://your-production-domain.com'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// Connect to database
connectToDatabase()
  .then(() => {
    // Import routes
    const bookingRoutes = require("./routes/bookingRoutes");
    const serviceRoutes = require("./routes/serviceRoutes");
    const authRoutes = require("./routes/authRoutes");
    const mpesaCallback = require("./routes/mpesaCallback");
    const requestRoutes = require("./routes/requestRoutes");
    const dashboardRoutes = require("./routes/dashboardRoutes");
    const paymentRoutes = require("./routes/paymentRoutes");
    const adminRoutes = require("./routes/adminRoutes");

    // Route Middleware
    app.use("/api/auth", authRoutes);
    app.use("/api/services", serviceRoutes);
    app.use("/api/bookings", bookingRoutes);
    app.use("/api/mpesa", mpesaCallback);
    app.use("/api/requests", requestRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/payment", paymentRoutes);

    // Home Route
    app.get("/", (req, res) => {
      res.send("Welcome to the Local Service App API");
    });

    // Error Handling Middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    });

    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("Failed to connect to the database:", err));