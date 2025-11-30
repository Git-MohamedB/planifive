
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Listing ALL users in DB:");
    const users = await prisma.user.findMany({
        include: { accounts: true }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
