import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
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

export const review = new Command("review")
  .description("Perform an AI code review to find bugs, security risks, and optimization tips")
  .argument("<filepath>", "Path to the file to review")
  .action(async (filepath) => {
    try {
      const token = await getStoredToken();
      if (!token?.access_token) {
        console.log(chalk.red("❌ Not authenticated. Please run 'orbit login' first."));
        process.exit(1);
      }

      intro(chalk.bold.cyan(`🪐 Orbit Code Review: ${filepath}`));

      const absolutePath = path.resolve(process.cwd(), filepath);
      let fileContent = "";
      try {
        fileContent = await fs.readFile(absolutePath, "utf-8");
      } catch {
        console.log(chalk.red(`❌ File not found at path: ${absolutePath}`));
        process.exit(1);
      }

      const spinner = yoctoSpinner({ text: "Analyzing code for bugs, security & performance..." }).start();

      const prompt = `Perform a thorough and constructive code review for the following file (${path.basename(filepath)}):

\`\`\`${path.extname(filepath).slice(1) || "text"}
${fileContent}
\`\`\`

Provide feedback in these sections:
1. 🔍 **Summary & Quality Score** (Score out of 10)
2. 🐛 **Bugs & Edge Cases** (if any)
3. 🔒 **Security & Vulnerabilities** (if any)
4. ⚡ **Performance & Optimization Tips**
5. 💡 **Refactoring / Clean Code Suggestions** (Include small code diff or snippets where helpful)

Be concise, practical, and highly developer-friendly.`;

      let fullResponse = "";
      let isFirstChunk = true;

      const result = await aiService.sendMessage([{ role: "user", content: prompt }], (chunk) => {
        if (isFirstChunk) {
          spinner.stop();
          console.log("\n");
          console.log(chalk.green.bold("📋 Code Review Report:"));
          console.log(chalk.gray("─".repeat(60)));
          isFirstChunk = false;
        }
        fullResponse += chunk;
      });

      console.log("\n" + marked.parse(fullResponse));
      console.log(chalk.gray("─".repeat(60)));
      outro(chalk.green("✨ Code review complete!"));
    } catch (err) {
      console.error(chalk.red("❌ Error reviewing file:"), err.message);
      process.exit(1);
    }
  });
