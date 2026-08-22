import type { getDict } from "@oma/core";
import type { AuthError } from "@/app/login/actions";

/**
 * The message for an auth failure.
 *
 * Shared by the login and signup forms so the two cannot describe the same
 * failure differently, and kept out of the server action so the action stays a
 * classifier — it decides what went wrong; this decides how to say it.
 */
export function authErrorMessage(t: ReturnType<typeof getDict>, error: AuthError): string {
  switch (error) {
    case "rate":
      return t.authErrRate;
    case "weak_password":
      return t.authErrWeakPassword;
    case "email":
      return t.authErrEmail;
    case "credentials":
      return t.authErrInvalidLogin;
    case "unconfirmed":
      return t.authErrNotConfirmed;
    case "invalid":
      return t.authErrGeneric;
  }
}
