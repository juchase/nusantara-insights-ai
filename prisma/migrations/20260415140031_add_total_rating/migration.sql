/*
  Warnings:

  - Added the required column `totalRating` to the `DashboardSummary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DashboardSummary" ADD COLUMN     "totalRating" DOUBLE PRECISION NOT NULL;
