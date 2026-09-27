import { Command } from "commander";
import chalk from "chalk";
import { intro, outro, confirm } from "@clack/prompts";
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
    heading: chalk.green.bold,
  })
);

const aiService = new AIService();

export const testGenerator = new Command("test")
  .description("Automatically generate unit tests for any source code file")
  .argument("<filepath>", "Path to the source file")
  .option("-s, --save", "Automatically save the generated test file next to the source file")
  .action(async (filepath, options) => {
    try {
      const token = await getStoredToken();
      if (!token?.access_token) {
        console.log(chalk.red("❌ Not authenticated. Please run 'orbit login' first."));
        process.exit(1);
      }

      intro(chalk.bold.cyan(`🪐 Orbit AI Unit Test Generator: ${filepath}`));

      const absolutePath = path.resolve(process.cwd(), filepath);
      let fileContent = "";
      try {
        fileContent = await fs.readFile(absolutePath, "utf-8");
      } catch {
        console.log(chalk.red(`❌ File not found at path: ${absolutePath}`));
        process.exit(1);
      }

      const ext = path.extname(filepath);
      const isTs = ext === ".ts" || ext === ".tsx";
      const isPython = ext === ".py";
      const isJava = ext === ".java";

      const framework = isPython ? "pytest" : isJava ? "JUnit" : isTs ? "Vitest / Jest with TypeScript" : "Vitest / Jest";

      const spinner = yoctoSpinner({ text: `Generating comprehensive ${framework} unit tests...` }).start();

      const prompt = `Generate a complete, production-ready unit test suite for the following file (${path.basename(filepath)}) using ${framework}:

\`\`\`${ext.slice(1) || "text"}
${fileContent}
\`\`\`

Requirements:
- Cover happy paths, edge cases, error conditions, and null/undefined handling.
- Mock external network calls or database adapters if present.
- Provide clean, runnable test code with imports matching the source file path.
- Provide the complete code inside a single markdown code block followed by a brief 2-3 line summary.`;

      let fullResponse = "";
      let isFirstChunk = true;

      const result = await aiService.sendMessage([{ role: "user", content: prompt }], (chunk) => {
        if (isFirstChunk) {
          spinner.stop();
          console.log("\n");
          console.log(chalk.green.bold("🧪 Generated Unit Test Suite:"));
          console.log(chalk.gray("─".repeat(60)));
          isFirstChunk = false;
        }
        fullResponse += chunk;
      });

      console.log("\n" + marked.parse(fullResponse));
      console.log(chalk.gray("─".repeat(60)));

      // Extract test code block
      const match = fullResponse.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
      const testCode = match ? match[1].trim() : null;

      if (testCode) {
        const parsedPath = path.parse(filepath);
        const testFileName = isPython
          ? `test_${parsedPath.name}.py`
          : isJava
          ? `${parsedPath.name}Test.java`
          : `${parsedPath.name}.test${parsedPath.ext}`;

        const testFilePath = path.join(parsedPath.dir, testFileName);

        let shouldSave = options.save;
        if (!shouldSave) {
          shouldSave = await confirm({
            message: `Would you like to save this test file to: ${chalk.cyan(testFilePath)} ?`,
            initialValue: true,
          });
        }

        if (shouldSave) {
          await fs.writeFile(path.resolve(process.cwd(), testFilePath), testCode, "utf-8");
          console.log(chalk.green(`\n✓ Saved test file to: ${chalk.bold(testFilePath)}`));
        }
      }

      outro(chalk.green("✨ Unit tests generated!"));
    } catch (err) {
      console.error(chalk.red("❌ Error generating tests:"), err.message);
      process.exit(1);
    }
  });
