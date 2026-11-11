// Shared script for /password/forgot and /password/reset.
const statusBox = document.querySelector("#password-status");

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `alert alert-${type} mt-3`;
  statusBox.hidden = false;
}

async function postJson(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

// Forgot password: always shows the same confirmation, whether or not the email exists.
const forgotForm = document.querySelector("#forgot-form");
if (forgotForm) {
  const button = document.querySelector("#forgot-button");
  forgotForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusBox.hidden = true;
    forgotForm.classList.add("was-validated");
    if (!forgotForm.checkValidity()) return;

    button.disabled = true;
    button.textContent = "Sending...";
    try {
      const email = document.querySelector("#email").value;
      const { ok, data } = await postJson("/api/auth/forgot-password", { email });
      if (!ok) {
        showStatus(data.error || "Something went wrong. Try again.", "danger");
        return;
      }
      showStatus(data.message, "success");
      forgotForm.reset();
      forgotForm.classList.remove("was-validated");
    } catch {
      showStatus("Cannot reach the server. Check your connection and try again.", "danger");
    } finally {
      button.disabled = false;
      button.textContent = "Send reset link";
    }
  });
}

// Reset password: the token comes from the link in the email.
const resetForm = document.querySelector("#reset-form");
if (resetForm) {
  const button = document.querySelector("#reset-button");
  const password = document.querySelector("#password");
  const confirmPassword = document.querySelector("#confirmPassword");
  const token = new URLSearchParams(window.location.search).get("token");

  function validate() {
    confirmPassword.setCustomValidity(
      confirmPassword.value === password.value ? "" : "Passwords do not match"
    );
    resetForm.classList.add("was-validated");
    return resetForm.checkValidity();
  }

  if (!token) {
    showStatus("This reset link is incomplete. Request a new one.", "danger");
    resetForm.querySelectorAll("input, button").forEach((el) => { el.disabled = true; });
  }

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusBox.hidden = true;
    if (!validate()) return;

    button.disabled = true;
    button.textContent = "Saving...";
    try {
      const { ok, data } = await postJson("/api/auth/reset-password", {
        token,
        password: password.value,
      });
      if (!ok) {
        showStatus(data.error || "Could not reset the password.", "danger");
        return;
      }
      resetForm.reset();
      resetForm.classList.remove("was-validated");
      resetForm.hidden = true;
      showStatus(`${data.message} `, "success");
      const link = document.createElement("a");
      link.href = "/index.html";
      link.textContent = "Go to the home page";
      statusBox.append(link);
    } catch {
      showStatus("Cannot reach the server. Check your connection and try again.", "danger");
    } finally {
      button.disabled = false;
      button.textContent = "Set new password";
    }
  });

  confirmPassword.addEventListener("input", () => {
    if (resetForm.classList.contains("was-validated")) validate();
  });
}
