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
    let { name, phone, line1, line2, city, state, pincode, label, isDefault } = req.body;
    name = name || req.user?.name || 'Customer';
    phone = phone || req.user?.phone || '9999999999';

    const details = {};
    if (!line1 || !String(line1).trim()) details.line1 = 'Address line 1 is required';
    if (!city || !String(city).trim()) details.city = 'City is required';
    if (!state || !String(state).trim()) details.state = 'State is required';
    if (!pincode || !String(pincode).trim()) details.pincode = 'Pincode is required';
    if (Object.keys(details).length > 0) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR', details);
    }

    if (isDefault) {
      await Address.updateMany({ userId: req.userId }, { isDefault: false });
    }

    const address = await Address.create({ userId: req.userId, name, phone, line1, line2, city, state, pincode, label, isDefault });
    return created(res, { address, ...address.toJSON() });
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
