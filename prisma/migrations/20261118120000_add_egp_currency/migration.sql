-- Reintroduce EGP for Egyptian-pound course pricing (USD remains default elsewhere).

ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'EGP';