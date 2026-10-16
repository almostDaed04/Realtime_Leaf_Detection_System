const { z } = require('zod');

// --- Auth Schemas ---

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .trim(),
  email: z.string()
    .email('Please provide a valid email')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

const loginSchema = z.object({
  email: z.string()
    .email('Please provide a valid email')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password is required'),
  reactivate: z.boolean().optional(),
});

const deactivateSchema = z.object({
  password: z.string().min(1, 'Current password is required to deactivate your account'),
  duration: z.enum(['indefinite', '1_day', '3_days', '7_days', '14_days', '30_days', 'custom']),
  customDays: z.coerce.number().int().min(1).max(365).optional(),
  customDate: z.string().optional(),
  reason: z.string().max(200, 'Reason cannot exceed 200 characters').optional(),
}).refine(
  (data) => {
    if (data.duration === 'custom') {
      return Boolean(data.customDays || data.customDate);
    }
    return true;
  },
  {
    message: 'Please provide either custom days (1-365) or a valid future date for custom duration',
    path: ['customDays'],
  }
);

const reactivateSchema = z.object({
  email: z.string().email('Please provide a valid email').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email').trim().toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: registerSchema.shape.password,
});

// --- Query Schemas ---

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// --- Validation Middleware Factory ---

/**
 * Creates Express middleware that validates req[source] against a Zod schema.
 * On success, replaces req[source] with the parsed (cleaned) data.
 * On failure, returns 400 with structured error messages.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    req[source] = result.data;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  deactivateSchema,
  reactivateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  paginationSchema,
  validate,
};
