const express = require("express");
const cron = require("node-cron");
const { config } = require("./config");
const { runMonitor } = require("./monitor");

const app = express();


let peak = 0;

setInterval(() => {
  const current = process.memoryUsage().rss / 1024 / 1024;
  if (current > peak) peak = current;
  console.log(`Current: ${current.toFixed(2)} MB | Peak: ${peak.toFixed(2)} MB`);
}, 10000); // every 10s

app.get("/", (req, res) => {
  res.send("✅ Server Monitor API is running");
});

app.get("/run-monitor", async (req, res) => {
  try {
    const result = await runMonitor(false); // no email for manual trigger
    res.json({
      message: "Monitor run complete",
      system: result.sysOutput,
      db: result.dbResults
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule hourly cron job
cron.schedule(config.cronSchedule, async () => {
  try {
    await runMonitor(true);
  } catch (err) {
    console.error("❌ Monitor failed:", err.message);
  }
});

app.listen(config.port, () => {
  console.log(`🚀 Server monitor running on port ${config.port}`);
});
