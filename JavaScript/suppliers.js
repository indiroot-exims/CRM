const scriptURL = "https://script.google.com/macros/s/AKfycbywtNWooKfIiBOmwzYyVJE2WYIAvYVMghIKpHMR9Ua3gnoHWqbAF62rDRXszG7dndWmLA/exec";

let editingSupplierId = null;

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
  document.getElementById("supplierFormContainer").style.display = "none";

  loadSuppliers();
  loadProductsDropdown(); // ✅ Load product list for dropdown

  document.getElementById("logoutBtn").addEventListener("click", logout);

  document.getElementById("showAddFormBtn").addEventListener("click", (e) => {
    e.preventDefault();
    showAddSupplierForm();
  });

  document.getElementById("addBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await submitSupplier(false);
  });

  document.getElementById("updateBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await submitSupplier(true);
  });

  document.getElementById("cancelBtn").addEventListener("click", (e) => {
    e.preventDefault();
    hideForm();
  });

  document.getElementById("searchName").addEventListener("input", filterSuppliers);
  document.getElementById("searchPhone").addEventListener("input", filterSuppliers);

  document.getElementById("dashboardBtn").addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
  document.getElementById("customersBtn").addEventListener("click", () => {
    window.location.href = "customers.html";
  });
  document.getElementById("productsBtn").addEventListener("click", () => {
    window.location.href = "products.html";
  });
});

// ===== LOAD PRODUCTS INTO DROPDOWN =====
async function loadProductsDropdown() {
  try {
    const res = await fetch(`${scriptURL}?getProducts=true`);
    const data = await res.json();

    const dropdown = document.getElementById("productName");
    dropdown.innerHTML = `<option value="">Select Product</option>`;

    data.forEach(row => {
      const option = document.createElement("option");
      option.value = row[1]; // Assuming column B = Product Name
      option.textContent = row[1];
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// ===== FORM MANAGEMENT =====
function showAddSupplierForm() {
  document.getElementById("supplierForm").reset();
  editingSupplierId = null;
  toggleFormMode(false);
  document.getElementById("supplierFormContainer").style.display = "block";
}

function showEditSupplierForm() {
  toggleFormMode(true);
  document.getElementById("supplierFormContainer").style.display = "block";
}

function hideForm() {
  document.getElementById("supplierForm").reset();
  editingSupplierId = null;
  document.getElementById("supplierFormContainer").style.display = "none";
}

function toggleFormMode(isEdit) {
  document.getElementById("addBtn").style.display = isEdit ? "none" : "";
  document.getElementById("updateBtn").style.display = isEdit ? "" : "none";
  document.getElementById("cancelBtn").style.display = "";
}

// ===== SUPPLIER CRUD OPERATIONS =====
async function submitSupplier(isUpdate) {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("address").value.trim();
  const productCategory = document.getElementById("productCategory").value.trim();
  const productName = document.getElementById("productName").value.trim();
  const rate = document.getElementById("rate").value.trim();

  if (!name || !phone) {
    alert("Supplier Name and Phone are required fields.");
    return;
  }

  const formData = new FormData();
  formData.append(isUpdate ? "updateSupplier" : "addSupplier", "true");
  formData.append("name", name);
  formData.append("phone", phone);
  formData.append("email", email);
  formData.append("address", address);
  formData.append("productCategory", productCategory);
  formData.append("productName", productName);
  formData.append("rate", rate);

  if (isUpdate && editingSupplierId) formData.append("supplierId", editingSupplierId);

  try {
    const response = await fetch(scriptURL, { method: "POST", body: formData });
    const result = await response.json();
    if (result.success) {
      alert(isUpdate ? "Supplier updated successfully!" : "Supplier added successfully!");
      hideForm();
      loadSuppliers();
    } else {
      alert("Error: " + result.message);
    }
  } catch (error) {
    console.error(`Error ${isUpdate ? "updating" : "adding"} supplier:`, error);
    alert(`Failed to ${isUpdate ? "update" : "add"} supplier.`);
  }
}

async function loadSuppliers() {
  try {
    const response = await fetch(`${scriptURL}?getSuppliers`);
    const data = await response.json();
    window._loadedSupplierRows = data;
    displaySuppliers(data);
  } catch (error) {
    console.error("Error loading suppliers:", error);
  }
}

function displaySuppliers(data) {
  const tableBody = document.querySelector("#suppliersTable tbody");
  tableBody.innerHTML = "";

  data.forEach((row, idx) => {
    const tr = document.createElement("tr");

    // Updated Row: [SupplierID, Name, Phone, Email, Address, ProductCategory, ProductName, Rate, DateAdded]
    row.forEach((cell, colIdx) => {
      const td = document.createElement("td");
      // Format date column (index 8 - DateAdded)
      if (colIdx === 8) {
        td.textContent = formatDateDisplay(cell);
      } else {
        td.textContent = cell;
      }
      tr.appendChild(td);
    });

    const actionTd = document.createElement("td");
    actionTd.innerHTML = `
      <button class="action-btn edit-btn" onclick="editSupplier(${idx})">Edit</button>
    `;
    tr.appendChild(actionTd);
    tableBody.appendChild(tr);
  });
}

// ===== EDIT SUPPLIER =====
window.editSupplier = function (idx) {
  const rowData = window._loadedSupplierRows[idx];
  editingSupplierId = rowData[0];
  document.getElementById("name").value = rowData[1];
  document.getElementById("phone").value = rowData[2];
  document.getElementById("email").value = rowData[3] || "";
  document.getElementById("address").value = rowData[4] || "";
  document.getElementById("productCategory").value = rowData[5] || "";
  document.getElementById("productName").value = rowData[6] || "";
  document.getElementById("rate").value = rowData[7] || "";
  showEditSupplierForm();
};

// ===== FORMAT DATE =====
function formatDateDisplay(cell) {
  if (/^\d{4}-\d{2}-\d{2}/.test(cell)) {
    const parts = cell.split(/[-T]/);
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cell)) return cell;
  return cell;
}

// ===== SEARCH FILTER =====
function filterSuppliers() {
  const nameFilter = document.getElementById("searchName").value.trim().toLowerCase();
  const phoneFilter = document.getElementById("searchPhone").value.trim();

  if ((nameFilter.length < 3 && phoneFilter.length < 3) || (nameFilter && phoneFilter)) {
    displaySuppliers(window._loadedSupplierRows);
    return;
  }

  let filtered = [];
  if (nameFilter.length >= 3 && !phoneFilter) {
    filtered = window._loadedSupplierRows.filter(row => (row[1] || "").toLowerCase().includes(nameFilter));
  } else if (phoneFilter.length >= 3 && !nameFilter) {
    filtered = window._loadedSupplierRows.filter(row => String(row[2] || "").includes(phoneFilter));
  } else {
    filtered = window._loadedSupplierRows;
  }
  displaySuppliers(filtered);
}
