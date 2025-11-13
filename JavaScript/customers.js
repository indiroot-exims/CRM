const scriptURL = "https://script.google.com/macros/s/AKfycby1JswV6CT9ybHu9HTCA176qxIaK8aZaRrfihDf3q-kM6wgMfqyCy8lJqP3rRjgHdkL-w/exec";

let editingCustomerId = null;

// ===== AUTHENTICATION CHECK =====
function checkAuth() {
  const userName = localStorage.getItem("userName");
  const userRole = localStorage.getItem("userRole");

  if (!userName || !userRole) {
    alert("You must be logged in to access this page.");
    window.location.href = "../Html/login.html";
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  alert("You have been logged out successfully.");
  window.location.href = "../Html/login.html";
}

// ===== PAGE INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;

  document.getElementById("userName").textContent = localStorage.getItem("userName") || '';
  document.getElementById("userRole").textContent = localStorage.getItem("userRole") || '';
  document.getElementById("customerFormContainer").style.display = "none";

  loadCustomers();

  // Button bindings
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("showAddFormBtn").addEventListener("click", e => {
    e.preventDefault();
    showAddCustomerForm();
  });
  document.getElementById("addBtn").addEventListener("click", e => {
    e.preventDefault();
    submitCustomer(false);
  });
  document.getElementById("updateBtn").addEventListener("click", e => {
    e.preventDefault();
    submitCustomer(true);
  });
  document.getElementById("cancelBtn").addEventListener("click", e => {
    e.preventDefault();
    hideForm();
  });

  // Search Filters
  document.getElementById("searchName").addEventListener("input", filterCustomers);
  document.getElementById("searchPhone").addEventListener("input", filterCustomers);

  // Navigation
  document.getElementById("dashboardBtn").addEventListener("click", () => window.location.href = "dashboard.html");
  document.getElementById("productsBtn").addEventListener("click", () => window.location.href = "products.html");
  document.getElementById("suppliersBtn").addEventListener("click", () => window.location.href = "suppliers.html");
});

// ===== FORM MANAGEMENT =====
function showAddCustomerForm() {
  document.getElementById("customerForm").reset();
  editingCustomerId = null;
  toggleFormMode(false);
  document.getElementById("customerFormContainer").style.display = "";
}

function showEditCustomerForm() {
  toggleFormMode(true);
  document.getElementById("customerFormContainer").style.display = "";
}

function hideForm() {
  document.getElementById("customerForm").reset();
  editingCustomerId = null;
  document.getElementById("customerFormContainer").style.display = "none";
}

function toggleFormMode(isEdit) {
  document.getElementById("addBtn").style.display = isEdit ? "none" : "";
  document.getElementById("updateBtn").style.display = isEdit ? "" : "none";
  document.getElementById("cancelBtn").style.display = "";
}

// ===== CUSTOMER CRUD OPERATIONS =====
async function submitCustomer(isUpdate) {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("address").value.trim();

  if (!name || !phone) {
    alert("Name and Phone are required fields.");
    return;
  }

  const formData = new FormData();
 formData.append("action", isUpdate ? "updateCustomer" : "addCustomer");
  formData.append("name", name);
  formData.append("phone", phone);
  formData.append("email", email);
  formData.append("address", address);
  if (isUpdate && editingCustomerId) formData.append("customerId", editingCustomerId);

  try {
    const response = await fetch(scriptURL, {
      method: "POST",
      body: formData,
      mode: "cors"
    });
    const result = await response.json();

    if (result.success) {
      alert(isUpdate ? "Customer updated successfully!" : "Customer added successfully!");
      hideForm();
      await loadCustomers();
    } else {
      alert("Error: " + (result.message || "Unknown error."));
    }
  } catch (error) {
    console.error("❌ Fetch Error:", error);
    alert("Failed to connect to server. Please check your internet or Apps Script deployment.");
  }
}

// ===== LOAD CUSTOMERS =====
async function loadCustomers() {
  try {
    const response = await fetch(`${scriptURL}?getCustomers=true`, { mode: "cors" });
    const rawData = await response.json();

    let data = [];
    if (rawData.success && Array.isArray(rawData.data)) {
      data = rawData.data;
    } else if (Array.isArray(rawData)) {
      data = rawData;
    } else {
      console.warn("Unexpected data format:", rawData);
      throw new Error("Invalid data format received from server.");
    }

    window._loadedCustomerRows = data;
    displayCustomers(data);
  } catch (error) {
    console.error("❌ Error loading customers:", error);
    alert("Unable to fetch customers. Please try again later.");
  }
}

// ===== DISPLAY CUSTOMERS =====
function displayCustomers(data) {
  const tableBody = document.querySelector("#customersTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  data.forEach((row, idx) => {
    const tr = document.createElement("tr");

    row.forEach((cell, colIdx) => {
      const td = document.createElement("td");
      td.textContent = (colIdx === 5) ? formatDateDisplay(cell) : (cell || "");
      tr.appendChild(td);
    });

    const actionTd = document.createElement("td");
    actionTd.innerHTML = `<button class="action-btn edit-btn" onclick="editCustomer(${idx})">Edit</button>`;
    tr.appendChild(actionTd);
    tableBody.appendChild(tr);
  });
}

// ===== EDIT CUSTOMER =====
window.editCustomer = function (idx) {
  const rowData = window._loadedCustomerRows[idx];
  if (!rowData) return;

  editingCustomerId = rowData[0];
  document.getElementById("name").value = rowData[1] || "";
  document.getElementById("phone").value = rowData[2] || "";
  document.getElementById("email").value = rowData[3] || "";
  document.getElementById("address").value = rowData[4] || "";
  showEditCustomerForm();
};

// ===== DATE FORMATTER =====
function formatDateDisplay(cell) {
  if (!cell) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(cell)) {
    const [year, month, day] = cell.split(/[-T]/);
    return `${day}/${month}/${year}`;
  }
  return cell;
}

// ===== SEARCH FILTER =====
function filterCustomers() {
  const nameFilter = document.getElementById("searchName").value.trim().toLowerCase();
  const phoneFilter = document.getElementById("searchPhone").value.trim();

  if ((!nameFilter && !phoneFilter) || (nameFilter && phoneFilter)) {
    displayCustomers(window._loadedCustomerRows);
    return;
  }

  let filtered = window._loadedCustomerRows.filter(row => {
    const name = (row[1] || "").toLowerCase();
    const phone = String(row[2] || "");
    return (nameFilter && name.includes(nameFilter)) || (phoneFilter && phone.includes(phoneFilter));
  });

  displayCustomers(filtered);
}

