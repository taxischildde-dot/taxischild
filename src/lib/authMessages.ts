type AuthErrorLike = { code?: string | null; message?: string | null } | null;

export function getLoginErrorMessage(error: AuthErrorLike): string {
  const errorCode = error?.code ?? '';
  const errorText = error?.message?.toLowerCase() ?? '';
  if (errorCode === 'email_not_confirmed' || errorText.includes('email not confirmed')) {
    return 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Prüfen Sie auch den Spam-Ordner.';
  }
  return 'E-Mail-Adresse oder Passwort ist falsch';
}

export function getResendErrorMessage(error: AuthErrorLike): string {
  const errorText = error?.message?.toLowerCase() ?? '';
  if (errorText.includes('rate limit') || errorText.includes('too many')) {
    return 'Zu viele Anfragen. Bitte warten Sie einige Minuten und versuchen Sie es erneut.';
  }
  return 'Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte prüfen Sie die Adresse oder versuchen Sie es später erneut.';
}
