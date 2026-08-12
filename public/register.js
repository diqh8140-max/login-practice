const registerForm =
    document.querySelector("#register-form");

const usernameInput =
    document.querySelector("#register-username");

const passwordInput =
    document.querySelector("#register-password");

const confirmPasswordInput =
    document.querySelector("#confirm-password");

const message =
    document.querySelector("#register-message");

const emailInput =
    document.querySelector("#register-email");

registerForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;

        const email =
            emailInput.value.trim().toLowerCase();
        // ========================
        // 前端输入检查
        // ========================

        if (username === "") {
        showMessage(
            "Please enter a username",
            "red"
        );
        return;
        }

        if (
            username.length < 3 ||
            username.length > 30
        ) {
            showMessage(
                "Username must be between 3 and 30 characters",
                "red"
            );
            return;
        }

        if (
            !/^[A-Za-z0-9_-]+$/.test(username)
        ) {
            showMessage(
                "Username may only contain letters, numbers, _ and -",
                "red"
            );
            return;
        }

        if (password === "") {
            showMessage(
                "Please enter a password",
                "red"
            );
            return;
        }

        if (
            password.length < 8 ||
            password.length > 128
        ) {
            showMessage(
                "Password must be between 8 and 128 characters",
                "red"
            );
            return;
        }

        if (password !== confirmPassword) {
            showMessage(
                "Passwords do not match",
                "red"
            );
            return;
        }
        
        if (email === "") {
            showMessage(
                "Please enter an email",
                "red"
            );
            return;
        }

        if (!emailInput.validity.valid) {
            showMessage(
                "Please enter a valid email",
                "red"
            );
            return;
        }

        // ========================
        // 发送给后端
        // ========================

        try {

            const response =
                await fetch("/api/register", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        email: email,
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
                    "index.html";

            }, 1500);


        } catch (error) {

            console.error(error);

            showMessage(
                "Could not connect to server",
                "red"
            );
        }
    }
);


function showMessage(text, color) {

    message.textContent = text;
    message.style.color = color;
}