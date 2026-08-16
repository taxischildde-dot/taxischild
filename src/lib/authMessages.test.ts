import { describe, expect, it } from 'vitest';
import { getLoginErrorMessage, getResendErrorMessage } from './authMessages';

describe('authentication messages', () => {
  it('explains that the email must be confirmed', () => {
    expect(getLoginErrorMessage({ code: 'email_not_confirmed', message: 'Email not confirmed' })).toContain('bestätigen');
    expect(getLoginErrorMessage({ message: 'Email not confirmed' })).toContain('Spam-Ordner');
  });

  it('keeps invalid credentials generic', () => {
    expect(getLoginErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'E-Mail-Adresse oder Passwort ist falsch',
    );
  });

  it('explains resend rate limits and generic resend failures', () => {
    expect(getResendErrorMessage({ message: 'For security purposes, you can only request this after a rate limit window' })).toContain(
      'Zu viele Anfragen',
    );
    expect(getResendErrorMessage({ message: 'Unexpected SMTP error' })).toContain('konnte nicht versendet werden');
  });
});
