import fs from "fs-extra";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const SESSION_TIMESTAMP = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .slice(0, 19);
const LOG_FILE = path.join(LOG_DIR, `session-${SESSION_TIMESTAMP}.log`);

// Ensure the logs directory exists synchronously before any logging happens
await fs.ensureDir(LOG_DIR);

/**
 * Formats a log entry line: [TIMESTAMP] [LEVEL] message
 */
function formatEntry(level, ...args) {
  const ts = new Date().toISOString();
  const msg = args
    .map((a) =>
      typeof a === "object" ? JSON.stringify(a, null, 2) : String(a),
    )
    .join(" ");
  return `[${ts}] [${level.padEnd(5)}] ${msg}\n`;
}

/**
 * Appends a log entry to the session log file (fire-and-forget).
 */
function write(level, ...args) {
  const entry = formatEntry(level, ...args);
  fs.appendFile(LOG_FILE, entry).catch(() => {
    /* silent */
  });
}

export const logger = {
  /** Path to the current session log file (useful for info messages). */
  filePath: LOG_FILE,

  info: (...args) => write("INFO", ...args),
  warn: (...args) => write("WARN", ...args),
  error: (...args) => write("ERROR", ...args),
  debug: (...args) => write("DEBUG", ...args),

  /**
   * Logs an API response: records the operation name and the full response data.
   * @param {string} operation  Human-readable name (e.g. 'listAccounts')
   * @param {*}      data       The response data object
   */
  apiResponse(operation, data) {
    write("API", `[${operation}] Response:`, data);
  },

  /**
   * Logs an API error.
   * @param {string} operation
   * @param {Error}  error
   */
  apiError(operation, error) {
    write(
      "ERROR",
      `[${operation}] Error:`,
      error?.response?.data ?? error?.message ?? error,
    );
  },

  /**
   * Logs a user interaction / prompt answer.
   * @param {string} promptName   Name of the prompt field
   * @param {*}      value        The value provided by the user (passwords are NOT hidden automatically – avoid logging sensitive data)
   */
  userInput(promptName, value) {
    write("INPUT", `[${promptName}]: ${JSON.stringify(value)}`);
  },

  /**
   * Logs an application-level event.
   * @param {string} event  Short event label
   * @param {*}      [meta] Optional extra context
   */
  event(event, meta) {
    write("EVENT", `[${event}]`, meta !== undefined ? meta : "");
  },
};
