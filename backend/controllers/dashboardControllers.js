const Request = require('../models/Request');

exports.getDashboard = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Pagination
  try {
    let query = {};
    let populateOptions = 'service';

    // Adjust query based on role
    if (req.user.role === 'individual') {
      query = { user: req.user._id }; // Fetch requests made by the user
    } else if (req.user.role === 'serviceProvider') {
      query = { 'service.provider': req.user._id }; // Fetch requests tied to the provider's services
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requests = await Request.find(query)
      .populate(populateOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalRequests = await Request.countDocuments(query);

    res.status(200).json({
      role: req.user.role,
      totalRequests,
      totalPages: Math.ceil(totalRequests / limit),
      currentPage: page,
      requests,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: err.message });
  }
};