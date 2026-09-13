'use strict';

const Joi = require('joi');

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string()
    .email()
    .lowercase()
    .when('phone', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .allow('', null)
    .optional()
    .empty('')
    .messages({ 'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number' }),
  password: Joi.string().min(8).required(),
  role: Joi.string().uppercase().valid('BUYER', 'SELLER').default('BUYER'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().required(),
}).or('email', 'phone');

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
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
