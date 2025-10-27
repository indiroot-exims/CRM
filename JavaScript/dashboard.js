// Display user information from localStorage
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userName").textContent = localStorage.getItem("userName");
  document.getElementById("userRole").textContent = localStorage.getItem("userRole");

  // Navigation buttons
  document.getElementById("customersBtn").addEventListener("click", () => {
    window.location.href = "customers.html";
  });

  document.getElementById("productsBtn").addEventListener("click", () => {
    window.location.href = "products.html";
  });

  document.getElementById("suppliersBtn").addEventListener("click", () => {
    window.location.href = "suppliers.html";
  });
  document.getElementById("inquiriesBtn").addEventListener("click", () => {
    window.location.href = "inquiry.html";
  });
});
