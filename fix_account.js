
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = "sheizeracc@gmail.com";
    console.log("Checking for user:", email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        console.log("Found user:", user);
        // Delete accounts associated
        await prisma.account.deleteMany({ where: { userId: user.id } });
        // Delete user
        await prisma.user.delete({ where: { id: user.id } });
        console.log("Deleted user and accounts for", email);
    } else {
        console.log("User not found:", email);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
