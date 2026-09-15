const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const team = await prisma.team.findFirst({
    where: { teamName: { contains: 'Sid' } }
  });
  console.log(team);
  if (team) {
    await prisma.team.delete({ where: { id: team.id } });
    console.log("Deleted team:", team.teamName);
  } else {
    console.log("Team not found");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
