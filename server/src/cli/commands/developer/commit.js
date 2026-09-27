import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { intro, outro, confirm, text, isCancel, cancel, select } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { execSync } from "child_process";
import { AIService } from "../../ai/google-service.js";
import { getStoredToken } from "../auth/login.js";

const aiService = new AIService();

export const commit = new Command("commit")
  .description("Generate conventional git commit messages based on git diff")
  .option("-a, --all", "Automatically stage all modified files before commit")
  .action(async (options) => {
    try {
      const token = await getStoredToken();
      if (!token?.access_token) {
        console.log(chalk.red("❌ Not authenticated. Please run 'orbit login' first."));
        process.exit(1);
      }

      intro(chalk.bold.cyan("🪐 Orbit AI Git Commit Generator"));

      // Check if inside a git repo
      try {
        execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
      } catch {
        console.log(chalk.red("❌ Current directory is not a git repository."));
        process.exit(1);
      }

      if (options.all) {
        execSync("git add -A");
        console.log(chalk.gray("✓ Staged all changes (git add -A)"));
      }

      // Check staged diff
      let diff = execSync("git diff --staged", { encoding: "utf-8" }).trim();

      // If no staged diff, check unstaged diff and prompt to stage
      if (!diff) {
        const unstagedDiff = execSync("git diff", { encoding: "utf-8" }).trim();
        if (!unstagedDiff) {
          const untracked = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
          if (!untracked) {
            console.log(chalk.yellow("ℹ️  No changes detected in working directory."));
            process.exit(0);
          }
        }

        const shouldStage = await confirm({
          message: "No staged changes found. Would you like to stage all changes now?",
          initialValue: true,
        });

        if (isCancel(shouldStage) || !shouldStage) {
          cancel("Commit aborted.");
          process.exit(0);
        }

        execSync("git add -A");
        diff = execSync("git diff --staged", { encoding: "utf-8" }).trim();
      }

      if (!diff) {
        console.log(chalk.yellow("ℹ️  No changes to commit."));
        process.exit(0);
      }

      // Truncate diff if extremely large
      const truncatedDiff = diff.length > 8000 ? diff.slice(0, 8000) + "\n\n...[diff truncated for length]" : diff;

      const spinner = yoctoSpinner({ text: "Analyzing git diff & generating commit messages..." }).start();

      const prompt = `Analyze this git diff and suggest 3 high-quality, concise Conventional Commit messages (e.g. feat(scope): message, fix(scope): message, refactor: message, docs: message).

Git Diff:
\`\`\`diff
${truncatedDiff}
\`\`\`

Return ONLY the 3 commit message options, one per line. Do not include numbered bullets, markdown code blocks, or extra text.`;

      const response = await aiService.getMessage([{ role: "user", content: prompt }]);
      spinner.stop();

      const suggestions = response
        .split("\n")
        .map((s) => s.replace(/^[-*0-9.)\s]+/, "").trim())
        .filter((s) => s.length > 5)
        .slice(0, 3);

      if (suggestions.length === 0) {
        suggestions.push("chore: update project files");
      }

      const choices = suggestions.map((msg) => ({
        value: msg,
        label: msg,
      }));

      choices.push({
        value: "__custom__",
        label: chalk.yellow("✍️  Write / Edit custom commit message"),
      });

      const selected = await select({
        message: "Select a commit message:",
        options: choices,
      });

      if (isCancel(selected)) {
        cancel("Commit cancelled.");
        process.exit(0);
      }

      let finalMessage = selected;

      if (selected === "__custom__") {
        const customInput = await text({
          message: "Enter your commit message:",
          initialValue: suggestions[0] || "",
          validate: (val) => (!val || !val.trim() ? "Commit message cannot be empty" : undefined),
        });

        if (isCancel(customInput)) {
          cancel("Commit cancelled.");
          process.exit(0);
        }
        finalMessage = customInput.trim();
      }

      const shouldCommit = await confirm({
        message: `Execute: git commit -m "${finalMessage}" ?`,
        initialValue: true,
      });

      if (isCancel(shouldCommit) || !shouldCommit) {
        cancel("Commit cancelled.");
        process.exit(0);
      }

      execSync(`git commit -m "${finalMessage.replace(/"/g, '\\"')}"`, { stdio: "inherit" });

      outro(chalk.green("✅ Changes committed successfully!"));
    } catch (err) {
      console.error(chalk.red("❌ Error generating commit:"), err.message);
      process.exit(1);
    }
  });
