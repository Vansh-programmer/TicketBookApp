const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account exists for this email.',
  'auth/wrong-password': 'The password you entered is incorrect.',
  'auth/invalid-credential': 'Your email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters long.',
  'auth/missing-password': 'Please enter your password.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
  'auth/too-many-requests': 'Too many attempts. Please try again in a few minutes.',
};

export const getFirebaseAuthErrorMessage = (error) =>
  AUTH_ERROR_MESSAGES[error?.code] || 'Something went wrong. Please try again.';
