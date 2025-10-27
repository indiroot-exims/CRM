// auth-check.js - Protects pages from unauthorized access

function checkAuth() {
  const userName = localStorage.getItem("userName");
  const userRole = localStorage.getItem("userRole");
  
  // If not logged in, redirect to login page
  if (!userName || !userRole) {
    alert("You must be logged in to access this page.");
    window.location.href = "../Html/login.html"; // Adjust path to your login page
    return false;
  }
  return true;
}

function logout() {
  // Clear all login data
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  
  // Redirect to login page
  alert("You have been logged out successfully.");
  window.location.href = "../Html/index.html"; // Adjust path to your login page
}

// Run auth check on page load
if (!checkAuth()) {
  // Stop page execution if not authenticated
  document.body.innerHTML = "<p>Redirecting to login...</p>";
}
