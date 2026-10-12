const User = require('../models/User');
const crypto = require('crypto');
const { generateToken } = require('../middleware/auth');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSignInNotification,
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
      isVarified:false
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

    // Generate a new otp for login
    const code = user.setVerificationCode();
    user.verificationPurpose = 'login';

    await user.save();

    // Send email asynchronously in background so SMTP timeouts don't block the HTTP response
    sendVerificationEmail(user.email, code).catch((err) =>
      console.error(`Email delivery failed: ${err.message}`)
    );

    res.json({
      message: 'Verification code sent to your email.',
      email: user.email,
      requiresVerification: true,
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
    user.isVarified = true;

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

  getMe,

};
