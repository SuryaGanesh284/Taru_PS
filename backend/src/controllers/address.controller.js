const Address = require('../models/Address');
const { AppError } = require('../middleware/errorHandler');
const { success, created } = require('../utils/response');

const listAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });
    return success(res, addresses);
  } catch (err) { next(err); }
};

const createAddress = async (req, res, next) => {
  try {
    const { name, phone, line1, line2, city, state, pincode, label, isDefault } = req.body;
    if (!name || !phone || !line1 || !city || !state || !pincode) {
      throw new AppError('All required address fields must be provided', 400, 'MISSING_FIELDS');
    }

    if (isDefault) {
      await Address.updateMany({ userId: req.userId }, { isDefault: false });
    }

    const address = await Address.create({ userId: req.userId, name, phone, line1, line2, city, state, pincode, label, isDefault });
    return created(res, address);
  } catch (err) { next(err); }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.addressId, userId: req.userId });
    if (!address) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');

    if (req.body.isDefault) {
      await Address.updateMany({ userId: req.userId }, { isDefault: false });
    }

    Object.assign(address, req.body);
    await address.save();
    return success(res, address);
  } catch (err) { next(err); }
};

const deleteAddress = async (req, res, next) => {
  try {
    const result = await Address.findOneAndDelete({ _id: req.params.addressId, userId: req.userId });
    if (!result) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    return success(res, { message: 'Address deleted' });
  } catch (err) { next(err); }
};

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress };
