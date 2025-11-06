const scriptURL="https://script.google.com/macros/s/AKfycbybwFLsKI8D65lBb9arh51EOwFsjvThTZbbdF5UE5PR2_DQPgfzSv0m-J7TzFGLBJBW4g/exec"



async function loginUser(event) {
  event.preventDefault();

  const formData = new FormData();
  formData.append("username", document.getElementById("username").value.trim());
  formData.append("password", document.getElementById("password").value.trim());

  const message = document.getElementById("message");
  try {
    const response = await fetch(scriptURL, {
      method: "POST",
      body: formData // Do not include headers or use JSON.stringify()
    });
    const data = await response.json();
    console.log("API response:", data);

    if (data.success) {
      localStorage.setItem("userName", data.user);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("isLoggedIn", "true");
      message.style.color = "green";
      message.textContent = "Login successful! Redirecting...";
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      message.style.color = "red";
      message.textContent = data.message || "Login failed!";
    }
  } catch (err) {
    console.error(err);
    message.style.color = "red";
    message.textContent = "Error connecting to server.";
  }
}



