const welcomeMessage =
    document.querySelector("#welcome-message");

const logoutButton =
    document.querySelector("#logout-button");


async function checkLogin() {

    try {

        const response =
            await fetch("/api/me");

        const result =
            await response.json();


        if (!result.success) {

            window.location.href = "index.html";
            return;
        }


        welcomeMessage.textContent =
            "Welcome, " +
            result.user.username +
            "!";

    } catch (error) {

        console.error(error);

        window.location.href = "index.html";
    }
}
logoutButton.addEventListener(
    "click",
    async function() {

        const response =
            await fetch("/api/logout", {
                method: "POST"
            });

        const result =
            await response.json();

        if (result.success) {
            window.location.href =
                "index.html";
        }
    }
);

checkLogin();