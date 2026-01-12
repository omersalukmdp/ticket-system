const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'ticketuser',
  password: 'Ticket123!',
  database: 'ticket_system'
});

db.connect(err => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err);
    return;
  }
  console.log('MySQL bağlantısı başarılı');
});

module.exports = db;

