let users = [];
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

// SESSION setup (server-side storage)
app.use(session({
    secret: "sessionTrackingApp",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 } // 10 minutes
}));

// ================= HOME PAGE =================
app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    res.sendFile(require("path").join(__dirname, "views/register.html"));
});

app.post("/register", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.send("All fields required");
    }

    const exists = users.find(u => u.username === username);

    if (exists) {
        return res.send(`
        <html>
        <head>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container">
                <div class="card">
                    <h3>User already exists</h3>
                    <a href="/register">Try Again</a>
                </div>
            </div>
        </body>
        </html>
        `);
    }

    // Save user
    users.push({ username, password });

    // CREATE SESSION immediately
    // create session
req.session.user = username;
req.session.loginTime = new Date().toLocaleString();
req.session.activities = [];
req.session.activities.push("Registered at " + new Date().toLocaleTimeString());
// redirect with success flag
res.redirect("/dashboard?registered=1");
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views/login.html"));
});

app.post("/login", (req, res) => {

    const { username, password } = req.body;

    const user = users.find(u =>
        u.username === username && u.password === password
    );

    if (!user) {
    return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Login Failed</title>
    <link rel="stylesheet" href="/style.css">
</head>

<body>

<nav>
    <h2>Session Tracking System</h2>
    <p>Harika P | 24WH1A05C8</p>
</nav>

<div class="center-container">

    <div class="card">

        <h3 style="color:red;">Invalid Credentials</h3>

        <p>If you don't have an account, please register.</p>

        <a href="/login">Try Again</a><br><br>
        <a href="/register">Register</a>

    </div>

</div>

</body>
</html>
`);
}

    req.session.user = username;
    req.session.activities = [];
    req.session.loginTime = new Date().toLocaleString();
    req.session.activities.push("Logged in at " + new Date().toLocaleTimeString());

    res.redirect("/dashboard?login=1");
});

app.get("/dashboard", (req, res) => {

    if (!req.session.user) return res.redirect("/login");

    req.session.activities.push("Visited Dashboard at " + new Date().toLocaleTimeString());

    const fs = require("fs");
    const path = require("path");

    let html = fs.readFileSync(
        path.join(__dirname, "views/dashboard.html"),
        "utf-8"
    );

    html = html.replace("{{username}}", req.session.user);
    html = html.replace("{{activityCount}}", req.session.activities.length);
    html = html.replace("{{loginTime}}", req.session.loginTime);
    res.send(html);
});

app.get("/activity", (req, res) => {

    if (!req.session.user) return res.redirect("/login");

    let list = req.session.activities
        .map(a => `<li>${a}</li>`)
        .join("");

    let html = require("fs").readFileSync(
        path.join(__dirname, "views/activity.html"),
        "utf-8"
    );
    if (!req.session.activities) {
    req.session.activities = [];
}
    html = html.replace("{{activities}}", list);
    req.session.activities.push("Viewed Activity Page at " + new Date().toLocaleTimeString());
    res.send(html);
});

// show confirmation page
app.get("/logout", (req, res) => {
    res.sendFile(require("path").join(__dirname, "views/logout.html"));
});

// actual logout
app.get("/logout-final", (req, res) => {

    req.session.destroy(() => {

        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Logged Out</title>
            <link rel="stylesheet" href="/style.css">
        </head>

        <body>

        <div class="center-container">

            <div class="auth-card">

                <h3 style="color: green;">Logged out successfully</h3>
                <p>Redirecting to login...</p>

            </div>

        </div>

        <script>
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
        </script>

        </body>
        </html>
        `);

    });
});

// ================= COOKIE TEST =================
app.get("/cookie-test", (req, res) => {

    const fs = require("fs");
    const path = require("path");

    const lastVisit = req.cookies.lastVisit;
    const currentTime = new Date().toLocaleString();

    // update cookie
    res.cookie("lastVisit", currentTime);

    let html = fs.readFileSync(
        path.join(__dirname, "views/cookie.html"),
        "utf-8"
    );

    html = html.replace("{{lastVisit}}", lastVisit || "First Visit");
    html = html.replace("{{currentTime}}", currentTime);
    req.session.activities.push("Visited Cookie Page at " + new Date().toLocaleTimeString());
    res.send(html);
});

// ================= SERVER START =================
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
