const User = require('../models/User');
const Request = require('../models/Request');
const Service = require('../models/Service');

exports.addServiceProvider = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newServiceProvider = new User({ name, email, password, role: 'serviceProvider' });
    await newServiceProvider.save();
    res.json({ msg: 'Service provider added successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Error adding service provider', error });
  }
};

exports.deleteServiceProvider = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ msg: 'Service provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Error deleting service provider', error });
  }
};

exports.getAllData = async (req, res) => {
  try {
    const users = await User.find();
    const requests = await Request.find();
    const services = await Service.find();
    res.json({ users, requests, services });
  } catch (error) {
    res.status(500).json({ msg: 'Error fetching data', error });
  }
};
