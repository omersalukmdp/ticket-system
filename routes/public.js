const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
    res.render("index");
});

router.post("/ticket", (req, res) => {
    const { full_name, department, issue } = req.body;

    db.query(
        "INSERT INTO tickets (full_name, department, issue) VALUES (?, ?, ?)",
        [full_name, department, issue],
        () => res.redirect("/")
    );
});

module.exports = router;

