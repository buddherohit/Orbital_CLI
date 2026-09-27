import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { intro, outro, select, isCancel, cancel, confirm } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import prisma from "../../../lib/db.js";
import { ChatService } from "../../../services/chat.services.js";
import { getStoredToken } from "../auth/login.js";
import { startChat } from "../../chat/chat-with-ai.js";

const chatService = new ChatService();

async function getUser() {
  const token = await getStoredToken();
  if (!token?.access_token) {
    console.log(chalk.red("❌ Not authenticated. Please run 'orbit login' first."));
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.access_token },
      },
    },
  });

  if (!user) {
    console.log(chalk.red("❌ User not found. Please login again."));
    process.exit(1);
  }

  return user;
}

export const history = new Command("history")
  .description("View past conversations and chat sessions")
  .option("-d, --delete", "Delete a conversation interactively")
  .action(async (options) => {
    try {
      const user = await getUser();
      intro(chalk.bold.cyan(`🪐 Orbit Conversation History (${user.name})`));

      const spinner = yoctoSpinner({ text: "Fetching chat history..." }).start();
      const conversations = await chatService.getUserConversations(user.id);
      spinner.stop();

      if (conversations.length === 0) {
        console.log(chalk.yellow("\nℹ️  No past conversations found. Start one with 'orbit wakeup'!\n"));
        process.exit(0);
      }

      console.log("\n" + chalk.bold.cyan("📜 Past Conversations:") + "\n");

      conversations.forEach((conv, index) => {
        const date = new Date(conv.updatedAt).toLocaleString();
        const modeBadge =
          conv.mode === "agent"
            ? chalk.magenta("[Agent]")
            : conv.mode === "tool"
            ? chalk.yellow("[Tools]")
            : chalk.blue("[Chat]");

        console.log(
          `  ${chalk.bold.white(`${index + 1}.`)} ${modeBadge} ${chalk.bold.green(conv.title || "Untitled Conversation")}`
        );
        console.log(`     ${chalk.gray("ID:")} ${chalk.dim(conv.id)}  ${chalk.gray("•  Updated:")} ${chalk.dim(date)}`);
        console.log("");
      });

      if (options.delete) {
        const toDelete = await select({
          message: "Select a conversation to delete:",
          options: conversations.map((c) => ({
            value: c.id,
            label: `${c.title || "Untitled"} (${new Date(c.updatedAt).toLocaleDateString()})`,
          })),
        });

        if (!isCancel(toDelete)) {
          const sure = await confirm({
            message: "Are you sure you want to permanently delete this conversation?",
            initialValue: false,
          });

          if (sure && !isCancel(sure)) {
            await chatService.deleteConversation(toDelete, user.id);
            console.log(chalk.green("\n✓ Conversation deleted successfully."));
          }
        }
      } else {
        console.log(chalk.gray(`Tip: Run '${chalk.cyan("orbit resume")}' to continue any past conversation.\n`));
      }

      outro(chalk.green("✨ History listed!"));
    } catch (err) {
      console.error(chalk.red("❌ Error fetching history:"), err.message);
      process.exit(1);
    }
  });

export const resume = new Command("resume")
  .description("Resume a previous chat conversation")
  .argument("[conversationId]", "Optional Conversation ID to resume directly")
  .action(async (conversationId) => {
    try {
      const user = await getUser();
      intro(chalk.bold.cyan("🪐 Orbit Resume Chat Session"));

      let targetId = conversationId;

      if (!targetId) {
        const spinner = yoctoSpinner({ text: "Loading past conversations..." }).start();
        const conversations = await chatService.getUserConversations(user.id);
        spinner.stop();

        if (conversations.length === 0) {
          console.log(chalk.yellow("ℹ️  No past conversations found to resume."));
          process.exit(0);
        }

        const choices = conversations.map((c) => ({
          value: c.id,
          label: `${c.title || "Untitled"} [${c.mode}] - ${new Date(c.updatedAt).toLocaleDateString()}`,
        }));

        const selected = await select({
          message: "Select a conversation to resume:",
          options: choices,
        });

        if (isCancel(selected)) {
          cancel("Resume cancelled.");
          process.exit(0);
        }

        targetId = selected;
      }

      // Resume conversation with existing messages
      await startChat("chat", targetId);
    } catch (err) {
      console.error(chalk.red("❌ Error resuming conversation:"), err.message);
      process.exit(1);
    }
  });
