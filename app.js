require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

/* ================= ADMIN ================= */
const adminUser = {
  username: 'admin',
  passwordHash: bcrypt.hashSync('Admin123!', 10)
};

/* ================= DB ================= */
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'ticketuser',
  password: 'TicketSifre123!',
  database: 'ticketdb'
});

/* ================= MAIL ================= */
const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendResolvedMail(to, issue) {
  await mailer.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Destek Talebiniz Çözüldü',
    html: `
      <p>Destek talebiniz çözülmüştür.</p>
      <hr>
      <p>${issue}</p>
      <br>
      <p>IT Destek</p>
    `
  });
}

/* ================= EXPRESS ================= */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'ticket-secret',
  resave: false,
  saveUninitialized: false
}));

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect('/login');
}

/* ================= ROUTES ================= */

/* USER PAGE */
app.get('/', async (req, res) => {
  const [tickets] = await pool.execute(
    `SELECT email, department, issue, created_at
     FROM tickets
     WHERE resolved = 0
     ORDER BY id DESC`
  );

  res.render('index', { tickets });
});

/* CREATE TICKET */
app.post('/ticket', async (req, res) => {
  const { email, department, issue } = req.body;

  await pool.execute(
    'INSERT INTO tickets (email, department, issue) VALUES (?, ?, ?)',
    [email, department, issue]
  );

  res.redirect('/');
});

/* LOGIN */
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (
    username === adminUser.username &&
    await bcrypt.compare(password, adminUser.passwordHash)
  ) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('login', { error: 'Hatalı giriş' });
  }
});

/* LOGOUT */
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

/* ADMIN PANEL */
app.get('/admin', requireAdmin, async (req, res) => {
  const [tickets] = await pool.execute(
    'SELECT * FROM tickets ORDER BY id DESC'
  );

  res.render('admin', { tickets });
});

/* TOGGLE + SLA */
app.post('/admin/tickets/:id/toggle', requireAdmin, async (req, res) => {
  const id = req.params.id;

  const [[ticket]] = await pool.execute(
    'SELECT email, issue, resolved FROM tickets WHERE id = ?',
    [id]
  );

  if (ticket.resolved == 0) {
    await pool.execute(
      'UPDATE tickets SET resolved = 1, resolved_at = NOW() WHERE id = ?',
      [id]
    );
    await sendResolvedMail(ticket.email, ticket.issue);
  } else {
    await pool.execute(
      'UPDATE tickets SET resolved = 0, resolved_at = NULL WHERE id = ?',
      [id]
    );
  }

  res.redirect('/admin');
});

/* DELETE */
app.post('/admin/tickets/:id/delete', requireAdmin, async (req, res) => {
  await pool.execute(
    'DELETE FROM tickets WHERE id = ?',
    [req.params.id]
  );

  res.redirect('/admin');
});

/* START */
app.listen(PORT, () => {
  console.log('Ticket system running on port 3000');
});
