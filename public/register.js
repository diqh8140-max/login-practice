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

        if (username.length < 3) {
            showMessage(
                "Username must contain at least 3 characters",
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

        if (password.length < 6) {
            showMessage(
                "Password must contain at least 6 characters",
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