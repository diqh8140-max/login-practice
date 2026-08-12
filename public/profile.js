const profileId =
    document.querySelector("#profile-id");

const profileUsername =
    document.querySelector("#profile-username");

const changePasswordForm =
    document.querySelector("#change-password-form");

const currentPasswordInput =
    document.querySelector("#current-password");

const newPasswordInput =
    document.querySelector("#new-password");

const confirmNewPasswordInput =
    document.querySelector("#confirm-new-password");

const passwordMessage =
    document.querySelector("#password-message");

const deleteAccountForm =
    document.querySelector("#delete-account-form");

const deletePasswordInput =
    document.querySelector("#delete-password");

const deleteMessage =
    document.querySelector("#delete-message");


// ==========================
// Load profile
// ==========================

async function loadProfile() {

    try {

        const response =
            await fetch("/api/profile");

        const result =
            await response.json();


        if (!result.success) {

            window.location.href =
                "index.html";

            return;
        }


        profileId.textContent =
            result.user.id;

        profileUsername.textContent =
            result.user.username;


    } catch (error) {

        console.error(error);

        window.location.href =
            "index.html";
    }
}


// ==========================
// Change password
// ==========================

changePasswordForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const currentPassword =
            currentPasswordInput.value;

        const newPassword =
            newPasswordInput.value;

        const confirmNewPassword =
            confirmNewPasswordInput.value;


        if (currentPassword === "") {

            showPasswordMessage(
                "Please enter your current password",
                "red"
            );

            return;
        }


        if (newPassword === "") {

            showPasswordMessage(
                "Please enter a new password",
                "red"
            );

            return;
        }


        if (newPassword.length < 6) {

            showPasswordMessage(
                "New password must contain at least 6 characters",
                "red"
            );

            return;
        }


        if (
            newPassword !==
            confirmNewPassword
        ) {

            showPasswordMessage(
                "New passwords do not match",
                "red"
            );

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/change-password",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                currentPassword:
                                    currentPassword,

                                newPassword:
                                    newPassword
                            })
                    }
                );


            const result =
                await response.json();


            if (!result.success) {

                showPasswordMessage(
                    result.message,
                    "red"
                );

                return;
            }


            showPasswordMessage(
                result.message,
                "green"
            );


            currentPasswordInput.value = "";
            newPasswordInput.value = "";
            confirmNewPasswordInput.value = "";


        } catch (error) {

            console.error(error);

            showPasswordMessage(
                "Could not connect to server",
                "red"
            );
        }
    }
);

deleteAccountForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const password =
            deletePasswordInput.value;

        if (password === "") {
            showDeleteMessage(
                "Please enter your password",
                "red"
            );

            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to permanently delete your account?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/api/delete-account",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            password: password
                        })
                    }
                );


            const result =
                await response.json();


            if (!result.success) {

                showDeleteMessage(
                    result.message,
                    "red"
                );

                return;
            }


            showDeleteMessage(
                result.message,
                "green"
            );


            setTimeout(function() {

                window.location.href =
                    "index.html";

            }, 1000);


        } catch (error) {

            console.error(error);

            showDeleteMessage(
                "Could not connect to server",
                "red"
            );
        }
    }
);


function showPasswordMessage(
    text,
    color
) {

    passwordMessage.textContent =
        text;

    passwordMessage.style.color =
        color;
}

function showDeleteMessage(text, color) {

    deleteMessage.textContent =
        text;

    deleteMessage.style.color =
        color;
}


loadProfile();