const Request = require('../models/Request');

// Create a service request
exports.createRequest = async (req, res) => {
  const { serviceId } = req.body;

  try {
    const request = await Request.create({
      user: req.user._id,
      service: serviceId,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Error creating request', error: err.message });
  }
};

// Get all requests for the logged-in user
exports.getUserRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user._id }).populate('service', 'name description price');
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching requests', error: err.message });
  }
};

// Update the status of a request (only for service providers)
exports.updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const request = await Request.findById(id).populate('service');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the service provider can update this request' });
    }

    request.status = status;
    await request.save();

    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Error updating request', error: err.message });
  }
};