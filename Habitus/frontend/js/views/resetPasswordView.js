import { resetPassword } from "../api/authApi.js";
import { navigateTo } from "../router.js";
import { showNotification } from "../ui.js";

export function initResetPasswordView() {
    const resetPasswordForm = document.getElementById("reset-password-form");
    const resetBackToLoginBtn = document.getElementById("reset-back-to-login");

    // Navigation back to login
    if (resetBackToLoginBtn) {
        resetBackToLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            navigateTo("login");
        });
    }

    // RESET PASSWORD
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = document.getElementById('reset-submit-btn');
            if (btn) {
                btn.innerHTML = '<span class="loading-spinner"></span>';
                btn.disabled = true;
            }

            const newPassword = document.getElementById("reset-password").value;
            const confirmPassword = document.getElementById("reset-password-confirm").value;

            // Validate passwords match
            if (newPassword !== confirmPassword) {
                showNotification("Passwords do not match", "error");
                if (btn) {
                    btn.innerHTML = 'Reset Password';
                    btn.disabled = false;
                }
                return;
            }

            // Get token from URL query string
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                showNotification("Invalid reset link", "error");
                if (btn) {
                    btn.innerHTML = 'Reset Password';
                    btn.disabled = false;
                }
                return;
            }

            try {
                await resetPassword(token, newPassword);
                showNotification("Password reset successfully! Please sign in with your new password.");
                navigateTo("login");
            } catch (err) {
                showNotification(err.message || "Failed to reset password", "error");
                console.error(err);
            } finally {
                if (btn) {
                    btn.innerHTML = 'Reset Password';
                    btn.disabled = false;
                }
            }
        });
    }
}

export function renderResetPassword() {
    console.log("Rendering reset password view");

    // Get token from URL and show error if missing
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showNotification("Invalid or missing reset token", "error");
    }
}
