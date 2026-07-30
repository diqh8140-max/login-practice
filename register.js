const registerForm = document.querySelector("#register-form");
const usernameInput = document.querySelector("#register-username");
const passwordInput = document.querySelector("register-password");
const confirmPasswordInput = document.querySelector("confirm-password");
const message = document.querySelector("#register-message");

registerForm.addEventListener("submit",function(event){
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (username === ""){
        showMessage("Please enter a username","red");
        return;
    }
    if (username.length<3){
        showMessage("Username must contain at least 3 characters","red");
        return;
    }
    if (password ===""){
        showMessage("Please enter a password","red");
        return;
    }
    if (password.length<6){
        showMessage("Password must contain at least 6 characters","red");
        return;
    }
    if (password !== confirmPassword){
        showMessage("Password do not match","red");
        return;
    }
    const existingUsername = localStorage.getItem("username");
    if (existingUsername === username){
        showMessage("This username already exists","red");
        return;
    }
    localStorage.setItem("username",username);
    localStorage.setItem("password",password);
    showMessage("Account created successfully! Redirecting to login...","green");
    setTimeout(function(){
        window.locatin.href="index.html";
    },1500);
});

function showMessage(text,color){
    message.textContent = text;
    message.style.color= color;
}