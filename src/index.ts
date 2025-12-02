import 'dotenv/config';
import { run } from '@openai/agents';
import { createFinanceAgent } from './agent.js';
import { db } from './db.js';

async function main() {
  console.log('🚀 Starting Ghar Ka Hisaab Bot...\n');

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }

  try {
    // Create or get test user
    const user = await db.getOrCreateUser({
      telegramId: 'test-user-123',
      name: 'Test User',
    });

    console.log(`✅ User: ${user.name} (ID: ${user.id})\n`);

    const agent = createFinanceAgent(user.id);

    // Test conversations
    const queries = [
      'Is mahine ki income 50000 hai',
      'Sabji - 450',
      'Pooja saman 350',
      'Doodh 80',
      'Bijli bill 2500',
      'Abhi kitne paise bache?',
      'Is mahine ka total kharcha?',
      'Sabji me kitna gaya?',
      'Last 5 expenses dikhao',
    ];

    console.log('📝 Running test queries...\n');
    console.log('='.repeat(60) + '\n');

    for (const query of queries) {
      console.log(`👤 User: ${query}`);
      
      try {
        const result = await run(agent, query);
        console.log(`🤖 Bot: ${result.finalOutput}\n`);
      } catch (error) {
        console.error(`❌ Error: ${error}\n`);
      }
      
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('='.repeat(60));
    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 To view database: npm run db:studio');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the test
main();