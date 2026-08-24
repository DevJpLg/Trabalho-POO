import { prisma } from "../src/shared/database";

async function main() {
    try {
        const cols = await prisma.$queryRawUnsafe("SHOW COLUMNS FROM produtos");
        console.log("COLUMNS", cols);
        const rows = await prisma.produto.findMany({ take: 1 });
        console.log("FIND_OK", rows.length, rows[0] ? Object.keys(rows[0]) : []);
    } catch (error) {
        console.error("ERR_NAME", error instanceof Error ? error.name : typeof error);
        console.error("ERR_MSG", error instanceof Error ? error.message : error);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

void main();
