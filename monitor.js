import { exec } from "child_process";
import { queryDB } from "./db.js";
import { sendMail } from "./mailer.js";

export const runMonitor = async () => {
  console.log("🔍 Running system monitor at", new Date().toLocaleString());

  const dbResults = await queryDB();

  const sysCommand = "free -h"; 
  const sysOutput = await new Promise((resolve) => {
    exec(sysCommand, (error, stdout, stderr) => {
      if (error) return resolve(`Error: ${error.message}`);
      if (stderr) return resolve(`Stderr: ${stderr}`);
      resolve(stdout.trim());
    });
  });

  let formattedDB = "";
  for (const [query, rows] of Object.entries(dbResults)) {
    formattedDB += `\n\n>>> ${query}\n${JSON.stringify(rows, null, 2)}\n`;
  }

  const report = `
    =============================
    🖥 SERVER MONITOR REPORT
    =============================
    Time: ${new Date().toLocaleString()}

    --- SYSTEM INFO ---
    Command: ${sysCommand}
    ${sysOutput}

    --- MYSQL INFO ---
    ${formattedDB}
    `;

  await sendMail("Server Monitor Report", report);
};
