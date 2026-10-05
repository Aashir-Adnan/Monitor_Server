# 🖥️ Server Monitor

A lightweight **Node.js** service that checks the health of the **host machine** and its **MySQL server** on a schedule, then emails a plain-text report to administrators. It also has an HTTP endpoint that runs the same checks on demand and returns them as JSON.

There's no agent, dashboard or time-series store. It's a cron job plus a mailer, for small servers that just need a regular "is everything OK?" email.

---

## Table of contents

- [What it checks](#what-it-checks)
- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running](#running)
  - [As a long-running service](#as-a-long-running-service)
  - [HTTP endpoints](#http-endpoints)
  - [Keeping it alive (pm2 / systemd)](#keeping-it-alive-pm2--systemd)
- [Example report](#example-report)
- [Cron schedule cheatsheet](#cron-schedule-cheatsheet)
- [Project structure](#project-structure)
- [Module reference](#module-reference)
- [Extending](#extending)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [Contact](#contact)

---

## What it checks

### Operating system

| Metric | Source |
|--------|--------|
| Platform, architecture | `os.platform()`, `os.arch()` |
| Uptime (hours) | `os.uptime()` |
| Free / total memory (GB) | `os.freemem()`, `os.totalmem()` |
| Memory usage bar | A 25-character ASCII bar, e.g. `[███████████░░░░] 60% used` |
| Raw memory table | Linux/macOS: `free -h`. Windows: `Get-CimInstance Win32_OperatingSystem` through PowerShell. |

### MySQL

| Query | Why |
|-------|-----|
| `SHOW VARIABLES LIKE '%buffer%'` | InnoDB buffer pool, join/sort buffers |
| `SHOW VARIABLES LIKE '%cache%'` | Table/thread/query cache sizing |
| `SHOW VARIABLES LIKE '%max_connections%'` | Connection ceiling |
| `SHOW GLOBAL STATUS LIKE 'Threads_connected'` | Current connections |
| `SHOW GLOBAL STATUS LIKE 'Threads_running'` | Queries running right now |
| `SHOW FULL PROCESSLIST` | Every session and what it's doing (spots long-running or stuck queries) |

### The monitor process itself

Every 10 seconds `server.js` logs its own resident memory (RSS) and peak RSS to stdout, e.g. `Current: 48.12 MB | Peak: 52.40 MB`.

---

## How it works

```
server.js
 ├─ Express app on PORT
 │    ├─ GET /             → "✅ Server Monitor API is running"
 │    └─ GET /run-monitor  → runMonitor(false) → JSON (no email)
 ├─ node-cron(CRON_SCHEDULE) → runMonitor(true) → email
 └─ setInterval(10s)       → log own RSS / peak

monitor.js  runMonitor(sendEmail)
 ├─ runSystemCommand()  (free -h | PowerShell CIM)
 ├─ os.* memory + uptime → createMemoryBar()
 ├─ db.queryDB()        (one connection, 6 queries, always closed)
 ├─ format plain-text report
 └─ mailer.sendMail("🖥 Server Monitor Report", report)
```

A failed query doesn't stop the run. `queryDB()` catches the error and records it as `results.error`, so the report is still sent. A failed cron run is logged as `❌ Monitor failed: …`.

---

## Requirements

- **Node.js 16+**
- A **MySQL/MariaDB** user that can run `SHOW VARIABLES`, `SHOW GLOBAL STATUS` and `SHOW PROCESSLIST`. The `PROCESS` privilege is needed to see other users' threads.
- An **SMTP** account. For Gmail that means an [App Password](https://myaccount.google.com/apppasswords).

---

## Installation

```bash
git clone https://github.com/Aashir-Adnan/Monitor_Server.git
cd Monitor_Server
npm install
```

---

## Configuration

Create a `.env` file in the project root. It's git-ignored.

```dotenv
# MySQL
DB_HOST=localhost
DB_USER=monitor
DB_PASS=change-me
DB_NAME=my_database

# Email
EMAIL_FROM=monitor@example.com
EMAIL_TO=admin1@example.com,admin2@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=monitor@example.com
SMTP_PASS=your-app-password

# Schedule & server
CRON_SCHEDULE=0 * * * *
PORT=3000
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | — | MySQL host |
| `DB_USER` | — | MySQL user |
| `DB_PASS` | — | MySQL password. The variable is **`DB_PASS`**, not `DB_PASSWORD`. |
| `DB_NAME` | — | Database to connect to (any one works, since the checks are server-wide) |
| `EMAIL_FROM` | — | Sender address |
| `EMAIL_TO` | `[]` | **Comma-separated** recipient list |
| `SMTP_HOST` | — | SMTP server |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_SECURE` | `false` | `true` for implicit TLS (port 465). `false` uses STARTTLS on 587. |
| `SMTP_USER` / `SMTP_PASS` | — | SMTP credentials |
| `CRON_SCHEDULE` | `0 * * * *` | When the emailed report runs (hourly by default) |
| `PORT` | `3000` | HTTP port |

---

## Running

### As a long-running service

```bash
npm start            # node server.js
# 🚀 Server monitor running on port 3000
```

### HTTP endpoints

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/` | `✅ Server Monitor API is running` (liveness check) |
| `GET` | `/run-monitor` | Runs every check **without sending email** and returns `{ message, system, db }` |

```bash
curl http://localhost:3000/run-monitor | jq .
```

```json
{
  "message": "Monitor run complete",
  "system": "              total        used        free ...",
  "db": {
    "SHOW GLOBAL STATUS LIKE 'Threads_connected';": [{ "Variable_name": "Threads_connected", "Value": "5" }],
    "...": []
  }
}
```

### Keeping it alive (pm2 / systemd)

**pm2**

```bash
npm i -g pm2
pm2 start server.js --name server-monitor
pm2 save && pm2 startup
```

**systemd** (`/etc/systemd/system/server-monitor.service`)

```ini
[Unit]
Description=Server Monitor
After=network.target mysql.service

[Service]
WorkingDirectory=/opt/Monitor_Server
ExecStart=/usr/bin/node server.js
Restart=always
EnvironmentFile=/opt/Monitor_Server/.env

[Install]
WantedBy=multi-user.target
```

---

## Example report

```
=============================
🖥 SERVER MONITOR REPORT
=============================
Time: 10/22/2025, 3:00:00 PM

--- SYSTEM INFO ---
Platform: linux
Architecture: x64
Uptime: 312.45 hours
Memory: 3.25 GB free / 8.00 GB total
[███████████████░░░░░░░░░░] 59% used

Command Output:
               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       4.6Gi       1.2Gi       120Mi       2.0Gi       3.2Gi
Swap:          2.0Gi       0.0Gi       2.0Gi

--- MYSQL INFO ---
------------------------------------------------------------
🧩 Query: SHOW GLOBAL STATUS LIKE 'Threads_connected';
------------------------------------------------------------
Variable_name                       : Threads_connected
Value                               : 5
...
```

---

## Cron schedule cheatsheet

| Schedule | Expression |
|----------|------------|
| Every minute (testing) | `* * * * *` |
| Every 5 minutes | `*/5 * * * *` |
| Every hour (default) | `0 * * * *` |
| Every day at 09:00 | `0 9 * * *` |
| Weekdays at 18:00 | `0 18 * * 1-5` |

`node-cron` also accepts an optional leading **seconds** field, e.g. `*/30 * * * * *` for every 30 seconds.

---

## Project structure

```
Monitor_Server/
├── server.js     # Express API, cron scheduler, self memory logging
├── monitor.js    # runMonitor(): gathers OS + DB data, formats report, emails
├── db.js         # queryDB(): runs the MySQL diagnostic queries
├── mailer.js     # sendMail(subject, text) via Nodemailer
├── config.js     # Reads .env into a typed config object
└── package.json
```

---

## Module reference

| Export | File | Signature | Notes |
|--------|------|-----------|-------|
| `config` | `config.js` | object | `db`, `email{from,to[],smtp}`, `cronSchedule`, `port` |
| `queryDB` | `db.js` | `() → Promise<Record<query, rows[]>>` | Opens and closes its own connection |
| `sendMail` | `mailer.js` | `(subject, text) → Promise<void>` | Plain-text email to every `EMAIL_TO` address |
| `runMonitor` | `monitor.js` | `(sendEmail = true) → Promise<{ sysOutput, dbResults }>` | The main routine |

---

## Extending

- **Add a MySQL check:** append a query to the `queries` array in `db.js`. It shows up in both the email and the JSON.
- **Add disk usage:** run `df -h` (or `Get-PSDrive` on Windows) next to `getSystemCommand()` and add the output to the report.
- **Only email on problems:** in `runMonitor`, compare `Threads_running` or used memory against a threshold and only call `sendMail` when it's exceeded.
- **HTML email:** pass `html` instead of `text` in `mailer.js`.

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `'free' is not recognized` | Running on Windows with an old build | The current code picks PowerShell automatically on `win32`. Pull the latest version. |
| `Access denied for user` | Wrong DB credentials, or `DB_PASSWORD` set instead of `DB_PASS` | Use `DB_PASS` |
| `PROCESSLIST` only shows your own threads | Missing privilege | `GRANT PROCESS ON *.* TO 'monitor'@'%';` |
| `Invalid login: 535` | Gmail rejected the password | Use an App Password and keep `SMTP_SECURE=false` with port 587 |
| No emails arrive | `EMAIL_TO` is empty or the cron expression is invalid | Check `.env`. Test with `* * * * *`. |
| Report is huge | Busy server: `SHOW FULL PROCESSLIST` lists every connection | Drop it, or switch to a filtered `information_schema.PROCESSLIST` query |

---

## Security notes

- `/run-monitor` is **unauthenticated** and returns server internals, including running SQL from the process list. Bind the service to `127.0.0.1`, put it behind a reverse proxy with auth, or firewall the port.
- Give the monitor its own **least-privilege** MySQL user (`PROCESS` only).

---

## Contact

Questions or contributions: open an issue on [GitHub](https://github.com/Aashir-Adnan/Monitor_Server/issues).
