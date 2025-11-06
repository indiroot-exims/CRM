const scriptURL = "https://script.google.com/macros/s/AKfycbybwFLsKI8D65lBb9arh51EOwFsjvThTZbbdF5UE5PR2_DQPgfzSv0m-J7TzFGLBJBW4g/exec";

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
  // Check authentication first
  if (!checkAuth()) return;
  
  // Display user info
  document.getElementById("userName").textContent = localStorage.getItem("userName") || '';
  document.getElementById("userRole").textContent = localStorage.getItem("userRole") || '';
  document.getElementById("customerFormContainer").style.display = "none";
  loadCustomers();

  // Logout button handler
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Form buttons
  document.getElementById("showAddFormBtn").addEventListener("click", e => {
    e.preventDefault();
    showAddCustomerForm();
  });
  
  document.getElementById("addBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await submitCustomer(false);
  });
  
  document.getElementById("updateBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await submitCustomer(true);
  });
  
  document.getElementById("cancelBtn").addEventListener("click", (e) => {
    e.preventDefault();
    hideForm();
  });
  
  // Search filters
  document.getElementById("searchName").addEventListener("input", filterCustomers);
  document.getElementById("searchPhone").addEventListener("input", filterCustomers);

  // Navigation buttons
  document.getElementById("dashboardBtn").addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });

  document.getElementById("productsBtn").addEventListener("click", () => {
    window.location.href = "products.html";
  });

  document.getElementById("suppliersBtn").addEventListener("click", () => {
    window.location.href = "suppliers.html";
  });
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
  formData.append(isUpdate ? "updateCustomer" : "addCustomer", "true");
  formData.append("name", name);
  formData.append("phone", phone);
  formData.append("email", email);
  formData.append("address", address);
  if (isUpdate && editingCustomerId) formData.append("customerId", editingCustomerId);

  try {
    const response = await fetch(scriptURL, {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      alert(isUpdate ? "Customer updated successfully!" : "Customer added successfully!");
      hideForm();
      loadCustomers();
    } else {
      alert("Error: " + result.message);
    }
  } catch (error) {
    console.error(`Error ${isUpdate ? "updating" : "adding"} customer:`, error);
    alert(`Failed to ${isUpdate ? "update" : "add"} customer.`);
  }
}

async function loadCustomers() {
  try {
    const response = await fetch(`${scriptURL}?getCustomers`);
    const data = await response.json();
    window._loadedCustomerRows = data;
    displayCustomers(data);
  } catch (error) {
    console.error("Error loading customers:", error);
  }
}

function displayCustomers(data) {
  const tableBody = document.querySelector("#customersTable tbody");
  tableBody.innerHTML = "";
  
  data.forEach((row, idx) => {
    const tr = document.createElement("tr");
    
    // Row structure: [CustomerID, Name, Phone, Email, Address, CreatedDate]
    row.forEach((cell, colIdx) => {
      const td = document.createElement("td");
      // Format date column (index 5 - CreatedDate)
      if (colIdx === 5) {
        td.textContent = formatDateDisplay(cell);
      } else {
        td.textContent = cell;
      }
      tr.appendChild(td);
    });
    
    // Add action buttons
    const actionTd = document.createElement("td");
    actionTd.innerHTML = `<button class="action-btn edit-btn" onclick="editCustomer(${idx})">Edit</button>`;
    tr.appendChild(actionTd);
    tableBody.appendChild(tr);
  });
}

// Edit customer: load data into form
window.editCustomer = function (idx) {
  const rowData = window._loadedCustomerRows[idx];
  // Row structure: [CustomerID, Name, Phone, Email, Address, CreatedDate]
  editingCustomerId = rowData[0];
  document.getElementById("name").value = rowData[1];
  document.getElementById("phone").value = rowData[2];
  document.getElementById("email").value = rowData[3] || "";
  document.getElementById("address").value = rowData[4] || "";
  showEditCustomerForm();
};

function formatDateDisplay(cell) {
  if (/^\d{4}-\d{2}-\d{2}/.test(cell)) {
    const parts = cell.split(/[-T]/);
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cell)) return cell;
  return cell;
}

// ===== SEARCH FILTER =====
function filterCustomers() {
  const nameFilter = document.getElementById("searchName").value.trim().toLowerCase();
  const phoneFilter = document.getElementById("searchPhone").value.trim();

  // Only one active at a time, or neither
  if ((nameFilter.length < 3 && phoneFilter.length < 3) || (nameFilter && phoneFilter)) {
    displayCustomers(window._loadedCustomerRows);
    return;
  }
  
  let filtered = [];
  if (nameFilter.length >= 3 && !phoneFilter) {
    filtered = window._loadedCustomerRows.filter(row => {
      const name = (row[1] || "").toLowerCase();
      return name.includes(nameFilter);
    });
  } else if (phoneFilter.length >= 3 && !nameFilter) {
    filtered = window._loadedCustomerRows.filter(row => {
      const phone = String(row[2] || "");
      return phone.includes(phoneFilter);
    });
  } else {
    filtered = window._loadedCustomerRows;
  }
  displayCustomers(filtered);
}

