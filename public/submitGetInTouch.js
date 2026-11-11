document.querySelector("#contact-section form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const form = event.target;
  const status = document.querySelector("#contact-status");
  const button = form.querySelector("button[type=submit]");

  function show(message, type) {
    status.textContent = message;
    status.className = `alert alert-${type} mt-3`;
    status.hidden = false;
  }

  button.disabled = true;
  button.textContent = "Sending...";
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      show(body.error || "Your message could not be sent. Try again.", "danger");
      return;
    }
    show(body.emailSent
      ? "Thanks for reaching out! Your message was sent to our team."
      : "Thanks for reaching out! We received your message.", "success");
    form.reset();
  } catch {
    show("Cannot reach the server. Check your connection and try again.", "danger");
  } finally {
    button.disabled = false;
    button.textContent = "Submit";
  }
});
