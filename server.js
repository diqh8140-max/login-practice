const express = require("express");
const crypto = require("node:crypto");
const session = require("express-session");
const { Pool } = require("pg");
const { rateLimit } = require("express-rate-limit");
const pgSession = require("connect-pg-simple")(session);
const nodemailer = require("nodemailer");

const app = express();


// ========================================
// PostgreSQL
// ========================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});


// ========================================
// Middleware
// ========================================

app.set("trust proxy", 1);

app.use(express.json());

app.use(
    session({

        store: new pgSession({
            pool: pool,
            createTableIfMissing: true
        }),

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


// ========================================
// Initialize database
// ========================================

async function initializeDatabase() {

    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS email TEXT UNIQUE
        `);

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN
            DEFAULT FALSE
        `);

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS verification_token_hash TEXT
        `);

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP
        `);

        console.log("Database initialized");

    } catch (error) {

        console.error(
            "Database initialization failed:",
            error
        );
    }
}


// ========================================
// Hash password
// ========================================

function hashPassword(password) {

    return new Promise(function(resolve, reject) {

        const salt =
            crypto.randomBytes(16).toString("hex");

        crypto.scrypt(
            password,
            salt,
            64,

            function(error, derivedKey) {

                if (error) {
                    reject(error);
                    return;
                }

                const hash =
                    derivedKey.toString("hex");

                resolve(
                    salt + ":" + hash
                );
            }
        );
    });
}


// ========================================
// Verify password
// ========================================

function verifyPassword(
    password,
    storedPassword
) {

    return new Promise(function(resolve, reject) {

        const parts =
            storedPassword.split(":");

        if (parts.length !== 2) {
            resolve(false);
            return;
        }

        const salt = parts[0];

        const storedHash =
            parts[1];


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
                    Buffer.from(
                        storedHash,
                        "hex"
                    );


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


// ========================================
// Login middleware
// ========================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 10,

    skipSuccessfulRequests: true,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many login attempts. Please try again later."
    }
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

function generateVerificationToken() {
    return crypto
        .randomBytes(32)
        .toString("hex");
}


function hashToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}


// ========================================
// REGISTER
// ========================================

app.post(
    "/api/register",
    async function(req, res) {

        const username =
            typeof req.body.username === "string"
                ? req.body.username.trim()
                : "";
        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password =
            req.body.password;

        if (username.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        if (
            username.length < 3 ||
            username.length > 30
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Username must be between 3 and 30 characters"
            });
        }

        if (
            !/^[A-Za-z0-9_-]+$/.test(username)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Username may only contain letters, numbers, _ and -"
            });
        }

        if (
            typeof password !== "string" ||
            password.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        if (
            password.length < 8 ||
            password.length > 128
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be between 8 and 128 characters"
            });
        }
        
        if (email.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        if (email.length > 254) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }


        try {

            // ------------------------------
            // Check existing username
            // ------------------------------

            const existingResult =
                await pool.query(
                    `
                    SELECT id
                    FROM users
                    WHERE username = $1
                    `,
                    [username]
                );


            if (existingResult.rows.length > 0) {

                return res.status(409).json({
                    success: false,
                    message:
                        "This username already exists"
                });
            }


            // ------------------------------
            // Hash password
            // ------------------------------

            const passwordHash =
                await hashPassword(password);
            
            const verificationToken =
                generateVerificationToken();

            const verificationTokenHash =
                hashToken(verificationToken);

            const verificationExpires =
                new Date(
                    Date.now() +
                    1000 * 60 * 60
                );

            // ------------------------------
            // Save user
            // ------------------------------

            await pool.query(
                `
                INSERT INTO users (
                    username,
                    email,
                    password_hash,
                    email_verified,
                    verification_token_hash,
                    verification_expires
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    FALSE,
                    $4,
                    $5
                )
                `,
                [
                    username,
                    email,
                    passwordHash,
                    verificationTokenHash,
                    verificationExpires
                ]
            );


            await sendVerificationEmail(
                email,
                verificationToken
            );

            res.json({
                success: true,
                message:
                    "Account created. Please check your email to verify your account."
            });


        } catch (error) {

            console.error(
                "Register error:",
                error
            );


            // PostgreSQL unique violation
            if (error.code === "23505") {

                return res.status(409).json({
                    success: false,
                    message:
                        "This username already exists"
                });
            }


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ========================================
// LOGIN
// ========================================

app.post(
    "/api/login",
    loginLimiter,
    async function(req, res) {

        const username =
        typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

        const password =
            req.body.password;

        if (
            username.length === 0 ||
            typeof password !== "string" ||
            password.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Username and password are required"
            });
        }

        if (
            username.length > 30 ||
            password.length > 128
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid login input"
            });
        }


        try {

            // ------------------------------
            // Find user
            // ------------------------------

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM users
                    WHERE username = $1
                    `,
                    [username]
                );


            const user =
                result.rows[0];


            if (!user) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Incorrect username or password"
                });
            }


            // ------------------------------
            // Verify password
            // ------------------------------

            const correct =
                await verifyPassword(
                    password,
                    user.password_hash
                );


            if (!correct) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Incorrect username or password"
                });
            }

            if (!user.email_verified) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Please verify your email before logging in"
                });
            }

            // ------------------------------
            // Create session
            // ------------------------------

            req.session.userId =
                user.id;

            req.session.username =
                user.username;


            res.json({
                success: true,
                message: "Login successful"
            });


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ========================================
// CURRENT USER
// ========================================

app.get(
    "/api/me",
    requireLogin,

    function(req, res) {

        res.json({
            success: true,

            user: {
                id:
                    req.session.userId,

                username:
                    req.session.username
            }
        });
    }
);


// ========================================
// PROFILE
// ========================================

app.get(
    "/api/profile",
    requireLogin,

    async function(req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        username,
                        created_at
                    FROM users
                    WHERE id = $1
                    `,
                    [
                        req.session.userId
                    ]
                );


            const user =
                result.rows[0];


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


        } catch (error) {

            console.error(
                "Profile error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Database error"
            });
        }
    }
);


// ========================================
// CHANGE PASSWORD
// ========================================

app.post(
    "/api/change-password",
    requireLogin,

    async function(req, res) {

        const currentPassword =
            req.body.currentPassword;

        const newPassword =
            req.body.newPassword;


        if (
            typeof currentPassword !== "string" ||
            currentPassword.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password is required"
            });
        }

        if (
            typeof newPassword !== "string" ||
            newPassword.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "New password is required"
            });
        }

        if (
            newPassword.length < 8 ||
            newPassword.length > 128
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be between 8 and 128 characters"
            });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different from current password"
        });
}


        try {

            // ------------------------------
            // Find current user
            // ------------------------------

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM users
                    WHERE id = $1
                    `,
                    [
                        req.session.userId
                    ]
                );


            const user =
                result.rows[0];


            if (!user) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }


            // ------------------------------
            // Check current password
            // ------------------------------

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


            // ------------------------------
            // Hash new password
            // ------------------------------

            const newPasswordHash =
                await hashPassword(
                    newPassword
                );


            // ------------------------------
            // Update PostgreSQL
            // ------------------------------

            await pool.query(
                `
                UPDATE users
                SET password_hash = $1
                WHERE id = $2
                `,
                [
                    newPasswordHash,
                    req.session.userId
                ]
            );


            res.json({
                success: true,
                message:
                    "Password changed successfully"
            });


        } catch (error) {

            console.error(
                "Change password error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ========================================
// LOGOUT
// ========================================

app.post(
    "/api/logout",
    function(req, res) {

        req.session.destroy(
            function(error) {

                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    return res
                        .status(500)
                        .json({
                            success: false,
                            message:
                                "Could not logout"
                        });
                }


                res.clearCookie(
                    "connect.sid"
                );


                res.json({
                    success: true,
                    message: "Logged out"
                });
            }
        );
    }
);

app.post(
    "/api/delete-account",
    requireLogin,
    async function(req, res) {

        const password = req.body.password;

        if (
            typeof password !== "string" ||
            password.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        if (password.length > 128) {
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            });
        }

        try {

            // 1. 找当前登录用户
            const result = await pool.query(
                `
                SELECT *
                FROM users
                WHERE id = $1
                `,
                [req.session.userId]
            );

            const user = result.rows[0];

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }


            // 2. 验证当前密码
            const correct =
                await verifyPassword(
                    password,
                    user.password_hash
                );

            if (!correct) {
                return res.status(401).json({
                    success: false,
                    message: "Incorrect password"
                });
            }


            // 3. 删除用户
            await pool.query(
                `
                DELETE FROM users
                WHERE id = $1
                `,
                [req.session.userId]
            );


            // 4. 删除 session
            req.session.destroy(function(error) {

                if (error) {
                    console.error(
                        "Session destroy error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Account deleted, but logout failed"
                    });
                }

                res.clearCookie("connect.sid");

                res.json({
                    success: true,
                    message:
                        "Account deleted successfully"
                });
            });

        } catch (error) {

            console.error(
                "Delete account error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

const transporter =
    nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),

        secure:
            process.env.SMTP_SECURE === "true",

        auth: {
            user:
                process.env.SMTP_USER,

            pass:
                process.env.SMTP_PASS
        }
    });

async function sendVerificationEmail(
    email,
    token
) {

    const verificationUrl =
        `${process.env.APP_URL}` +
        `/verify-email?token=${encodeURIComponent(token)}`;


    await transporter.sendMail({
        from: process.env.EMAIL_FROM,

        to: email,

        subject:
            "Verify your email address",

        text:
            `Verify your email by opening this link:\n\n` +
            verificationUrl
    });
}

app.get(
    "/verify-email",
    async function(req, res) {

        const token =
            req.query.token;

        if (
            typeof token !== "string" ||
            token.length === 0
        ) {
            return res.status(400).send(
                "Invalid verification link"
            );
        }


        const tokenHash =
            hashToken(token);


        try {

            const result =
                await pool.query(
                    `
                    SELECT id
                    FROM users

                    WHERE
                        verification_token_hash = $1

                    AND
                        verification_expires > NOW()

                    AND
                        email_verified = FALSE
                    `,
                    [tokenHash]
                );


            const user =
                result.rows[0];


            if (!user) {

                return res.status(400).send(
                    "Verification link is invalid or expired."
                );
            }


            await pool.query(
                `
                UPDATE users

                SET
                    email_verified = TRUE,
                    verification_token_hash = NULL,
                    verification_expires = NULL

                WHERE id = $1
                `,
                [user.id]
            );


            res.send(`
                <h1>Email verified!</h1>

                <p>
                    Your account has been verified.
                </p>

                <a href="/">
                    Go to login
                </a>
            `);


        } catch (error) {

            console.error(
                "Email verification error:",
                error
            );

            res.status(500).send(
                "Server error"
            );
        }
    }
);

// ========================================
// Start server
// ========================================

const PORT =
    process.env.PORT || 3000;


initializeDatabase()
    .then(function() {

        app.listen(
            PORT,
            function() {

                console.log(
                    `Server running on port ${PORT}`
                );
            }
        );

    })
    .catch(function(error) {

        console.error(
            "Failed to start application:",
            error
        );

        process.exit(1);
    });