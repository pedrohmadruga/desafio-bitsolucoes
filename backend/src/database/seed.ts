import bcrypt from "bcryptjs";
import { RequestStatus } from "@prisma/client";
import { prisma } from "./prisma";

const CATEGORIES = [
  "TI",
  "RH",
  "Compras",
  "Financeiro",
  "Infraestrutura",
] as const;

const DEMO_USERS = [
  { username: "ana.silva", name: "Ana Silva", password: "senha123" },
  { username: "carlos.souza", name: "Carlos Souza", password: "senha123" },
] as const;

async function seedCategories() {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash("senha123", 10);

  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        passwordHash,
      },
      create: {
        username: user.username,
        name: user.name,
        passwordHash,
      },
    });
  }
}

async function seedRequestsIfEmpty() {
  const count = await prisma.serviceRequest.count();
  if (count > 0) {
    console.log(`Solicitações já existem (${count}); pulando exemplos.`);
    return;
  }

  const [ti, rh, compras, financeiro, infra] = await Promise.all(
    CATEGORIES.map((name) => prisma.category.findUniqueOrThrow({ where: { name } })),
  );

  const ana = await prisma.user.findUniqueOrThrow({
    where: { username: "ana.silva" },
  });
  const carlos = await prisma.user.findUniqueOrThrow({
    where: { username: "carlos.souza" },
  });

  await prisma.serviceRequest.createMany({
    data: [
      {
        title: "Impressora do 2º andar sem toner",
        description:
          "A impressora compartilhada do 2º andar parou de imprimir e indica toner vazio. Precisamos de reposição urgente.",
        status: RequestStatus.ABERTO,
        categoryId: ti.id,
        requesterId: ana.id,
      },
      {
        title: "Atualização de dados cadastrais",
        description:
          "Preciso atualizar endereço e telefone de contato no sistema de RH para o próximo contracheque.",
        status: RequestStatus.EM_ATENDIMENTO,
        categoryId: rh.id,
        requesterId: carlos.id,
      },
      {
        title: "Cotação de notebooks para equipe",
        description:
          "Solicito cotação de 5 notebooks intermediários para a equipe de suporte, com garantia mínima de 12 meses.",
        status: RequestStatus.CONCLUIDO,
        categoryId: compras.id,
        requesterId: ana.id,
      },
      {
        title: "Reembolso de deslocamento",
        description:
          "Envio de notas de Uber e pedágio referentes a visita técnica na semana passada para reembolso.",
        status: RequestStatus.ABERTO,
        categoryId: financeiro.id,
        requesterId: carlos.id,
      },
      {
        title: "Ar-condicionado da sala de reunião",
        description:
          "O ar-condicionado da sala de reunião principal não gela desde segunda-feira. Verificar manutenção.",
        status: RequestStatus.EM_ATENDIMENTO,
        categoryId: infra.id,
        requesterId: ana.id,
      },
    ],
  });

  console.log("Solicitações de exemplo criadas.");
}

async function main() {
  console.log("Iniciando seed…");
  await seedCategories();
  console.log("Categorias ok.");
  await seedUsers();
  console.log("Usuários demo ok.");
  await seedRequestsIfEmpty();
  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
