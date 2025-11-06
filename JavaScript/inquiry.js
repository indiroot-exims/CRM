const scriptURL = "https://script.google.com/macros/s/AKfycbybwFLsKI8D65lBb9arh51EOwFsjvThTZbbdF5UE5PR2_DQPgfzSv0m-J7TzFGLBJBW4g/exec";

let editingSubInquiryId = null;
let productMap = {};
let customerMap = {};
let _loadedInquiryRows = [];

// ===== AUTHENTICATION =====
function checkAuth() {
  const userName = localStorage.getItem("userName");
  const userRole = localStorage.getItem("userRole");

  if (!userName || !userRole) {
    alert("You must be logged in to access this page.");
    window.location.href = "../Html/index.html";
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  alert("You have been logged out successfully.");
  window.location.href = "../Html/index.html";
}

// ===== PAGE INIT =====
document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuth()) return;

  document.getElementById("userName").textContent = localStorage.getItem("userName") || '';
  document.getElementById("userRole").textContent = localStorage.getItem("userRole") || '';
  document.getElementById("inquiryFormContainer").style.display = "none";

  await loadCustomers();
  await loadProducts();
  await loadInquiries();

  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("showAddFormBtn").addEventListener("click", e => {
    e.preventDefault();
    showAddInquiryForm();
  });

  document.getElementById("addBtn").addEventListener("click", async e => {
    e.preventDefault();
    await submitInquiry(false);
  });

  document.getElementById("updateBtn").addEventListener("click", async e => {
    e.preventDefault();
    await submitInquiry(true);
  });

  document.getElementById("cancelBtn").addEventListener("click", e => {
    e.preventDefault();
    hideForm();
  });

  document.getElementById("searchCustomer").addEventListener("input", filterInquiries);

  // Filter listeners
  document.getElementById("statusFilter")?.addEventListener("change", filterInquiries);
  document.getElementById("startDate")?.addEventListener("change", filterInquiries);
  document.getElementById("endDate")?.addEventListener("change", filterInquiries);

  // Navigation
  document.getElementById("dashboardBtn").addEventListener("click", () => window.location.href = "dashboard.html");
  document.getElementById("customersBtn").addEventListener("click", () => window.location.href = "customers.html");
  document.getElementById("productsBtn").addEventListener("click", () => window.location.href = "products.html");
});

// ===== LOAD DATA =====
async function loadCustomers() {
  try {
    const res = await fetch(`${scriptURL}?getCustomers`);
    const result = await res.json();
    const customers = Array.isArray(result.data) ? result.data : [];

    customers.forEach(c => customerMap[c[0]] = c[1]);

    const select = document.getElementById("customerId");
    select.innerHTML = '<option value="">Select Customer</option>';
    customers.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c[0];
      opt.textContent = c[1];
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Error loading customers:", e);
  }
}

async function loadProducts() {
  try {
    const res = await fetch(`${scriptURL}?getProducts`);
    const result = await res.json();
    const products = Array.isArray(result.data) ? result.data : [];
    products.forEach(p => productMap[p[0]] = p[1]);
    window._allProducts = products;
  } catch (e) {
    console.error("Error loading products:", e);
  }
}

async function loadInquiries() {
  try {
    const res = await fetch(`${scriptURL}?getInquiries`);
    const result = await res.json();
    const data = Array.isArray(result.data) ? result.data : [];
    window._loadedInquiryRows = data;
    displayInquiries(data);
  } catch (e) {
    console.error("Error loading inquiries:", e);
  }
}

// ===== DISPLAY =====
function displayInquiries(data) {
  const tbody = document.querySelector("#inquiriesTable tbody");
  tbody.innerHTML = "";

  const statusPriority = { "In Process": 1, "Pending": 2, "Closed": 3 };
  const sorted = [...data].sort((a, b) => {
    const sA = statusPriority[a[6]] || 4;
    const sB = statusPriority[b[6]] || 4;
    if (sA !== sB) return sA - sB;
    return new Date(b[8]) - new Date(a[8]); // Latest first
  });

  sorted.forEach(row => {
    const tr = document.createElement("tr");

    row.forEach((cell, colIdx) => {
      const td = document.createElement("td");

      if (colIdx === 2) td.textContent = customerMap[cell] || cell;
      else if (colIdx === 3) td.textContent = productMap[cell] || cell;
      else if (colIdx === 8 || colIdx === 9) td.textContent = formatDateDisplay(cell);
      else if (colIdx === 7) {
        td.textContent = cell;
        td.style.whiteSpace = "normal";
        td.style.wordBreak = "break-word";
        td.style.maxWidth = "300px";
      } else td.textContent = cell;

      tr.appendChild(td);
    });

    const action = document.createElement("td");
    // Pass unique ID instead of index
    action.innerHTML = `<button class="action-btn edit-btn" onclick="editInquiryById('${row[0]}')">Edit</button>`;
    tr.appendChild(action);

    tbody.appendChild(tr);
  });
}

// ===== FORM =====
function showAddInquiryForm() {
  document.getElementById("inquiryForm").reset();
  document.getElementById("productsArea").innerHTML = "";
  addProductRow();
  editingSubInquiryId = null;
  toggleFormMode(false);
  document.getElementById("inquiryFormContainer").style.display = "";
}

function showEditInquiryForm() {
  toggleFormMode(true);
  document.getElementById("inquiryFormContainer").style.display = "";
}

function hideForm() {
  document.getElementById("inquiryForm").reset();
  document.getElementById("productsArea").innerHTML = "";
  editingSubInquiryId = null;
  document.getElementById("inquiryFormContainer").style.display = "none";
}

function toggleFormMode(isEdit) {
  document.getElementById("addBtn").style.display = isEdit ? "none" : "";
  document.getElementById("updateBtn").style.display = isEdit ? "" : "none";
  document.getElementById("cancelBtn").style.display = "";
  document.getElementById("customerId").disabled = isEdit;
  document.getElementById("addProductBtn").style.display = isEdit ? "none" : "";
}

// ===== PRODUCTS =====
function addProductRow(productId = "", quantity = "", rate = "", status = "Pending", note = "") {
  const area = document.getElementById("productsArea");
  const div = document.createElement("div");
  div.className = "product-row";

  let options = '<option value="">Select Product</option>';
  if (window._allProducts) {
    window._allProducts.forEach(p => {
      options += `<option value="${p[0]}" ${p[0] === productId ? "selected" : ""}>${p[1]}</option>`;
    });
  }

  div.innerHTML = `
    <select class="product-select" required>${options}</select>
    <input type="number" class="quantity" placeholder="Quantity" min="1" required value="${quantity}">
    <input type="number" class="rate" placeholder="Rate" min="0" step="0.01" required value="${rate}">
    <select class="status" required>
      <option value="Pending" ${status === "Pending" ? "selected" : ""}>Pending</option>
      <option value="In Process" ${status === "In Process" ? "selected" : ""}>In Process</option>
      <option value="Closed" ${status === "Closed" ? "selected" : ""}>Closed</option>
    </select>
    <input type="text" class="note" placeholder="Note (optional)" value="${note}">
    <button type="button" class="remove-btn" onclick="removeProductRow(this)">Remove</button>
  `;
  area.appendChild(div);
}

function removeProductRow(btn) {
  const rows = document.querySelectorAll(".product-row");
  if (rows.length > 1) btn.parentNode.remove();
  else alert("At least one product is required.");
}

// ===== CRUD =====
async function submitInquiry(isUpdate) {
  const customerId = document.getElementById("customerId").value.trim();
  if (!customerId) return alert("Please select a customer.");

  const products = [];
  document.querySelectorAll(".product-row").forEach(r => {
    const productId = r.querySelector(".product-select").value.trim();
    const quantity = r.querySelector(".quantity").value.trim();
    const rate = r.querySelector(".rate").value.trim();
    const status = r.querySelector(".status").value.trim();
    const note = r.querySelector(".note").value.trim();
    if (productId && quantity && rate) products.push({ productId, quantity, rate, status, note });
  });

  if (!products.length) return alert("Please add at least one product.");

  const formData = new FormData();
  if (isUpdate) {
    formData.append("action", "updateSubInquiry");
    formData.append("subInquiryId", editingSubInquiryId);
    formData.append("quantity", products[0].quantity);
    formData.append("rate", products[0].rate);
    formData.append("status", products[0].status);
    formData.append("note", products[0].note);
  } else {
    formData.append("action", "addInquiry");
    formData.append("customerId", customerId);
    formData.append("products", JSON.stringify(products));
  }

  try {
    const res = await fetch(scriptURL, { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
      alert(isUpdate ? "Inquiry updated successfully!" : "Inquiry added successfully!");
      hideForm();
      loadInquiries();
    } else alert("Error: " + result.message);
  } catch (e) {
    console.error("Error submitting inquiry:", e);
  }
}

// ===== EDIT (Updated) =====
window.editInquiryById = id => {
  const r = window._loadedInquiryRows.find(row => row[0] === id);
  if (!r) return alert("Inquiry not found!");

  editingSubInquiryId = r[0];
  document.getElementById("customerId").value = r[2];
  document.getElementById("productsArea").innerHTML = "";
  addProductRow(r[3], r[4], r[5], r[6], r[7]);
  showEditInquiryForm();
};

// ===== HELPERS =====
function formatDateDisplay(d) {
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const p = d.split(/[-T]/);
    return `${p[2]}/${p[1]}/${p[0]}`;
  }
  return d;
}

// ===== FILTER =====
function filterInquiries() {
  const customer = document.getElementById("searchCustomer")?.value.trim().toLowerCase();
  const status = document.getElementById("statusFilter")?.value;
  const start = document.getElementById("startDate")?.value;
  const end = document.getElementById("endDate")?.value;

  let filtered = window._loadedInquiryRows;

  if (customer && customer.length >= 3) {
    filtered = filtered.filter(r => {
      const cName = (customerMap[r[2]] || "").toLowerCase();
      return cName.includes(customer) || r[2].toLowerCase().includes(customer);
    });
  }

  if (status && status !== "All") {
    filtered = filtered.filter(r => r[6] === status);
  }

  if (start || end) {
    const sDate = start ? new Date(start) : null;
    const eDate = end ? new Date(end) : null;
    filtered = filtered.filter(r => {
      const d = new Date(r[8]);
      if (sDate && d < sDate) return false;
      if (eDate && d > eDate) return false;
      return true;
    });
  }

  displayInquiries(filtered);
}

