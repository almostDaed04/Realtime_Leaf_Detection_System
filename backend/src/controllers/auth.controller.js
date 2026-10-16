const User = require('../models/User');
const crypto = require('crypto');
const { generateToken } = require('../middleware/auth');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSignInNotification,
  sendDeactivationEmail,
  sendReactivationEmail,
} = require('../utils/mailer');

const requestPasswordReset = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      let appUrl = process.env.FRONTEND_URL;
      if (!appUrl || appUrl === '*' || !appUrl.startsWith('http')) {
        appUrl = process.env.NODE_ENV === 'production'
          ? 'https://realtime-leaf-detection-system.vercel.app'
          : 'http://localhost:5173';
      }
      appUrl = appUrl.replace(/\/$/, '');
      await sendPasswordResetEmail(user.email, `${appUrl}/reset-password?token=${token}`);
    }
    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: new Date() } })
      .select('+resetPasswordToken +resetPasswordExpires');
    if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });

    user.passwordHash = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Create a new user account. Maps to F.1.
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({
        error: `An account with this ${field} already exists.`,
      });
    }

    // Create user (password hashing handled by pre-save hook)
    const user = new User({
      username,
      email,
      passwordHash: password,
      isVerified: false,
    });
    user.verificationPurpose = 'signup';

    const code = user.setVerificationCode();
    await user.save();

    // Send email asynchronously in background so SMTP timeouts don't block the HTTP response
    sendVerificationEmail(user.email, code).catch((err) =>
      console.error(`Email delivery failed: ${err.message}`)
    );

    res.status(201).json({
      message: 'Account created. Verification code sent to your email.',
      email: user.email,
      requiresVerification: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Verify password and send OTP.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email (include passwordHash for comparison)
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.accountStatus === 'disabled') {
      return res.status(403).json({ error: 'Account has been disabled. Contact an administrator.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let reactivated = false;
    if (user.accountStatus === 'deactivated') {
      const isExpired = user.deactivatedUntil && user.deactivatedUntil.getTime() <= Date.now();

      if (isExpired || req.body.reactivate === true) {
        // Automatically reactivate or user chose early reactivation
        user.accountStatus = 'active';
        user.deactivatedAt = undefined;
        user.deactivatedUntil = undefined;
        user.deactivationReason = undefined;
        reactivated = true;
        sendReactivationEmail(user.email).catch((err) =>
          console.error(`Reactivation email failed: ${err.message}`)
        );
      } else {
        // Still within deactivation window; notify client so user can choose to reactivate
        return res.status(200).json({
          isDeactivated: true,
          email: user.email,
          deactivatedAt: user.deactivatedAt,
          deactivatedUntil: user.deactivatedUntil,
          deactivationReason: user.deactivationReason,
          message: `Your account is temporarily deactivated until ${user.deactivatedUntil ? new Date(user.deactivatedUntil).toLocaleString() : 'scheduled reactivation'}. Would you like to reactivate it now?`,
        });
      }
    }

    // Generate a new otp for login
    const code = user.setVerificationCode();
    user.verificationPurpose = 'login';

    await user.save();

    // Send email asynchronously in background so SMTP timeouts don't block the HTTP response
    sendVerificationEmail(user.email, code).catch((err) =>
      console.error(`Email delivery failed: ${err.message}`)
    );

    res.json({
      message: reactivated
        ? 'Welcome back! Your account has been reactivated. Verification code sent to your email.'
        : 'Verification code sent to your email.',
      email: user.email,
      requiresVerification: true,
      reactivated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-code
 * Verify OTP and generate JWT.
 */
const verifyCode = async(req,res,next) =>{
  try{
    const {email,code} = req.body;
    const user = await User.findOne({email}).select('+verificationCode +verificationCodeExpires +verificationPurpose');
    
    if(!user){
      return res.status(404).json({
        error:'User not found' 
      });
    }

    //verify otp
    const isValid = user.verifyCode(code);
    if(!isValid){
      return res.status(400).json({
        error:'invalid or expired verification code'
      });
    }

    const isSignIn = user.verificationPurpose === 'login';

    //mark email as verified
    user.isVerified = true;

    //remove otp after successful verification
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.verificationPurpose = undefined;

    await user.save();

    if (isSignIn) {
      sendSignInNotification(user.email).catch((error) => {
        console.error(`Could not send sign-in notification: ${error.message}`);
      });
    }

    const token = generateToken(user);

    res.json({
      message:'Verification successful',
      token,
      user: user.toJSON()
    });
  }
  catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-code
 * Generate and send a new OTP.
 */
const resendCode = async(req,res,next)=>{
   try {
     const {email} = req.body;

     const user = await User.findOne({ email });

     if(!user){
        return res.status(404).json({
          error: 'User not found.',
        });
     }

     //generate new otp
     const code = user.setVerificationCode();
     await user.save();

     sendVerificationEmail(user.email, code).catch((err) =>
       console.error(`Email delivery failed: ${err.message}`)
     );

     res.json({
       message: 'A new verification code has been sent.',
     });
   }
   catch (error) {
     next(error);
   }
};






/**
 * POST /api/auth/deactivate
 * Temporarily deactivate the user's own account.
 * Requires authentication and password confirmation.
 */
const deactivateAccount = async (req, res, next) => {
  try {
    const { password, duration, customDays, customDate, reason } = req.body;

    // Fetch user with password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify current password for safety
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password. Please enter your valid password to confirm deactivation.' });
    }

    // Calculate deactivatedUntil timestamp
    let deactivatedUntil;
    const now = Date.now();

    switch (duration) {
      case 'indefinite':
        deactivatedUntil = undefined;
        break;
      case '1_day':
        deactivatedUntil = new Date(now + 1 * 24 * 60 * 60 * 1000);
        break;
      case '3_days':
        deactivatedUntil = new Date(now + 3 * 24 * 60 * 60 * 1000);
        break;
      case '7_days':
        deactivatedUntil = new Date(now + 7 * 24 * 60 * 60 * 1000);
        break;
      case '14_days':
        deactivatedUntil = new Date(now + 14 * 24 * 60 * 60 * 1000);
        break;
      case '30_days':
        deactivatedUntil = new Date(now + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customDays) {
          const daysNum = parseInt(customDays, 10);
          if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
            return res.status(400).json({ error: 'Custom days must be between 1 and 365 days.' });
          }
          deactivatedUntil = new Date(now + daysNum * 24 * 60 * 60 * 1000);
        } else if (customDate) {
          const parsed = new Date(customDate);
          if (isNaN(parsed.getTime()) || parsed.getTime() <= now) {
            return res.status(400).json({ error: 'Custom date must be a valid future date.' });
          }
          if (parsed.getTime() > now + 365 * 24 * 60 * 60 * 1000) {
            return res.status(400).json({ error: 'Deactivation period cannot exceed 1 year.' });
          }
          deactivatedUntil = parsed;
        } else {
          return res.status(400).json({ error: 'Please specify custom days or a future date.' });
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid duration specified.' });
    }

    const deactivatedAt = new Date();
    user.accountStatus = 'deactivated';
    user.deactivatedAt = deactivatedAt;
    user.deactivatedUntil = deactivatedUntil;
    user.deactivationReason = reason ? reason.trim().slice(0, 200) : 'User requested pause';

    await user.save();

    // Send email notification asynchronously
    sendDeactivationEmail(user.email, {
      deactivatedUntil,
      reason: user.deactivationReason,
    }).catch((err) => console.error(`Deactivation email failed: ${err.message}`));

    const untilText = deactivatedUntil
      ? `until ${deactivatedUntil.toLocaleString()}`
      : 'until you choose to reactivate';

    res.json({
      message: `Your account has been deactivated ${untilText}. You can reactivate anytime by signing in.`,
      deactivatedUntil,
      deactivatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reactivate
 * Explicitly reactivate a deactivated account using email and password.
 */
const reactivateAccount = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.accountStatus === 'disabled') {
      return res.status(403).json({ error: 'Account has been disabled. Contact an administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.accountStatus === 'active') {
      return res.status(400).json({ error: 'Account is already active.' });
    }

    // Reactivate account
    user.accountStatus = 'active';
    user.deactivatedAt = undefined;
    user.deactivatedUntil = undefined;
    user.deactivationReason = undefined;

    const code = user.setVerificationCode();
    user.verificationPurpose = 'login';
    await user.save();

    // Send emails asynchronously
    sendReactivationEmail(user.email).catch((err) =>
      console.error(`Reactivation email failed: ${err.message}`)
    );
    sendVerificationEmail(user.email, code).catch((err) =>
      console.error(`Verification email failed: ${err.message}`)
    );

    res.json({
      message: 'Account reactivated successfully. Verification code sent to your email.',
      email: user.email,
      requiresVerification: true,
      reactivated: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current user profile. Requires authentication.
 */
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = {
  register,
  login,
  verifyCode,
  resendCode,
  requestPasswordReset,
  resetPassword,
  deactivateAccount,
  reactivateAccount,
  getMe,
};
