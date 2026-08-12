const welcomeMessage =
    document.querySelector("#welcome-message");

const logoutButton =
    document.querySelector("#logout-button");

let csrfToken = null;
    
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
                method: "POST",

                headers: {
                    "X-CSRF-Token":
                        csrfToken
                }
            });

        const result =
            await response.json();

        if (result.success) {
            window.location.href =
                "index.html";
        }
    }
);

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first"
        });
    }

    next();
}

async function loadCsrfToken() {

    const response =
        await fetch("/api/csrf-token");

    const result =
        await response.json();

    csrfToken =
        result.csrfToken;
}

checkLogin();
loadCsrfToken();