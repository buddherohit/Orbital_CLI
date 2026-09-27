import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { intro, outro, select, text, isCancel, cancel } from "@clack/prompts";
import fs from "fs/promises";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".orbit");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      model: process.env.ORBITAI_MODEL || "gemini-2.5-flash",
      temperature: 0.7,
      maxTokens: 4096,
      serverUrl: "http://localhost:3005",
      theme: "cyberpunk",
    };
  }
}

export async function saveConfig(cfg) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

export const configCommand = new Command("config")
  .description("Manage Orbit CLI configuration, AI models, and preferences")
  .option("-l, --list", "List all current configurations")
  .option("-s, --set <key=value>", "Set a configuration key (e.g. model=gemini-2.5-pro)")
  .option("-g, --get <key>", "Get a configuration value")
  .action(async (options) => {
    try {
      intro(chalk.bold.cyan("🪐 Orbit CLI Configuration Manager"));
      const cfg = await loadConfig();

      if (options.get) {
        const val = cfg[options.get];
        if (val !== undefined) {
          console.log(`\n${chalk.cyan(options.get)}: ${chalk.bold.green(val)}\n`);
        } else {
          console.log(chalk.red(`\nKey '${options.get}' not found.\n`));
        }
        return;
      }

      if (options.set) {
        const [k, ...vParts] = options.set.split("=");
        const v = vParts.join("=");
        if (!k || !v) {
          console.log(chalk.red("Invalid format. Use: orbit config --set key=value"));
          process.exit(1);
        }
        cfg[k.trim()] = v.trim();
        await saveConfig(cfg);
        console.log(chalk.green(`\n✓ Config updated: ${chalk.bold(k.trim())} = ${chalk.cyan(v.trim())}\n`));
        return;
      }

      if (options.list) {
        const display = Object.entries(cfg)
          .map(([k, v]) => `  ${chalk.cyan(k.padEnd(16))}: ${chalk.bold.green(v)}`)
          .join("\n");

        const box = boxen(display, {
          title: "⚙️  Active Configuration",
          padding: 1,
          margin: { top: 1, bottom: 1 },
          borderStyle: "round",
          borderColor: "cyan",
        });
        console.log(box);
        return;
      }

      // Interactive configuration menu
      const action = await select({
        message: "Choose a configuration action:",
        options: [
          { value: "model", label: "🤖 Change AI Model", hint: `Current: ${cfg.model}` },
          { value: "serverUrl", label: "🌐 Change Server URL", hint: `Current: ${cfg.serverUrl}` },
          { value: "list", label: "📋 View Full Config", hint: "Show all key-value settings" },
        ],
      });

      if (isCancel(action)) {
        cancel("Config unchanged.");
        process.exit(0);
      }

      if (action === "model") {
        const newModel = await select({
          message: "Select Default Gemini Model:",
          options: [
            { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Fast, highly capable (Recommended)" },
            { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Deep reasoning & complex tasks" },
            { value: "gemini-flash-latest", label: "Gemini Flash Latest", hint: "Always latest flash release" },
          ],
        });

        if (!isCancel(newModel)) {
          cfg.model = newModel;
          await saveConfig(cfg);
          console.log(chalk.green(`\n✓ Model set to: ${chalk.bold.cyan(newModel)}\n`));
        }
      } else if (action === "serverUrl") {
        const newUrl = await text({
          message: "Enter Server URL:",
          initialValue: cfg.serverUrl || "http://localhost:3005",
          validate: (v) => (!v.startsWith("http") ? "Must start with http:// or https://" : undefined),
        });

        if (!isCancel(newUrl)) {
          cfg.serverUrl = newUrl.trim();
          await saveConfig(cfg);
          console.log(chalk.green(`\n✓ Server URL set to: ${chalk.bold.cyan(newUrl.trim())}\n`));
        }
      } else if (action === "list") {
        const display = Object.entries(cfg)
          .map(([k, v]) => `  ${chalk.cyan(k.padEnd(16))}: ${chalk.bold.green(v)}`)
          .join("\n");

        console.log(
          boxen(display, {
            title: "⚙️  Active Configuration",
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: "round",
            borderColor: "cyan",
          })
        );
      }

      outro(chalk.green("✨ Configuration saved!"));
    } catch (err) {
      console.error(chalk.red("❌ Config error:"), err.message);
      process.exit(1);
    }
  });
