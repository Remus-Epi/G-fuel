document.querySelector("#contact-section form").addEventListener("submit", function (event) {
  event.preventDefault();

  const status = document.querySelector("#contact-status");
  status.textContent = "Thanks for reaching out! This is a demo, so your message was not sent.";
  status.hidden = false;
  event.target.reset();
});
