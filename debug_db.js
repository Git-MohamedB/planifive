
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { accounts: true }
    });
    fs.writeFileSync('db_dump.json', JSON.stringify(users, null, 2));
    console.log("Dumped " + users.length + " users to db_dump.json");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
