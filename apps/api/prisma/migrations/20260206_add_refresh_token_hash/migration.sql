-- Migration: Add refresh token hash fields
-- Date: 2026-02-06
-- Description: Add refreshTokenHash and refreshTokenExpires fields to Usuario table
-- for secure httpOnly cookie-based authentication

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "refreshTokenHash" TEXT,
ADD COLUMN "refreshTokenExpires" TIMESTAMP(3);

-- Comment: The old refreshToken field is kept for backward compatibility but should not be used
-- New implementations should use refreshTokenHash which stores a sha256 hash of the actual token
