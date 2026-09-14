'use strict';

const Joi = require('joi');

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const cleanPhone = (value, helpers) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return helpers.message('Phone must be a valid string');
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Normalize phone: strip spaces, dashes, parentheses, plus
  let digits = trimmed.replace(/[\s\-\(\)\+]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return helpers.message('Phone must be a valid 10-digit Indian mobile number');
  }
  return digits;
};

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  phone: Joi.any().custom(cleanPhone).optional(),
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .when('phone', {
      is: Joi.string().min(10),
      then: Joi.optional().allow('', null).empty(''),
      otherwise: Joi.required(),
    })
    .messages({
      'string.email': 'Invalid email address',
      'string.empty': 'Email is required when phone is not provided',
      'any.required': 'Email is required when phone is not provided',
    }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
  role: Joi.string()
    .trim()
    .uppercase()
    .valid('BUYER', 'SELLER', 'ADMIN')
    .default('BUYER'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().optional().allow('', null).empty(''),
  phone: Joi.any().custom(cleanPhone).optional(),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
}).or('email', 'phone').messages({
  'object.missing': 'Email or phone number is required',
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Valid email is required',
    'string.empty': 'Email is required',
    'any.required': 'Email is required',
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required',
    'any.required': 'Reset token is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Returns an Express middleware that validates req.body against the given
 * Joi schema. On failure it responds 422 with structured field-level errors.
 *
 * @param {import('joi').Schema} schema
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const details = error.details.reduce((acc, d) => {
      acc[d.path.join('.')] = d.message.replace(/['"]/g, '');
      return acc;
    }, {});

    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
        requestId: req.requestId,
      },
    });
  }

  req.body = value;
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validate,
};
