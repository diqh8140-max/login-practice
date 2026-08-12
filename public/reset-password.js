const form =
    document.querySelector(
        "#reset-password-form"
    );

const newPasswordInput =
    document.querySelector(
        "#new-password"
    );

const confirmPasswordInput =
    document.querySelector(
        "#confirm-password"
    );

const message =
    document.querySelector(
        "#reset-message"
    );


const params =
    new URLSearchParams(
        window.location.search
    );

const token =
    params.get("token");


if (!token) {

    showMessage(
        "Invalid password reset link",
        "red"
    );

    form.style.display = "none";
}


form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const newPassword =
            newPasswordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        if (
            newPassword.length < 8 ||
            newPassword.length > 128
        ) {

            showMessage(
                "Password must be between 8 and 128 characters",
                "red"
            );

            return;
        }


        if (
            newPassword !==
            confirmPassword
        ) {

            showMessage(
                "Passwords do not match",
                "red"
            );

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/reset-password",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            token: token,
                            newPassword:
                                newPassword
                        })
                    }
                );


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