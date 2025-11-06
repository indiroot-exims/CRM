const scriptURL = "https://script.google.com/macros/s/AKfycbybwFLsKI8D65lBb9arh51EOwFsjvThTZbbdF5UE5PR2_DQPgfzSv0m-J7TzFGLBJBW4g/exec";

let editingProductId = null;

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
document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;
  
  document.getElementById("userName").textContent = localStorage.getItem("userName") || '';
  document.getElementById("userRole").textContent = localStorage.getItem("userRole") || '';
  document.getElementById("productFormContainer").style.display = "none";
  loadProducts();

  document.getElementById("logoutBtn").addEventListener("click", logout);

  document.getElementById("showAddFormBtn").addEventListener("click", e => {
    e.preventDefault();
    showAddProductForm();
  });
  
  document.getElementById("addBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await submitProduct(false);
  });
  
  document.getElementById("updateBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await submitProduct(true);
  });
  
  document.getElementById("cancelBtn").addEventListener("click", (e) => {
    e.preventDefault();
    hideForm();
  });

  // Navigation
  document.getElementById("dashboardBtn").addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
  document.getElementById("customersBtn").addEventListener("click", () => {
    window.location.href = "customers.html";
  });
  document.getElementById("suppliersBtn").addEventListener("click", () => {
    window.location.href = "suppliers.html";
  });
});

// ===== FORM MANAGEMENT =====
function showAddProductForm() {
  document.getElementById("productForm").reset();
  editingProductId = null;
  toggleFormMode(false);
  document.getElementById("productFormContainer").style.display = "";
}

function showEditProductForm() {
  toggleFormMode(true);
  document.getElementById("productFormContainer").style.display = "";
}

function hideForm() {
  document.getElementById("productForm").reset();
  editingProductId = null;
  document.getElementById("productFormContainer").style.display = "none";
}

function toggleFormMode(isEdit) {
  document.getElementById("addBtn").style.display = isEdit ? "none" : "";
  document.getElementById("updateBtn").style.display = isEdit ? "" : "none";
  document.getElementById("cancelBtn").style.display = "";
}

// ===== PRODUCT CRUD OPERATIONS =====
async function submitProduct(isUpdate) {
  const productName = document.getElementById("productName").value.trim();
  const category = document.getElementById("category").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!productName) {
    alert("Product Name is required.");
    return;
  }

  const formData = new FormData();
  formData.append(isUpdate ? "updateProduct" : "addProduct", "true");
  formData.append("productName", productName);
  formData.append("category", category);
  formData.append("description", description);
  if (isUpdate && editingProductId) formData.append("productId", editingProductId);

  try {
    const response = await fetch(scriptURL, {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      alert(isUpdate ? "Product updated successfully!" : "Product added successfully!");
      hideForm();
      loadProducts();
    } else {
      alert("Error: " + result.message);
    }
  } catch (error) {
    console.error(`Error ${isUpdate ? "updating" : "adding"} product:`, error);
    alert(`Failed to ${isUpdate ? "update" : "add"} product.`);
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${scriptURL}?getProducts`);
    const data = await response.json();
    window._loadedProductRows = data;
    displayProducts(data);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function displayProducts(data) {
  const tableBody = document.querySelector("#productsTable tbody");
  tableBody.innerHTML = "";
  
  data.forEach((row, idx) => {
    const tr = document.createElement("tr");
    
    row.forEach((cell, colIdx) => {
      const td = document.createElement("td");
      if (colIdx === 4) {
        td.textContent = formatDateDisplay(cell);
      } else {
        td.textContent = cell;
      }
      tr.appendChild(td);
    });
    
    const actionTd = document.createElement("td");
    actionTd.innerHTML = `<button class="action-btn edit-btn" onclick="editProduct(${idx})">Edit</button>`;
    tr.appendChild(actionTd);
    tableBody.appendChild(tr);
  });
}

window.editProduct = function (idx) {
  const rowData = window._loadedProductRows[idx];
  editingProductId = rowData[0];
  document.getElementById("productName").value = rowData[1];
  document.getElementById("category").value = rowData[2] || "";
  document.getElementById("description").value = rowData[3] || "";
  showEditProductForm();
};

function formatDateDisplay(cell) {
  if (/^\d{4}-\d{2}-\d{2}/.test(cell)) {
    const parts = cell.split(/[-T]/);
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cell)) return cell;
  return cell;
}

