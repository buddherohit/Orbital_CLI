import { Command } from "commander";
import chalk from "chalk";
import { intro, outro } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import fs from "fs/promises";
import path from "path";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../../ai/google-service.js";
import { getStoredToken } from "../auth/login.js";

marked.use(
  markedTerminal({
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    strong: chalk.bold,
    em: chalk.italic,
    link: chalk.blue.underline,
  })
);

const aiService = new AIService();

export const explain = new Command("explain")
  .description("Explain any code file or architectural module in clear, simple terms")
  .argument("<filepath>", "Path to the file to explain")
  .action(async (filepath) => {
    try {
      const token = await getStoredToken();
      if (!token?.access_token) {
        console.log(chalk.red("❌ Not authenticated. Please run 'orbit login' first."));
        process.exit(1);
      }

      intro(chalk.bold.cyan(`🪐 Orbit Code Explainer: ${filepath}`));

      const absolutePath = path.resolve(process.cwd(), filepath);
      let fileContent = "";
      try {
        fileContent = await fs.readFile(absolutePath, "utf-8");
      } catch {
        console.log(chalk.red(`❌ File not found at path: ${absolutePath}`));
        process.exit(1);
      }

      const spinner = yoctoSpinner({ text: "Reading code and preparing explanation..." }).start();

      const prompt = `Explain the following code file (${path.basename(filepath)}) in a clear, easy-to-understand manner:

\`\`\`${path.extname(filepath).slice(1) || "text"}
${fileContent}
\`\`\`

Structure your response as follows:
1. 🎯 **Purpose**: What does this file do and why does it exist?
2. 🔄 **Core Flow / Step-by-Step Logic**: How it works from top to bottom.
3. 🔑 **Key Functions & Exports**: Short breakdown of main exports and helper functions.
4. 🔗 **Dependencies & Integrations**: Key packages or internal files it relies on.`;

      let fullResponse = "";
      let isFirstChunk = true;

      const result = await aiService.sendMessage([{ role: "user", content: prompt }], (chunk) => {
        if (isFirstChunk) {
          spinner.stop();
          console.log("\n");
          console.log(chalk.green.bold("📖 Code Explanation:"));
          console.log(chalk.gray("─".repeat(60)));
          isFirstChunk = false;
        }
        fullResponse += chunk;
      });

      console.log("\n" + marked.parse(fullResponse));
      console.log(chalk.gray("─".repeat(60)));
      outro(chalk.green("✨ Code explained!"));
    } catch (err) {
      console.error(chalk.red("❌ Error explaining file:"), err.message);
      process.exit(1);
    }
  });
