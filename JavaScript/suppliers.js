const scriptURL = "https://script.google.com/macros/s/AKfycby1JswV6CT9ybHu9HTCA176qxIaK8aZaRrfihDf3q-kM6wgMfqyCy8lJqP3rRjgHdkL-w/exec";

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

  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");
  const formContainer = document.getElementById("supplierFormContainer");

  if (userNameEl) userNameEl.textContent = localStorage.getItem("userName") || '';
  if (userRoleEl) userRoleEl.textContent = localStorage.getItem("userRole") || '';
  if (formContainer) formContainer.style.display = "none";

  loadSuppliers();
  loadProductsDropdown();

  // ===== NAVIGATION =====
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("dashboardBtn")?.addEventListener("click", () => window.location.href = "dashboard.html");
  document.getElementById("customersBtn")?.addEventListener("click", () => window.location.href = "customers.html");
  document.getElementById("productsBtn")?.addEventListener("click", () => window.location.href = "products.html");

  // ===== FORM BUTTONS =====
  document.getElementById("showAddFormBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showAddSupplierForm();
  });

  document.getElementById("addBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await submitSupplier(false);
  });

  document.getElementById("updateBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await submitSupplier(true);
  });

  document.getElementById("cancelBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    hideForm();
  });

  // ===== FILTERS =====
  document.getElementById("searchName")?.addEventListener("input", filterSuppliers);
  document.getElementById("searchPhone")?.addEventListener("input", filterSuppliers);
});

// ===== LOAD PRODUCTS INTO DROPDOWN =====
async function loadProductsDropdown() {
  try {
    const response = await fetch(`${scriptURL}?getProducts=true`, { mode: "cors" });
    const data = await response.json();

    const dropdown = document.getElementById("productName");
    if (!dropdown) return;

    dropdown.innerHTML = `<option value="">Select Product</option>`;

    data.forEach(row => {
      const option = document.createElement("option");
      option.value = row[1]; // Assuming column B = Product Name
      option.textContent = row[1];
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Error loading products:", err);
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
    const response = await fetch(scriptURL, {
      method: "POST",
      body: formData,
      mode: "cors"
    });
    const result = await response.json();

    if (result.success) {
      alert(isUpdate ? "Supplier updated successfully!" : "Supplier added successfully!");
      hideForm();
      await loadSuppliers();
    } else {
      alert("Error: " + (result.message || "Unknown error occurred."));
    }
  } catch (error) {
    console.error("❌ Error submitting supplier:", error);
    alert(`Failed to ${isUpdate ? "update" : "add"} supplier. Please try again.`);
  }
}

// ===== LOAD SUPPLIERS =====
async function loadSuppliers() {
  try {
    const response = await fetch(`${scriptURL}?getSuppliers=true`, { mode: "cors" });
    const data = await response.json();

    if (!Array.isArray(data)) throw new Error("Invalid data format from server.");
    window._loadedSupplierRows = data;
    displaySuppliers(data);
  } catch (error) {
    console.error("❌ Error loading suppliers:", error);
    alert("Failed to load supplier list. Please refresh or check Apps Script deployment.");
  }
}

// ===== DISPLAY SUPPLIERS =====
function displaySuppliers(data) {
  const tableBody = document.querySelector("#suppliersTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  data.forEach((row, idx) => {
    const tr = document.createElement("tr");

    // Row: [SupplierID, Name, Phone, Email, Address, ProductCategory, ProductName, Rate, DateAdded]
    row.forEach((cell, colIdx) => {
      const td = document.createElement("td");
      td.textContent = (colIdx === 8) ? formatDateDisplay(cell) : (cell || "");
      tr.appendChild(td);
    });

    const actionTd = document.createElement("td");
    actionTd.innerHTML = `<button class="action-btn edit-btn" onclick="editSupplier(${idx})">Edit</button>`;
    tr.appendChild(actionTd);

    tableBody.appendChild(tr);
  });
}

// ===== EDIT SUPPLIER =====
window.editSupplier = function (idx) {
  const rowData = window._loadedSupplierRows[idx];
  if (!rowData) return;

  editingSupplierId = rowData[0];
  document.getElementById("name").value = rowData[1] || "";
  document.getElementById("phone").value = rowData[2] || "";
  document.getElementById("email").value = rowData[3] || "";
  document.getElementById("address").value = rowData[4] || "";
  document.getElementById("productCategory").value = rowData[5] || "";
  document.getElementById("productName").value = rowData[6] || "";
  document.getElementById("rate").value = rowData[7] || "";
  showEditSupplierForm();
};

// ===== FORMAT DATE =====
function formatDateDisplay(cell) {
  if (!cell) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(cell)) {
    const [year, month, day] = cell.split(/[-T]/);
    return `${day}/${month}/${year}`;
  }
  return cell;
}

// ===== SEARCH FILTER =====
function filterSuppliers() {
  const nameFilter = document.getElementById("searchName").value.trim().toLowerCase();
  const phoneFilter = document.getElementById("searchPhone").value.trim();

  if ((!nameFilter && !phoneFilter) || (nameFilter && phoneFilter)) {
    displaySuppliers(window._loadedSupplierRows);
    return;
  }

  const filtered = window._loadedSupplierRows.filter(row => {
    const name = (row[1] || "").toLowerCase();
    const phone = String(row[2] || "");
    return (nameFilter && name.includes(nameFilter)) || (phoneFilter && phone.includes(phoneFilter));
  });

  displaySuppliers(filtered);
}
