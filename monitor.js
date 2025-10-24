const { exec } = require("child_process");
const os = require("os");
const { queryDB } = require("./db");
const { sendMail } = require("./mailer");

//
// Detect correct system info command per OS
//
function getSystemCommand() {
  if (process.platform === "win32") {
    return 'powershell -Command "Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory,TotalVisibleMemorySize | Format-Table -AutoSize"';
  } else {
    return "free -h";
  }
}

//
// Execute that command safely
//
async function runSystemCommand() {
  return new Promise((resolve, reject) => {
    const command = getSystemCommand();
    exec(command, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout || stderr);
    });
  });
}

//
// Draw a simple ASCII bar graph for memory usage
//
function createMemoryBar(free, total) {
  const used = total - free;
  const usedPercent = Math.round((used / total) * 100);
  const barLength = 25;
  const filled = Math.round((usedPercent / 100) * barLength);
  const empty = barLength - filled;

  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${usedPercent}% used`;
}

//
// Main monitor function
//
const runMonitor = async (sendEmail = true) => {
  console.log("🔍 Running system monitor at", new Date().toLocaleString());

  // --- SYSTEM INFO ---
  const sysOutput = await runSystemCommand().catch((err) => `Error: ${err.message}`);

  // Also use Node's OS module for memory summary (cross-platform)
  const totalMemGB = os.totalmem() / 1024 / 1024 / 1024;
  const freeMemGB = os.freemem() / 1024 / 1024 / 1024;
  const memBar = createMemoryBar(freeMemGB, totalMemGB);

  // --- DATABASE INFO ---
  const dbResults = await queryDB();

  let formattedDB = "";
  for (const [query, rows] of Object.entries(dbResults)) {
    formattedDB += `
------------------------------------------------------------
🧩 Query: ${query}
------------------------------------------------------------
${rows
  .map(
    (row) =>
      Object.entries(row)
        .map(([k, v]) => `${k.padEnd(35)} : ${v}`)
        .join("\n")
  )
  .join("\n\n")}
\n`;
  }

  // --- FINAL REPORT ---
  const report = `
=============================
🖥 SERVER MONITOR REPORT
=============================

Time: ${new Date().toLocaleString()}

--- SYSTEM INFO ---
Platform: ${os.platform()}
Architecture: ${os.arch()}
Uptime: ${(os.uptime() / 3600).toFixed(2)} hours
Memory: ${freeMemGB.toFixed(2)} GB free / ${totalMemGB.toFixed(2)} GB total
${memBar}

Command Output:
${sysOutput}

--- MYSQL INFO ---
${formattedDB}
`;

  console.log(report);

  if (sendEmail) {
    await sendMail("🖥 Server Monitor Report", report);
  }

  return { sysOutput, dbResults };
};

module.exports = { runMonitor };
