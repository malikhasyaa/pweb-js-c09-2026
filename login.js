const loginForm = document.getElementById("loginForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const loginError = document.getElementById("loginError");
const loginLoading = document.getElementById("loginLoading");
const loginButton = document.getElementById("loginButton");

 function showLoading(){
    loginLoading.style.display = "block";
    loginButton.disabled = true;
 }

 function hideLoading(){
    loginLoading.style.display = "none";
    loginButton.disabled = false;
 }

 function showError(message){
    loginError.textContent = message;
    loginError.style.display = "block";
 }

 function hideError(){
    loginError.textContent = "";
    loginError.style.display = "none";
 }

loginForm.addEventListener("submit", async function(e){
    e.preventDefault();

    const usernameValue = username.value;
    const passwordValue = password.value;

        if (usernameValue === "" || passwordValue === ""){
            showError("Username dan Password Wajib diisi");
            return;
        }

        hideError();
        showLoading();

        try {
            const response = await fetch("https://dummyjson.com/users");

            if(!response.ok){
                throw new Error ("Tidak terhubung ke Server");
            }

            const data = await response.json();
            const users = data.users;

            const user = users.find (function(u){
                return u.username === usernameValue && u.password === passwordValue;
            });

            if (user){
                localStorage.setItem("firstName", user.firstName);
                localStorage.setItem("isLoggedIn", "true");

                window.location.href ="index.html";
            } else {
                showError("Username atau password Salah");
            }
        } catch (error){
            showError("Terjadi kesalahan " + error.message);
        } finally {
            hideLoading();
        }
    });