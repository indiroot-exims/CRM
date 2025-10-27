const scriptURL = "https://script.google.com/macros/s/AKfycbwyE_nB_uT1Ow8t96oTRiEGz6UVdMF6JGNzTSepCI6IEiajipMD4vHQx5TnS1QGNY8DpA/exec";

let editingSubInquiryId = null;
let productMap = {}; // {PROD-001: "Natural Moringa Leaf Powder"}
let customerMap = {}; // {CUST-001: "Vaibhav Rai"}

// ===== AUTHENTICATION CHECK =====
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

// ===== PAGE INITIALIZATION =====
document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuth()) return;
  
  document.getElementById("userName").textContent = localStorage.getItem("userName") || '';
  document.getElementById("userRole").textContent = localStorage.getItem("userRole") || '';
  document.getElementById("inquiryFormContainer").style.display = "none";
  
  // Load data
  await loadCustomers();
  await loadProducts();
  await loadInquiries();

  document.getElementById("logoutBtn").addEventListener("click", logout);

  document.getElementById("showAddFormBtn").addEventListener("click", e => {
    e.preventDefault();
    showAddInquiryForm();
  });
  
  document.getElementById("addBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await submitInquiry(false);
  });
  
  document.getElementById("updateBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await submitInquiry(true);
  });
  
  document.getElementById("cancelBtn").addEventListener("click", (e) => {
    e.preventDefault();
    hideForm();
  });

  document.getElementById("searchCustomer").addEventListener("input", filterInquiries);

  // Navigation
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

// ===== LOAD DATA =====
async function loadCustomers() {
  try {
    const response = await fetch(`${scriptURL}?getCustomers`);
    const result = await response.json();
    const customers = Array.isArray(result.data) ? result.data : [];
    
    // Create customer map
    customers.forEach(customer => {
      customerMap[customer[0]] = customer[1]; // {CUST-001: "Vaibhav Rai"}
    });
    
    // Populate customer dropdown
    const customerSelect = document.getElementById("customerId");
    customerSelect.innerHTML = '<option value="">Select Customer</option>';
    customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer[0]; // CustomerID
      option.textContent = customer[1]; // Customer Name
      customerSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading customers:", error);
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${scriptURL}?getProducts`);
    const result = await response.json();
    const products = Array.isArray(result.data) ? result.data : [];
    // Create product map
    products.forEach(product => {
      productMap[product[0]] = product[1]; // {PROD-001: "Natural Moringa..."}
    });
    // Store for dropdown population
    window._allProducts = products;
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

async function loadInquiries() {
  try {
    const response = await fetch(`${scriptURL}?getInquiries`);
    const result = await response.json();
    const data = Array.isArray(result.data) ? result.data : [];
    window._loadedInquiryRows = data;
    displayInquiries(data);
  } catch (error) {
    console.error("Error loading inquiries:", error);
  }
}

// ===== FORM MANAGEMENT =====
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
  
  // In edit mode, disable customer selection and hide add product button
  document.getElementById("customerId").disabled = isEdit;
  document.getElementById("addProductBtn").style.display = isEdit ? "none" : "";
}

// ===== PRODUCT ROWS =====
function addProductRow(productId = "", quantity = "", rate = "", status = "Pending", note = "") {
  const productsArea = document.getElementById("productsArea");
  const div = document.createElement("div");
  div.className = "product-row";
  
  let productOptions = '<option value="">Select Product</option>';
  if (window._allProducts) {
    window._allProducts.forEach(product => {
      const selected = product[0] === productId ? "selected" : "";
      productOptions += `<option value="${product[0]}" ${selected}>${product[1]}</option>`;
    });
  }
  
  div.innerHTML = `
    <select class="product-select" required>
      ${productOptions}
    </select>
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
  productsArea.appendChild(div);
}

function removeProductRow(button) {
  const productRows = document.querySelectorAll(".product-row");
  if (productRows.length > 1) {
    button.parentNode.remove();
  } else {
    alert("At least one product is required.");
  }
}

window.removeProductRow = removeProductRow;

// ===== INQUIRY CRUD OPERATIONS =====
async function submitInquiry(isUpdate) {
  const customerId = document.getElementById("customerId").value.trim();

  if (!customerId) {
    alert("Please select a customer.");
    return;
  }

  const products = [];
  document.querySelectorAll(".product-row").forEach(row => {
    const productId = row.querySelector(".product-select").value.trim();
    const quantity = row.querySelector(".quantity").value.trim();
    const rate = row.querySelector(".rate").value.trim();
    const status = row.querySelector(".status").value.trim();
    const note = row.querySelector(".note").value.trim();
    
    if (productId && quantity && rate) {
      products.push({ productId, quantity, rate, status, note });
    }
  });

  if (products.length === 0) {
    alert("Please add at least one product.");
    return;
  }

  const formData = new FormData();
  
  if (isUpdate) {
    // Update single sub-inquiry
    formData.append("updateSubInquiry", "true");
    formData.append("subInquiryId", editingSubInquiryId);
    formData.append("quantity", products[0].quantity);
    formData.append("rate", products[0].rate);
    formData.append("status", products[0].status);
    formData.append("note", products[0].note);
  } else {
    // Add new inquiry
    formData.append("addInquiry", "true");
    formData.append("customerId", customerId);
    formData.append("products", JSON.stringify(products));
  }

  try {
    const response = await fetch(scriptURL, {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      alert(isUpdate ? "Inquiry updated successfully!" : "Inquiry added successfully!");
      hideForm();
      loadInquiries();
    } else {
      alert("Error: " + result.message);
    }
  } catch (error) {
    console.error(`Error ${isUpdate ? "updating" : "adding"} inquiry:`, error);
    alert(`Failed to ${isUpdate ? "update" : "add"} inquiry.`);
  }
}

// ===== DISPLAY INQUIRIES =====
function displayInquiries(data) {
  const tableBody = document.querySelector("#inquiriesTable tbody");
  tableBody.innerHTML = "";
  
  data.forEach((row, idx) => {
    const tr = document.createElement("tr");
    
    // Row structure: [SubInquiryID, InquiryID, CustomerID, ProductID, Qty, Rate, Status, Note, InquiryDate, LastUpdated]
    row.forEach((cell, colIdx) => {
      const td = document.createElement("td");
      
      // Column 2: CustomerID -> Customer Name
      if (colIdx === 2) {
        td.textContent = customerMap[cell] || cell;
      }
      // Column 3: ProductID -> Product Name
      else if (colIdx === 3) {
        td.textContent = productMap[cell] || cell;
      }
      // Format dates (columns 8 and 9)
      else if (colIdx === 8 || colIdx === 9) {
        td.textContent = formatDateDisplay(cell);
      }
      else {
        td.textContent = cell;
      }
      
      tr.appendChild(td);
    });
    
    // Add action buttons
    const actionTd = document.createElement("td");
    actionTd.innerHTML = `<button class="action-btn edit-btn" onclick="editInquiry(${idx})">Edit</button>`;
    tr.appendChild(actionTd);
    tableBody.appendChild(tr);
  });
}

// Edit inquiry
window.editInquiry = function (idx) {
  const rowData = window._loadedInquiryRows[idx];
  // Row structure: [SubInquiryID, InquiryID, CustomerID, ProductID, Qty, Rate, Status, Note, InquiryDate, LastUpdated]
  
  editingSubInquiryId = rowData[0];
  document.getElementById("customerId").value = rowData[2]; // CustomerID
  
  // Clear and add product row with data
  document.getElementById("productsArea").innerHTML = "";
  addProductRow(rowData[3], rowData[4], rowData[5], rowData[6], rowData[7]);
  
  showEditInquiryForm();
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
function filterInquiries() {
  const customerFilter = document.getElementById("searchCustomer").value.trim();

  if (customerFilter.length < 3) {
    displayInquiries(window._loadedInquiryRows);
    return;
  }
  
  const filtered = window._loadedInquiryRows.filter(row => {
    const customerId = row[2]; // CustomerID column
    const customerName = customerMap[customerId] || "";
    return customerId.toLowerCase().includes(customerFilter.toLowerCase()) ||
           customerName.toLowerCase().includes(customerFilter.toLowerCase());
  });
  
  displayInquiries(filtered);
}
