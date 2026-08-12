const form =
    document.querySelector(
        "#forgot-password-form"
    );

const emailInput =
    document.querySelector(
        "#forgot-email"
    );

const message =
    document.querySelector(
        "#forgot-message"
    );


form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        if (email === "") {

            showMessage(
                "Please enter your email",
                "red"
            );

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/forgot-password",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email: email
                        })
                    }
                );


            const result =
                await response.json();


            showMessage(
                result.message,
                "green"
            );


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