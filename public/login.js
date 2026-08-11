const usernameInput =
    document.querySelector("#username");

const passwordInput =
    document.querySelector("#password");

const message =
    document.querySelector("#message");

const showPasswordButton =
    document.querySelector("#show-password-button");

const loginForm =
    document.querySelector("#login-form");


// ==========================
// LOGIN
// ==========================

loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;


        if (username === "") {

            showMessage(
                "Please enter a username",
                "red"
            );

            return;
        }


        if (password === "") {

            showMessage(
                "Please enter password",
                "red"
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                "Password needs at least six characters",
                "red"
            );

            return;
        }


        // ========================
        // Ask server to login
        // ========================

        try {

            const response =
                await fetch("/api/login", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });


            const result =
                await response.json();


            if (!result.success) {

                showMessage(
                    result.message,
                    "red"
                );

                return;
            }


            showMessage(
                result.message,
                "green"
            );


            setTimeout(function() {

                window.location.href =
                    "welcome.html";

            }, 1000);


        } catch (error) {

            console.error(error);

            showMessage(
                "Could not connect to server",
                "red"
            );
        }
    }
);


// ==========================
// Show password
// ==========================

showPasswordButton.addEventListener(
    "click",
    function() {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            showPasswordButton.textContent =
                "hide password";

        } else {

            passwordInput.type = "password";

            showPasswordButton.textContent =
                "show password";
        }
    }
);


function showMessage(text, color) {

    message.textContent = text;
    message.style.color = color;
}