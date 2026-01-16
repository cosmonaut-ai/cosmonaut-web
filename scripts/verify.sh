#!/bin/bash
# Comprehensive verification script for the project
# Run this before committing to catch all errors

set -e

echo "🔍 Running comprehensive verification..."
echo ""

echo "📝 Step 1: Formatting code..."
npm run format
echo "✅ Formatting complete"
echo ""

echo "🔎 Step 2: Checking Svelte files with svelte-check..."
npx svelte-check --tsconfig ./tsconfig.json
echo "✅ Svelte check complete"
echo ""

echo "🔧 Step 3: Running ESLint..."
npm run lint -- --fix
echo "✅ Linting complete"
echo ""

echo "🏗️  Step 4: Building project..."
npm run build
echo "✅ Build complete"
echo ""

echo "✨ All checks passed! Ready to commit."
