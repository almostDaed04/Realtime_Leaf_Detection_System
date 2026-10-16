
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },

  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

  accountStatus: {
    type: String,
    enum: ['active', 'disabled', 'deactivated'],
    default: 'active',
  },

  // Temporary Account Deactivation
  deactivatedAt: {
    type: Date,
    default: undefined,
  },

  deactivatedUntil: {
    type: Date,
    default: undefined,
  },

  deactivationReason: {
    type: String,
    maxlength: [200, 'Deactivation reason cannot exceed 200 characters'],
    default: undefined,
  },

  // Email verification OTP
  verificationCode: {
    type: String,
    select: false,
    default: undefined,
  },

  verificationCodeExpires: {
    type: Date,
    select: false,
    default: undefined,
  },

  verificationPurpose: {
    type: String,
    enum: ['signup', 'login'],
    select: false,
    default: undefined,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  // Forgot-password reset token
  resetPasswordToken: {
    type: String,
    select: false,
    default: undefined,
  },

  resetPasswordExpires: {
    type: Date,
    select: false,
    default: undefined,
  },

  registrationDate: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);

  this.passwordHash = await bcrypt.hash(
    this.passwordHash,
    salt
  );
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return bcrypt.compare(
    candidatePassword,
    this.passwordHash
  );
};

// Generate a 6-digit email verification code
userSchema.methods.setVerificationCode = function () {
  const code = crypto
    .randomInt(100000, 1000000)
    .toString();

  // Store only the hashed OTP
  this.verificationCode = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');

  // OTP expires after 10 minutes
  this.verificationCodeExpires = new Date(
    Date.now() + 10 * 60 * 1000
  );

  // Return plain OTP for email delivery
  return code;
};

// Verify the entered OTP
userSchema.methods.verifyCode = function (candidateCode) {
  if (
    typeof candidateCode !== 'string' ||
    !this.verificationCode ||
    !this.verificationCodeExpires
  ) {
    return false;
  }

  // Reject expired codes
  if (this.verificationCodeExpires.getTime() <= Date.now()) {
    return false;
  }

  const hashedCode = crypto
    .createHash('sha256')
    .update(candidateCode)
    .digest('hex');

  // Compare hashes without an early-exit string comparison
  const expected = Buffer.from(this.verificationCode, 'hex');
  const actual = Buffer.from(hashedCode, 'hex');

  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.passwordHash;
  delete obj.verificationCode;
  delete obj.verificationCodeExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;

  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
