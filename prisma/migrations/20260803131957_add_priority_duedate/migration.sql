-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'NORMAL';
