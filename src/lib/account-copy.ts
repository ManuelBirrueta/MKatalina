/**
 * ============================================================================
 *  MKatalina · Textos de cuenta: confirmar correo y contraseña · Etapa 6C
 * ============================================================================
 *
 *  Todos los textos nuevos de la Etapa 6C (es/en) en un solo lugar:
 *  "Revisa tu correo", reenviar confirmación, recuperar y cambiar contraseña.
 *
 *  ¿Por qué aquí y no en messages/es.json y en.json? Para que esta etapa
 *  funcione con solo copiar archivos, sin editar a mano esos JSON (que son
 *  enormes y fáciles de romper). Es el mismo criterio que ya usan otras
 *  partes del sitio con objetos COPY.
 *
 *  Lo usan:
 *    - src/components/auth/CheckEmailNotice.tsx (aviso "Revisa tu correo")
 *    - src/components/auth/LoginForm.tsx / RegisterForm.tsx
 *    - src/app/[locale]/confirmar/page.tsx
 *    - src/app/[locale]/recuperar-contrasena/page.tsx
 *    - src/app/[locale]/actualizar-contrasena/page.tsx
 *    - src/app/[locale]/checkout/confirmacion/page.tsx (cuenta de invitado)
 * ============================================================================
 */

export const ACCOUNT_COPY = {
  es: {
    // Aviso "Revisa tu correo" (registro y cuenta de invitado)
    checkEmailTitle: "Revisa tu correo",
    checkEmailText: (email: string) =>
      `Te enviamos un enlace a ${email} para confirmar tu cuenta. Ábrelo y pulsa “Confirmar mi correo”. Si no lo ves en unos minutos, revisa tu carpeta de spam.`,
    resend: "Reenviar correo",
    resendIn: (seconds: number) => `Reenviar en ${seconds} s`,
    resent: "Te enviamos el correo de nuevo.",
    rateLimited: "Demasiados intentos. Espera unos minutos y vuelve a intentar.",
    sendError: "No pudimos enviar el correo. Inténtalo de nuevo en un momento.",
    goToLogin: "Ir a iniciar sesión",

    // Inicio de sesión con correo sin confirmar
    notConfirmed: "Aún no confirmas tu correo. Abre el enlace que te enviamos al registrarte o pide uno nuevo.",

    // /confirmar
    confirmEyebrow: "Tu cuenta",
    confirmTitle: "Confirma tu correo",
    confirmSubtitle: "Un último paso para activar tu cuenta de MKatalina.",
    confirmButton: "Confirmar mi correo",
    confirming: "Confirmando…",
    confirmed: "¡Correo confirmado! Bienvenida a MKatalina.",
    invalidLinkTitle: "Este enlace ya no es válido",
    invalidConfirmText: "Puede que ya lo hayas usado o que haya vencido. Si ya confirmaste tu correo, solo inicia sesión; si no, inicia sesión con tus datos y te ofreceremos reenviar el correo.",

    // /recuperar-contrasena
    forgotEyebrow: "Tu cuenta",
    forgotTitle: "Recupera tu contraseña",
    forgotSubtitle: "Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.",
    emailLabel: "Correo electrónico",
    emailInvalid: "Escribe un correo válido.",
    sendLink: "Enviar enlace",
    sending: "Enviando…",
    forgotSentTitle: "Revisa tu correo",
    forgotSentText: (email: string) =>
      `Si existe una cuenta con ${email}, te llegará un enlace para crear una contraseña nueva. Revisa también tu carpeta de spam.`,
    rememberedPrompt: "¿Ya la recordaste?",
    loginLink: "Inicia sesión",

    // /actualizar-contrasena
    resetEyebrow: "Tu cuenta",
    resetTitle: "Crea tu contraseña nueva",
    resetSubtitle: "Elige una contraseña que no hayas usado antes en MKatalina.",
    newPassword: "Contraseña nueva",
    confirmPassword: "Repite la contraseña",
    passwordsDontMatch: "Las contraseñas no coinciden.",
    weakPassword: "La contraseña no cumple los requisitos.",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    savePassword: "Guardar contraseña",
    saving: "Guardando…",
    passwordSaved: "¡Listo! Tu contraseña se cambió y ya iniciaste sesión.",
    samePassword: "Esa ya era tu contraseña, así que no cambió nada. Ya iniciaste sesión.",
    invalidResetText: "Puede que ya lo hayas usado o que haya vencido. Pide un enlace nuevo para cambiar tu contraseña.",
    requestNewLink: "Pedir un enlace nuevo",
    serverError: "Algo salió mal. Inténtalo de nuevo en un momento.",
  },
  en: {
    checkEmailTitle: "Check your email",
    checkEmailText: (email: string) =>
      `We sent a link to ${email} to confirm your account. Open it and click “Confirm my email”. If you don't see it in a few minutes, check your spam folder.`,
    resend: "Resend email",
    resendIn: (seconds: number) => `Resend in ${seconds}s`,
    resent: "We sent the email again.",
    rateLimited: "Too many attempts. Please wait a few minutes and try again.",
    sendError: "We couldn't send the email. Please try again in a moment.",
    goToLogin: "Go to sign in",

    notConfirmed: "You haven't confirmed your email yet. Open the link we sent when you signed up, or request a new one.",

    confirmEyebrow: "Your account",
    confirmTitle: "Confirm your email",
    confirmSubtitle: "One last step to activate your MKatalina account.",
    confirmButton: "Confirm my email",
    confirming: "Confirming…",
    confirmed: "Email confirmed! Welcome to MKatalina.",
    invalidLinkTitle: "This link is no longer valid",
    invalidConfirmText: "You may have already used it, or it may have expired. If you already confirmed your email, just sign in; if not, sign in with your details and we'll offer to resend the email.",

    forgotEyebrow: "Your account",
    forgotTitle: "Reset your password",
    forgotSubtitle: "Enter your account email and we'll send you a link to create a new password.",
    emailLabel: "Email",
    emailInvalid: "Please enter a valid email.",
    sendLink: "Send link",
    sending: "Sending…",
    forgotSentTitle: "Check your email",
    forgotSentText: (email: string) =>
      `If an account exists for ${email}, you'll receive a link to create a new password. Please also check your spam folder.`,
    rememberedPrompt: "Remembered it?",
    loginLink: "Sign in",

    resetEyebrow: "Your account",
    resetTitle: "Create your new password",
    resetSubtitle: "Choose a password you haven't used before at MKatalina.",
    newPassword: "New password",
    confirmPassword: "Repeat the password",
    passwordsDontMatch: "Passwords don't match.",
    weakPassword: "The password doesn't meet the requirements.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    savePassword: "Save password",
    saving: "Saving…",
    passwordSaved: "Done! Your password was changed and you're signed in.",
    samePassword: "That was already your password, so nothing changed. You're signed in.",
    invalidResetText: "You may have already used it, or it may have expired. Request a new link to change your password.",
    requestNewLink: "Request a new link",
    serverError: "Something went wrong. Please try again in a moment.",
  },
} as const;

/** Textos en el idioma activo. */
export function accountCopy(locale: string) {
  return locale === "en" ? ACCOUNT_COPY.en : ACCOUNT_COPY.es;
}

/** Validación simple de correo (la misma idea que el checkout). */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}