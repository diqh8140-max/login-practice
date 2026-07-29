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
    message.style.color = "green";
    message.textContent = "Enter button are function normally"
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