import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const cardsFilePath = path.join(__dirname, 'cards.json');
  const cardsData = JSON.parse(fs.readFileSync(cardsFilePath, 'utf-8'));
  
  console.log(`Loaded ${cardsData.length} cards from JSON. Starting upsert...`);
  
  for (const card of cardsData) {
    await prisma.card.upsert({
      where: { id: card.id },
      update: {
        name: card.name,
        description: card.description,
        type: card.type,
        isElite: card.isElite,
        buildCostFood: card.buildCostFood,
        buildCostMaterial: card.buildCostMaterial,
        buildCostGold: card.buildCostGold,
        sustainCostFood: card.sustainCostFood,
        sustainCostMaterial: card.sustainCostMaterial,
        sustainCostGold: card.sustainCostGold,
        returnFood: card.returnFood,
        returnMaterial: card.returnMaterial,
        returnGold: card.returnGold,
        nav: card.nav
      },
      create: {
        id: card.id,
        name: card.name,
        description: card.description,
        type: card.type,
        isElite: card.isElite,
        buildCostFood: card.buildCostFood,
        buildCostMaterial: card.buildCostMaterial,
        buildCostGold: card.buildCostGold,
        sustainCostFood: card.sustainCostFood,
        sustainCostMaterial: card.sustainCostMaterial,
        sustainCostGold: card.sustainCostGold,
        returnFood: card.returnFood,
        returnMaterial: card.returnMaterial,
        returnGold: card.returnGold,
        nav: card.nav
      }
    });
  }
  
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding cards:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
