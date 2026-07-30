const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const message = document.querySelector("#message");
const showPasswordButton = document.querySelector("#show-password-button")
const loginForm = document.querySelector("#login-form");

loginForm.addEventListener("submit",function(event){
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (username === ""){
        message.style.color = "red";
        message.textContent = "please enter username";
        return;
    }
    if (password === ""){
        message.style.color = "red";
        message.textContent = "please enter password";
        return;
    } 
    if (password.length<6){
        message.style.color = "red";
        message.textContent = "password needs at least six characters";
        return;
    }
    const savedUsername = localStorage.getItem("username");
    const savedPassword = localStorage.getItem("password");
    if (savedUsername === null || savePassword === null){
        showMessage("No account found, please register first.","red");
        return;
    }
    if (username === savedUsername && password === savedPassword){
        showMessage("Login successful!","green");
        setTimeout(function(){
            windoe.location.href = "welcome.html";
        },1000);
        return;
    }
    showMessage("Incorrect username or password","red");
});
showPasswordButton.addEventListener("click",function(){
    if (passwordInput.type === "password"){
        passwordInput.type = "text";
        showPasswordButton.textContent = "hide password";
    } else {
        passwordInput.type = "password";
        showPasswordButton.textContent = "show password";
    }
});

function showMessage(text,color){
    message.textContent = text;
    message.sytle.color = color;
}