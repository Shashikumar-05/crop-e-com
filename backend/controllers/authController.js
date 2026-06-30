const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const sendEmail = require('../utils/sendEmail');
const { managerApprovalTemplate } = require('../utils/emailTemplates');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email: rawEmail, password, role, phone, location, area, vehicle, vehicle_number, license_number, capacity_kg, license_image, rc_book } = req.body;
    const email = rawEmail ? rawEmail.toLowerCase() : '';

    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    // Check if user exists for this specific role
    const userExists = await User.findOne({ email, role });

    if (userExists) {
      return res.status(400).json({ message: `An account with this email already exists for the ${role} role` });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      location,
      area,
      account_status: role === 'Delivery' ? 'pending' : 'approved',
    });

    if (user) {
      // If delivery partner, create vehicle
      if (role === 'Delivery') {
        const vehicleType = vehicle || 'Bike';
        let cap = capacity_kg || 50;
        let rate = 15;

        // Apply new strict rates
        if (vehicleType === '3 Wheeler') { cap = 500; rate = 50; }
        else if (vehicleType === 'Mini Van') { cap = 1000; rate = 150; }
        else if (vehicleType === '4 Wheeler Pickup') { cap = 1500; rate = 230; }
        else if (vehicleType === '4-Wheeler Pickup (Large)') { cap = 3000; rate = 500; }
        else if (vehicleType === '6-Wheeler Truck') { cap = 8000; rate = 700; }

        const newVehicle = await Vehicle.create({
          vehicle_type: vehicleType,
          vehicle_number: vehicle_number || `PENDING-${Date.now()}`,
          capacity_kg: cap,
          price_per_km: rate,
          assigned_driver: user._id,
          license_number: license_number || '',
          license_image: license_image || '',
          rc_book: rc_book || ''
        });

        // Notify Manager
        const manager = await User.findOne({ role: 'Manager' });
        if (manager) {
          const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
          const approveToken = generateQuickToken(user._id, 'approved');
          const rejectToken = generateQuickToken(user._id, 'rejected');
          
          const approvalLink = `${backendUrl}/api/manager/quick-action/${approveToken}`;
          const rejectionLink = `${backendUrl}/api/manager/quick-action/${rejectToken}`;

          const emailData = {
            name: user.name,
            email: user.email,
            phone: user.phone,
            location: user.location,
            area: user.area,
            vehicle_type: newVehicle.vehicle_type,
            vehicle_number: newVehicle.vehicle_number,
            license_image: newVehicle.license_image,
            rc_book: newVehicle.rc_book,
            approvalLink,
            rejectionLink
          };

          await sendEmail({
            email: manager.email,
            subject: 'Action Required: New Delivery Partner Registration',
            message: managerApprovalTemplate(emailData)
          });
        }
      }

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        account_status: user.account_status,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration: ' + error.message, stack: error.stack });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email: rawEmail, password, role } = req.body;
    const email = rawEmail ? rawEmail.toLowerCase() : '';

    if (!role) {
      return res.status(400).json({ message: 'Please select a role to login' });
    }

    // Check for user email and specific role
    const user = await User.findOne({ email, role });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email, password, or role' });
    }

    // Role validation handled in query above, this can stay as fallback
    if (role && user.role !== role) {
      const roleNames = {
        'Buyer': 'Customer',
        'Farmer': 'Seller',
        'Delivery': 'Delivery Partner',
        'Manager': 'Manager'
      };
      const attemptedRoleName = roleNames[role] || role;
      const actualRoleName = roleNames[user.role] || user.role;
      return res.status(401).json({ 
        message: `Role mismatch! You clicked ${attemptedRoleName} login, but this account is registered as a ${actualRoleName}.` 
      });
    }

    // Check account status
    if (user.account_status === 'pending') {
      return res.status(401).json({ message: 'Your account is under review. Please wait for manager approval.' });
    }
    if (user.account_status === 'rejected') {
      return res.status(401).json({ message: 'Your account registration was rejected. Please contact support.' });
    }

    if (await bcrypt.compare(password, user.password)) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not found or token invalid' });
    }
    
    const user = await User.findById(req.user.id);

    if (user) {
      // Allow modifying properties cleanly. Handle empty string explicitly
      if (req.body.name !== undefined) user.name = req.body.name;
      if (req.body.phone !== undefined) user.phone = req.body.phone;
      if (req.body.location !== undefined) user.location = req.body.location;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        location: updatedUser.location,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found in database' });
    }
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: error.message || 'Server error during update' });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Generate short-lived token for quick email actions (approval/rejection)
const generateQuickToken = (userId, action) => {
  return jwt.sign({ userId, action }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Manager has 7 days to act via email link
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  generateQuickToken
};
