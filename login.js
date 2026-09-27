const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const loginLoading = document.getElementById("loginLoading");
const loginButton = document.getElementById("loginButton");

function showLoading() {
    if (loginLoading) loginLoading.style.display = "block";
    if (loginButton) loginButton.disabled = true;
}

function hideLoading() {
    if (loginLoading) loginLoading.style.display = "none";
    if (loginButton) loginButton.disabled = false;
}

function showError(message) {
    if (loginError) {
        loginError.textContent = message;
        loginError.style.display = "block";
    }
}

function hideError() {
    if (loginError) {
        loginError.textContent = "";
        loginError.style.display = "none";
    }
}

loginForm.addEventListener("submit", async function (e) {
    // 1. CEGAH REFRESH AGAR TOMBOL MATA TIDAK HILANG / RESET
    e.preventDefault(); 

    const usernameValue = usernameInput.value.trim();
    const passwordValue = passwordInput.value.trim();

    if (usernameValue === "" || passwordValue === "") {
        showError("Username dan Password Wajib diisi");
        return;
    }

    hideError();
    showLoading();

    try {
        const response = await fetch("https://dummyjson.com/users");

        if (!response.ok) {
            throw new Error("Gagal terhubung ke server API.");
        }

        const data = await response.json();
        const users = data.users;

        const user = users.find(u => u.username === usernameValue && u.password === passwordValue);

        if (user) {
            localStorage.setItem("firstName", user.firstName);
            localStorage.setItem("isLoggedIn", "true");

            // Redirect ke halaman utama
            window.location.href = "index.html";
        } else {
            showError("Username atau password salah!");
        }
    } catch (error) {
        showError("Terjadi kesalahan: " + error.message);
    } finally {
        hideLoading();
    }
});