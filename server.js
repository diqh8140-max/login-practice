const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("node:crypto");
const session = require("express-session");

const app = express();


// ==========================
// Middleware
// ==========================
app.set("trust proxy", 1);

app.use(express.json());
app.use(
    //session({
    //    secret: "change-this-to-a-long-random-secret",
    //    resave: false,
    //    saveUninitialized: false,

    //    cookie: {
    //        httpOnly: true,
    //        sameSite: "lax",
    //        secure: false,
    //        maxAge: 1000 * 60 * 60
    //   }
    //})
    session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60
    }
})
);
app.use(express.static("public"));


// ==========================
// Database
// ==========================

const db = new sqlite3.Database("users.db");

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
`);


// ==========================
// Password hashing
// ==========================

function hashPassword(password) {
    return new Promise(function(resolve, reject) {

        const salt = crypto.randomBytes(16).toString("hex");

        crypto.scrypt(
            password,
            salt,
            64,
            function(error, derivedKey) {

                if (error) {
                    reject(error);
                    return;
                }

                const hash = derivedKey.toString("hex");

                resolve(salt + ":" + hash);
            }
        );
    });
}


// ==========================
// Password verification
// ==========================

function verifyPassword(password, storedPassword) {
    return new Promise(function(resolve, reject) {

        const parts = storedPassword.split(":");

        const salt = parts[0];
        const storedHash = parts[1];

        crypto.scrypt(
            password,
            salt,
            64,
            function(error, derivedKey) {

                if (error) {
                    reject(error);
                    return;
                }

                const storedHashBuffer =
                    Buffer.from(storedHash, "hex");

                if (
                    storedHashBuffer.length !==
                    derivedKey.length
                ) {
                    resolve(false);
                    return;
                }

                const correct =
                    crypto.timingSafeEqual(
                        storedHashBuffer,
                        derivedKey
                    );

                resolve(correct);
            }
        );
    });
}


// ==========================
// REGISTER
// ==========================

app.post("/api/register", async function(req, res) {

    const username = req.body.username?.trim();
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }

    if (username.length < 3) {
        return res.status(400).json({
            success: false,
            message: "Username must contain at least 3 characters"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least 6 characters"
        });
    }

    // 检查用户名是否存在
    db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async function(error, user) {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (user) {
                return res.status(409).json({
                    success: false,
                    message: "This username already exists"
                });
            }

            try {

                const passwordHash =
                    await hashPassword(password);

                db.run(
                    `
                    INSERT INTO users
                    (username, password_hash)
                    VALUES (?, ?)
                    `,
                    [username, passwordHash],
                    function(error) {

                        if (error) {
                            console.error(error);

                            return res.status(500).json({
                                success: false,
                                message: "Could not create account"
                            });
                        }

                        res.json({
                            success: true,
                            message: "Account created successfully"
                        });
                    }
                );

            } catch (error) {

                console.error(error);

                res.status(500).json({
                    success: false,
                    message: "Server error"
                });
            }
        }
    );
});


// ==========================
// LOGIN
// ==========================

app.post("/api/login", function(req, res) {

    const username = req.body.username?.trim();
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }

    db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async function(error, user) {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Incorrect username or password"
                });
            }

            try {

                const correct =
                    await verifyPassword(
                        password,
                        user.password_hash
                    );

                if (!correct) {
                    return res.status(401).json({
                        success: false,
                        message: "Incorrect username or password"
                    });
                }

                req.session.userId = user.id;
                req.session.username = user.username;

                res.json({
                    success: true,
                    message: "Login successful"
                });

            } catch (error) {

                console.error(error);

                res.status(500).json({
                    success: false,
                    message: "Server error"
                });
            }
        }
    );
});

app.get("/api/me", function(req, res) {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Not logged in"
        });
    }

    res.json({
        success: true,
        user: {
            id: req.session.userId,
            username: req.session.username
        }
    });
});

app.post("/api/logout", function(req, res) {

    req.session.destroy(function(error) {

        if (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Could not logout"
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Logged out"
        });
    });
});

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first"
        });
    }

    next();
}

app.get(
    "/api/profile",
    requireLogin,
    function(req, res) {

        db.get(
            `
            SELECT id, username
            FROM users
            WHERE id = ?
            `,
            [req.session.userId],
            function(error, user) {

                if (error) {
                    console.error(error);

                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }

                res.json({
                    success: true,
                    user: user
                });
            }
        );
    }
);

app.post(
    "/api/change-password",
    requireLogin,
    function(req, res) {

        const currentPassword =
            req.body.currentPassword;

        const newPassword =
            req.body.newPassword;


        if (!currentPassword || !newPassword) {

            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required"
            });
        }


        if (newPassword.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "New password must contain at least 6 characters"
            });
        }


        db.get(
            `
            SELECT *
            FROM users
            WHERE id = ?
            `,
            [req.session.userId],
            async function(error, user) {

                if (error) {

                    console.error(error);

                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }


                if (!user) {

                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }


                try {

                    const correct =
                        await verifyPassword(
                            currentPassword,
                            user.password_hash
                        );


                    if (!correct) {

                        return res.status(401).json({
                            success: false,
                            message:
                                "Current password is incorrect"
                        });
                    }


                    const newPasswordHash =
                        await hashPassword(
                            newPassword
                        );


                    db.run(
                        `
                        UPDATE users
                        SET password_hash = ?
                        WHERE id = ?
                        `,
                        [
                            newPasswordHash,
                            req.session.userId
                        ],
                        function(error) {

                            if (error) {

                                console.error(error);

                                return res
                                    .status(500)
                                    .json({
                                        success: false,
                                        message:
                                            "Could not update password"
                                    });
                            }


                            res.json({
                                success: true,
                                message:
                                    "Password changed successfully"
                            });
                        }
                    );


                } catch (error) {

                    console.error(error);

                    res.status(500).json({
                        success: false,
                        message: "Server error"
                    });
                }
            }
        );
    }
);
// ==========================
// Start server
// ==========================

//app.listen(3000, function() {

//   console.log(
//        "Server running at http://localhost:3000"
//    );
//});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function() {
    console.log(`Server running on port ${PORT}`);
});