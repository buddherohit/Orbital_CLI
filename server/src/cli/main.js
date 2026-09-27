#!/usr/bin/env node

import dotenv from "dotenv";

import chalk from "chalk";
import figlet from "figlet";

import { Command } from "commander";

import { login, logout, whoami } from "./commands/auth/login.js";
import { wakeUp } from "./commands/ai/wakeUp.js";
import { commit } from "./commands/developer/commit.js";
import { review } from "./commands/developer/review.js";
import { explain } from "./commands/developer/explain.js";
import { testGenerator } from "./commands/developer/test.js";
import { history, resume } from "./commands/chat/history.js";

dotenv.config();

async function main() {
  // Display banner
  console.log(
    chalk.cyan(
      figlet.textSync("Orbit CLI", {
        font: "Standard",
        horizontalLayout: "default",
      })
    )
  );
  console.log(chalk.gray("A Cli based AI tool \n"));

  const program = new Command("orbit");

  program
    .version("0.0.1")
    .description("Orbit CLI - AI-Powered Terminal Assistant");

  // Core & Auth commands
  program.addCommand(wakeUp);
  program.addCommand(login);
  program.addCommand(logout);
  program.addCommand(whoami);

  // Developer Productivity commands
  program.addCommand(commit);
  program.addCommand(review);
  program.addCommand(explain);
  program.addCommand(testGenerator);

  // Chat & History commands
  program.addCommand(history);
  program.addCommand(resume);

  // Default action shows help
  program.action(() => {
    program.help();
  });



  program.parse();
}

main().catch((error) => {
  console.error(chalk.red("Error running Orbit CLI:"), error);
  process.exit(1);
});
