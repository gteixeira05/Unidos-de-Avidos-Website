-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Roupa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ano" INTEGER NOT NULL,
    "tema" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "quantidadeHomem" INTEGER NOT NULL DEFAULT 0,
    "quantidadeMulher" INTEGER NOT NULL DEFAULT 0,
    "conjuntoInclui" TEXT,
    "regrasLavagem" TEXT,
    "precoAluguer" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Disponibilidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roupaId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'LIVRE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Disponibilidade_roupaId_fkey" FOREIGN KEY ("roupaId") REFERENCES "Roupa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roupaId" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "quantidadeHomem" INTEGER NOT NULL DEFAULT 0,
    "quantidadeMulher" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reserva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reserva_roupaId_fkey" FOREIGN KEY ("roupaId") REFERENCES "Roupa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Disponibilidade_roupaId_data_key" ON "Disponibilidade"("roupaId", "data");
