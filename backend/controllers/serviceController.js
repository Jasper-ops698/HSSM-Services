const Service = require('../models/Service');

// Create a new service (only for service providers)
exports.createService = async (req, res) => {
  const { name, description, price } = req.body;

  try {
    if (req.user.role !== 'service-provider') {
      return res.status(403).json({ message: 'Only service providers can create services' });
    }

    const service = await Service.create({
      provider: req.user._id,
      name,
      description,
      price,
    });

    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: 'Error creating service', error: err.message });
  }
};

// Get all services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().populate('provider', 'name email');
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching services', error: err.message });
  }
};

// Update a service
exports.updateService = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Service.findById(id);

    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own services' });
    }

    const updatedService = await Service.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedService);
  } catch (err) {
    res.status(500).json({ message: 'Error updating service', error: err.message });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Service.findById(id);

    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own services' });
    }

    await service.remove();
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting service', error: err.message });
  }
};