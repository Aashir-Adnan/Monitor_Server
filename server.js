import express from "express";
import cron from "node-cron";
import { config } from "./config.js";
import { runMonitor } from "./monitor.js";

const app = express();

app.get("/", (req, res) => {
  res.send("✅ Server Monitor API is running");
});

app.get("/run-monitor", async (req, res) => {
  try {
    const result = await runMonitor(false); 
    res.json({
      message: "Monitor run complete",
      system: result.sysOutput,
      db: result.dbResults
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

cron.schedule(config.cronSchedule, async () => {
  try {
    await runMonitor(true);
  } catch (err) {
    console.error("❌ Monitor failed:", err.message);
  }
});

app.listen(config.port, () =>
  console.log(`🚀 Server monitor running on port ${config.port}`)
);
