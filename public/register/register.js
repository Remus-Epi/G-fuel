const form = document.querySelector("#register-form");
const button = document.querySelector("#register-button");
const statusBox = document.querySelector("#register-status");
const password = document.querySelector("#password");
const confirmPassword = document.querySelector("#confirmPassword");

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `alert alert-${type} mt-3`;
  statusBox.hidden = false;
}

function validate() {
  confirmPassword.setCustomValidity(
    confirmPassword.value === password.value ? "" : "Passwords do not match"
  );
  form.classList.add("was-validated");
  return form.checkValidity();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusBox.hidden = true;
  if (!validate()) return;

  const data = Object.fromEntries(new FormData(form));
  delete data.confirmPassword;

  button.disabled = true;
  button.textContent = "Creating account...";
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      showStatus(body.error || "Registration failed. Try again.", "danger");
      return;
    }

    Auth.save(body.token, body.user);
    form.reset();
    form.classList.remove("was-validated");
    showStatus(`Account created for ${body.user.email}. Redirecting to the shop...`, "success");
    setTimeout(() => { window.location.href = "../shop/index.html"; }, 1500);
  } catch {
    showStatus("Cannot reach the server. Check your connection and try again.", "danger");
  } finally {
    button.disabled = false;
    button.textContent = "Register";
  }
});

confirmPassword.addEventListener("input", () => {
  if (form.classList.contains("was-validated")) validate();
});
