import 'dotenv/config';
import app from './src/app.js';


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  
  console.log(`\n--- 🔐 AUTH API ---`);
  console.log(`📌 Register:   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`📌 Login:      POST http://localhost:${PORT}/api/auth/login`);

  console.log(`\n--- 🏢 COMPANY API ---`);
  console.log(`📌 Config:     GET  http://localhost:${PORT}/api/companies/config`);

  console.log(`\n--- 👥 CUSTOMER API ---`);
  console.log(`📌 Dashboard:  GET  http://localhost:${PORT}/api/customers/dashboard`);

  console.log(`\n--- 🕒 ATTENDANCE API ---`);
  console.log(`📌 Attendance: GET  http://localhost:${PORT}/api/attendance`);
});
