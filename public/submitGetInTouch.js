document.querySelector("#contact-section form").addEventListener("submit", function(event) {
  event.preventDefault(); // Prevent form submission

  // Retrieve form data
  const name = document.querySelector("#name").value;
  const email = document.querySelector("#email").value;
  const phone = document.querySelector("#phone").value;
  const message = document.querySelector("#message").value;

  // Create a constant with the information
  const formData = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`;
  console.log(formData); // Log the constant to the console
});
