-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reserva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "roupaId" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "quantidadeHomem" INTEGER NOT NULL DEFAULT 0,
    "quantidadeMulher" INTEGER NOT NULL DEFAULT 0,
    "nome" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reserva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reserva_roupaId_fkey" FOREIGN KEY ("roupaId") REFERENCES "Roupa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reserva" ("createdAt", "dataFim", "dataInicio", "estado", "id", "observacoes", "quantidadeHomem", "quantidadeMulher", "roupaId", "updatedAt", "userId") SELECT "createdAt", "dataFim", "dataInicio", "estado", "id", "observacoes", "quantidadeHomem", "quantidadeMulher", "roupaId", "updatedAt", "userId" FROM "Reserva";
DROP TABLE "Reserva";
ALTER TABLE "new_Reserva" RENAME TO "Reserva";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
