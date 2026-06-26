const Crop = require('../models/Crop');

// @desc    Get all crops (Public/Search)
// @route   GET /api/crops
// @access  Public
const getCrops = async (req, res) => {
  try {
    const crops = await Crop.find().populate('farmerId', 'name phone location').sort({ createdAt: -1 });
    res.status(200).json(crops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching crops' });
  }
};

// @desc    Get logged in user crops
// @route   GET /api/crops/mine
// @access  Private
const getMyCrops = async (req, res) => {
  try {
    const crops = await Crop.find({ farmerId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(crops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching user crops' });
  }
};

// @desc    Get a specific crop
// @route   GET /api/crops/:id
// @access  Public
const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('farmerId', 'name phone location');
    if (crop) {
      res.status(200).json(crop);
    } else {
      res.status(404).json({ message: 'Crop not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching crop' });
  }
};

// @desc    Add a crop
// @route   POST /api/crops
// @access  Private (Farmer only)
const addCrop = async (req, res) => {
  try {
    // Check if user exists (handles stale token)
    if (!req.user) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    // Only Farmers can add crops
    if (req.user.role !== 'Farmer') {
      return res.status(403).json({ message: 'User not authorized to add crops' });
    }

    const { cropName, description, availableStock, pricePerUnit, unit, farmLocation, photos } = req.body;

    if (!cropName || availableStock === undefined || !pricePerUnit || !farmLocation) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const availableStockNum = Number(availableStock);
    const status = availableStockNum > 0 ? 'available' : 'out_of_stock';

    const crop = await Crop.create({
      farmerId: req.user.id,
      cropName,
      description,
      totalStock: availableStockNum,
      availableStock: availableStockNum,
      soldQuantity: 0,
      pricePerUnit,
      unit,
      farmLocation,
      photos,
      status
    });

    res.status(201).json(crop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating crop: ' + error.message });
  }
};

// @desc    Update a crop
// @route   PUT /api/crops/:id
// @access  Private (Farmer who owns the crop)
const updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Check for user
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Make sure the logged in user matches the crop farmer
    if (crop.farmerId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this crop' });
    }

    const updateData = { ...req.body };
    // If frontend sends quantityAvailable, map it
    if (updateData.quantityAvailable !== undefined) {
      updateData.availableStock = Number(updateData.quantityAvailable);
      delete updateData.quantityAvailable;
    }
    
    // Auto-update status if availableStock is modified
    if (updateData.availableStock !== undefined) {
      updateData.status = updateData.availableStock > 0 ? 'available' : 'out_of_stock';
    }

    const updatedCrop = await Crop.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.status(200).json(updatedCrop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating crop' });
  }
};

// @desc    Delete a crop
// @route   DELETE /api/crops/:id
// @access  Private (Farmer who owns the crop)
const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Check for user
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Make sure the logged in user matches the crop farmer
    if (crop.farmerId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this crop' });
    }

    await crop.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error deleting crop' });
  }
};

module.exports = {
  getCrops,
  getMyCrops,
  getCropById,
  addCrop,
  updateCrop,
  deleteCrop,
};
