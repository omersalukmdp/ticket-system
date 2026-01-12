const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

function auth(req, res, next) {
    if (req.session.admin) next();
    else res.redirect("/admin/login");
}

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM admin WHERE username=?", [username], (err, result) => {
        if (result.length && bcrypt.compareSync(password, result[0].password)) {
            req.session.admin = true;
            res.redirect("/admin/dashboard");
        } else {
            res.redirect("/admin/login");
        }
    });
});

router.get("/dashboard", auth, (req, res) => {
    db.query("SELECT * FROM tickets WHERE status='open'", (err, tickets) => {
        res.render("dashboard", { tickets });
    });
});

router.post("/close/:id", auth, (req, res) => {
    db.query("UPDATE tickets SET status='closed' WHERE id=?", [req.params.id]);
    res.redirect("/admin/dashboard");
});

router.get("/closed", auth, (req, res) => {
    db.query("SELECT * FROM tickets WHERE status='closed'", (err, tickets) => {
        res.render("closed", { tickets });
    });
});

module.exports = router;

