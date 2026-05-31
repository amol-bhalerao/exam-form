#!/bin/bash
# Deployment script to sync production database schema with Prisma schema
# Run this after code is deployed to production

npx prisma db push --accept-data-loss
