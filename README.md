---

```markdown
# 🖥️ Server Monitor

A lightweight Node.js-based system monitor that performs **hourly health checks** on both the **operating system** and **MySQL database**, then emails a formatted report to administrators.

---

## 🚀 Features

- 📊 Runs periodic system and database diagnostics (via cron).
- 🧠 Executes MySQL queries for performance metrics.
- 💾 Monitors system memory and CPU usage.
- 📧 Sends formatted email reports automatically.
- 🕐 Supports manual or scheduled execution.
- 🔒 All configuration managed via environment variables.

---

## 📁 Project Structure

```

project-root/
│
├── config.js
├── db.js
├── mailer.js
├── monitor.js
├── server.js
├── package.json
├── .env
└── README.md

````

---

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aashir-Adnan/server-monitor.git
   cd server-monitor
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the project root with the following values:

   ```env
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=ai_credits

   # Email
   EMAIL_FROM=aashiradnan99@gmail.com
   EMAIL_TO=aashiradnan99@gmail.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=aashiradnan99@gmail.com
   SMTP_PASS=your_app_password_here

   # Cron Schedule (Every hour)
   CRON_SCHEDULE=0 * * * *

   # Server Port
   PORT=3000
   ```

   > 💡 **Tip:**
   > To send emails from Gmail, use an **App Password** instead of your normal password.
   > You can create one at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

---

## ▶️ Usage

### **Run the server**

```bash
node server.js
```

The server will:

* Start an API at `http://localhost:3000`
* Automatically run the monitor every hour

---

### **Manual Trigger**

You can manually trigger the monitor by visiting:

```
GET http://localhost:3000/run-monitor
```

You’ll receive a JSON response with system and database results.

---

## 📅 Cron Schedule

| Schedule        | Expression    | Description                     |
| --------------- | ------------- | ------------------------------- |
| Every minute    | `* * * * *`   | Useful for testing              |
| Every 5 minutes | `*/5 * * * *` | Regular short checks            |
| Every hour      | `0 * * * *`   | Recommended production interval |

---

## 📊 Example Email Report

```
=============================
🖥 SERVER MONITOR REPORT
=============================

Time: 2025-10-22 15:00

--- SYSTEM INFO ---
Platform: windows
Memory: 3.25 GB free / 8.00 GB total
[████████░░░░░░░░░░░░░░░░░░░] 60% used

--- MYSQL INFO ---
innodb_buffer_pool_size : 16777216
Threads_connected : 5
Threads_running : 2
```

---

## 🧰 Troubleshooting

| Issue                      | Cause                                  | Fix                                                                                  |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `'free' is not recognized` | Linux command not supported on Windows | Use PowerShell command `Get-CimInstance Win32_OperatingSystem` or Node’s `os` module |
| Email not sending          | Invalid SMTP credentials               | Recheck `.env` SMTP values or enable less secure app access                          |
| Cron job not running       | Incorrect cron format                  | Use verified expressions like `0 * * * *` for hourly                                 |
| Database errors            | Wrong credentials                      | Verify MySQL access in `.env`                                                        |

---

## 🧠 Environment Variables Reference

| Variable        | Description                           |
| --------------- | ------------------------------------- |
| `DB_HOST`       | Database host address                 |
| `DB_USER`       | Database username                     |
| `DB_PASSWORD`   | Database password                     |
| `DB_NAME`       | Database name                         |
| `EMAIL_FROM`    | Sender email address                  |
| `EMAIL_TO`      | Comma-separated recipient list        |
| `SMTP_HOST`     | SMTP server host                      |
| `SMTP_PORT`     | SMTP port (e.g. 587)                  |
| `SMTP_SECURE`   | `true` for SSL/TLS, otherwise `false` |
| `SMTP_USER`     | SMTP username                         |
| `SMTP_PASS`     | SMTP password or app password         |
| `CRON_SCHEDULE` | Cron expression for scheduling        |
| `PORT`          | Port number for Express server        |

---

## 📦 Dependencies

| Package      | Description                 |
| ------------ | --------------------------- |
| `express`    | HTTP API framework          |
| `node-cron`  | Cron job scheduling         |
| `nodemailer` | Email sending library       |
| `mysql2`     | MySQL client                |
| `dotenv`     | Loads environment variables |

---


## ✉️ Contact

For questions or contributions, reach out at:
📧 **[aashiradnan99@gmail.com](mailto:aashiradnan99@gmail.com)**

---
