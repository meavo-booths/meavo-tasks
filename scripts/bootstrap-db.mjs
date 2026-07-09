import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, ToolCardKind } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function hasDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

async function applySqlMigration() {
  const sqlPath = join(
    root,
    "node_modules/@meavo/db/scripts/add-task-tables.sql"
  );
  const sql = readFileSync(sqlPath, "utf8");
  execSync("npx prisma db execute --stdin --schema node_modules/@meavo/db/prisma/schema.prisma", {
    cwd: root,
    input: sql,
    stdio: ["pipe", "inherit", "inherit"],
  });
}

async function seedToolCardAndAccess(prisma: PrismaClient) {
  const card = await prisma.toolCard.upsert({
    where: { id: "seed-tasks-tool" },
    update: {
      name: "Tasks",
      description: "Team task management — personal lists and shared boards.",
      url: "https://tasks.meavo.app",
      iconKey: "tasks",
      kind: ToolCardKind.APP_ACCESS,
      linkedAppKey: "tasks",
      sortOrder: 8,
      isActive: true,
    },
    create: {
      id: "seed-tasks-tool",
      name: "Tasks",
      description: "Team task management — personal lists and shared boards.",
      url: "https://tasks.meavo.app",
      iconKey: "tasks",
      kind: ToolCardKind.APP_ACCESS,
      linkedAppKey: "tasks",
      sortOrder: 8,
      isActive: true,
    },
  });

  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    console.log("No users found — skipping tool card access grants.");
    return;
  }

  await prisma.toolCardAccess.createMany({
    data: users.map((user) => ({ userId: user.id, cardId: card.id })),
    skipDuplicates: true,
  });

  console.log(`Granted Tasks access to ${users.length} user(s).`);
}

async function main() {
  if (!hasDatabaseUrl()) {
    console.log("bootstrap-db: DATABASE_URL not available — skipping (local dev).");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.$queryRaw`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'TaskWorkspace'
      LIMIT 1
    `;

    if (!Array.isArray(existing) || existing.length === 0) {
      console.log("bootstrap-db: applying task tables migration…");
      await applySqlMigration();
    } else {
      console.log("bootstrap-db: task tables already present.");
    }

    console.log("bootstrap-db: seeding tool card and granting team access…");
    await seedToolCardAndAccess(prisma);
    console.log("bootstrap-db: done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("bootstrap-db failed:", error);
  process.exit(1);
});
