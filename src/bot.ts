import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { run } from '@openai/agents';
import { createFinanceAgent } from './agent.js';
import { db } from './db.js';
dotenv.config();
// Check environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env');
  process.exit(1);
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Hisaab Bot is running...');
console.log('✅ Ready to receive messages!\n');

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'User';
  
  const welcomeMessage = `
🙏 Namaste ${firstName}!

Main aapka Hisaab Bot hoon 💰

**Kaise use karein:**

📝 Expense add karne ke liye:
• Sabji - 450
• Pooja saman 350
• Bijli bill 2500

💵 Budget set karein:
• "Is mahine ki income 50000 hai"

📊 Dekhne ke liye:
• "Abhi kitne paise bache?"
• "Is mahine ka total?"
• "Sabji me kitna gaya?"

Bas seedhe message karo, main samajh jaunga! 😊
  `.trim();

  await bot.sendMessage(chatId, welcomeMessage);
});

// Handle /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📖 **Help Guide**

**Quick Expense Format:**
• Sabji - 450
• Doodh 80
• Bijli ka bill 2500

**Common Commands:**
• "Income 50000 set karo"
• "Kitne paise bache?"
• "Is mahine ka total?"
• "Last mahine ka kharcha?"
• "Sabji me kitna gaya?"
• "Recent expenses dikhao"

**Categories:**
🥬 sabji, 🪔 pooja_saman, 🥛 doodh
💡 bijli_bill, 💧 pani_bill, 📱 mobile_recharge
🏥 medical, 🚗 transport, 👕 kapde
🏠 ghar_ka_saman, 🍽️ bahar_khana

Koi bhi sawaal? Seedha message karo! 😊
  `.trim();

  await bot.sendMessage(chatId, helpMessage);
});

// Handle all text messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const telegramId = msg.from?.id.toString() || '';

  // Ignore commands (already handled above)
  if (!text || text.startsWith('/')) return;

  try {
    // Get or create user
    const user = await db.getOrCreateUser({
      telegramId,
      name: msg.from?.first_name || 'User',
    });

    // Quick format detection for simple inputs
    // Matches: "sabji - 100", "sabji 100", "sabji: 100"
    const quickFormat = 
      /^([a-zA-Z_\s]+)\s*[-:]\s*(\d+)$/.exec(text) ||
      /^([a-zA-Z_\s]+)\s+(\d+)$/.exec(text);

    let userMessage = text;
    
    // Convert quick format to natural language
    if (quickFormat) {
      const [, category, amount] = quickFormat;
      userMessage = `${category} me ${amount} rupaye kharch hua`;
    }

    // Show typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Run agent
    const agent = createFinanceAgent(user.id);
    const result = await run(agent, userMessage);

    // Send response
    //@ts-ignore
    await bot.sendMessage(chatId, result.finalOutput, {
      parse_mode: 'Markdown',
    });

  } catch (error) {
    console.error('Error processing message:', error);
    
    await bot.sendMessage(
      chatId,
      '😅 Sorry, kuch problem ho gayi. Thoda baad me phir se try karo.\n\n' +
      'Agar problem bani rahe, toh /help dekho ya /start se shuru karo.'
    );
  }
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});