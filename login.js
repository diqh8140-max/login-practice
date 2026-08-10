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
        showMessage("Please enter a username", "red");
        return;
    }
    if (password === ""){
        showMessage("Please enter password", "red");
        return;
    } 
    if (password.length<6){
        showMessage("password need at least six characters", "red");
        return;
    }
    //const savedUsername = localStorage.getItem("username");
    //const savedPassword = localStorage.getItem("password");
    //if (savedUsername === null || savedPassword === null){
    //    showMessage("No account found, please register first.","red");
    //   return;
    //}
    //if (username === savedUsername && password === savedPassword){
    //    showMessage("Login successful!","green");
    //    setTimeout(function(){
    //        window.location.href = "welcome.html";
    //    },1000);
    //    return;
    //}
    //showMessage("Incorrect username or password","red");
    const users = JSON.parse(localStorage.getItem("users"))||[];
    const matchedUser = users.find(function(user){
        return user.username === username &&
               user.password === password;
    });
    if (matchedUser){
        showMessage("Login successful","green");
        setTimeout(function(){
            window.location.href ="welcome.html";
        },1000);
        return;
    }
    showMessage("Incorrect username or password","red")
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
    message.style.color = color;
}