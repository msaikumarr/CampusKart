const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { SERVER_URL } = require('./env');
const googleAuthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const isCollegeEmail = (email) => {
  const allowedSuffixes = ['edu', 'edu.in', 'ac.in', 'ac.uk'];
  const allowedDomains = (process.env.COLLEGE_EMAIL_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  const normalizedEmail = normalizeEmail(email);
  const emailDomain = normalizedEmail.split('@')[1] || '';

  if (allowedDomains.length > 0) {
    return allowedDomains.includes(emailDomain);
  }

  return allowedSuffixes.some((suffix) =>
    emailDomain === suffix || emailDomain.endsWith(`.${suffix}`)
  );
};

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (googleAuthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${SERVER_URL}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleEmail = normalizeEmail(profile.emails?.[0]?.value);

          if (!isCollegeEmail(googleEmail)) {
            return done(new Error('Please use a valid college email account'), null);
          }

          // Check if user already exists
          let user = await User.findOne({ email: googleEmail });

          if (user) {
            // Update user with Google info if not already set
            if (!user.username) {
              user.username = profile.displayName;
            }
            await user.save();
            return done(null, user);
          }

          // New users must complete normal signup to upload student ID proof
          return done(new Error('Please sign up with email and student ID card first'), null);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

passport.googleAuthEnabled = googleAuthEnabled;

module.exports = passport;