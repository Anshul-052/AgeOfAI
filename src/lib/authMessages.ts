export function friendlyAuthError(cause: unknown, action: 'login' | 'signup' | 'recovery') {
  const fallback = action === 'recovery'
    ? 'We could not send the reset email. Please try again.'
    : action === 'signup'
      ? 'We could not create your account. Please try again.'
      : 'We could not sign you in. Please check your details and try again.';
  if (!(cause instanceof Error)) return fallback;

  const message = cause.message.toLowerCase();
  if (message.includes('rate limit') || message.includes('too many requests') || message.includes('over_email_send_rate_limit')) {
    return action === 'recovery'
      ? 'Password-reset email is temporarily busy. Please wait a few minutes and submit once; repeated attempts extend the delay.'
      : 'Account email service is temporarily busy. Please wait a few minutes and try once.';
  }
  if (message.includes('invalid login credentials')) {
    return 'That email and password do not match. Try again or use “Forgot password?” below.';
  }
  if (message.includes('email not confirmed')) {
    return 'This account is waiting for email confirmation. Check the original confirmation email, or create a reader account with another email while launch access is open.';
  }
  if (message.includes('user already registered')) {
    return 'An account already uses this email. Sign in instead, or reset its password.';
  }
  if (message.includes('provider is not enabled') || message.includes('unsupported provider')) {
    return 'Google sign-in is being activated. Please use email sign-in for the moment.';
  }
  return cause.message || fallback;
}
