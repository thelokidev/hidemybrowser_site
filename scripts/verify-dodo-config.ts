#!/usr/bin/env tsx
/**
 * Dodo Payments Configuration Verification Script
 * 
 * This script helps diagnose configuration issues with Dodo Payments
 * Run this after updating environment variables in Vercel
 */

import DodoPayments from "dodopayments";

async function verifyConfiguration() {
  console.log("🔍 Verifying Dodo Payments Configuration...\n");

  // Check environment variables
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT as "live_mode" | "test_mode" | undefined;
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

  console.log("📋 Environment Variables:");
  console.log(`  ✓ DODO_PAYMENTS_API_KEY: ${apiKey ? `${apiKey.substring(0, 15)}...` : '❌ MISSING'}`);
  console.log(`  ✓ DODO_PAYMENTS_ENVIRONMENT: ${environment || '❌ MISSING'}`);
  console.log(`  ✓ DODO_WEBHOOK_SECRET: ${webhookSecret ? '✓ Present' : '❌ MISSING'}`);
  console.log();

  // Validate API key
  if (!apiKey) {
    console.error("❌ Error: DODO_PAYMENTS_API_KEY is not set");
    process.exit(1);
  }

  // Check API key format
  const isTestKey = apiKey.startsWith('dp_test_');
  const isLiveKey = apiKey.startsWith('dp_live_');
  
  console.log("🔑 API Key Validation:");
  console.log(`  Format: ${isTestKey ? 'Test mode key' : isLiveKey ? 'Live mode key' : '❌ Unknown format'}`);
  
  if (environment === 'test_mode' && !isTestKey) {
    console.warn("⚠️  Warning: Environment is test_mode but API key doesn't start with dp_test_");
  }
  
  if (environment === 'live_mode' && !isLiveKey) {
    console.warn("⚠️  Warning: Environment is live_mode but API key doesn't start with dp_live_");
  }
  console.log();

  // Try to initialize client
  console.log("🔧 Initializing DodoPayments Client...");
  let client: DodoPayments;
  
  try {
    client = new DodoPayments({
      bearerToken: apiKey,
      environment: environment || 'test_mode',
    });
    console.log("  ✓ Client initialized successfully");
  } catch (error) {
    console.error("  ❌ Failed to initialize client:", error);
    process.exit(1);
  }
  console.log();

  // Try to fetch products
  console.log("📦 Fetching Products...");
  try {
    const products = await client.products.list();
    console.log(`  ✓ Found ${products.length} products`);
    
    if (products.length > 0) {
      console.log("\n  Available Products:");
      products.forEach((product: any) => {
        console.log(`    - ${product.name || product.product_id}: ${product.product_id}`);
      });
    } else {
      console.log("  ⚠️  No products found. Create products in DodoPayments dashboard.");
    }
  } catch (error: any) {
    console.error("  ❌ Failed to fetch products:", error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error("\n💡 Tip: Check if your API key is valid and has the correct permissions");
    }
    
    if (error.message.includes('Product does not exist')) {
      console.error("\n💡 Tip: Verify product IDs in your code match products in DodoPayments dashboard");
    }
  }
  console.log();

  // Expected product IDs from code
  const expectedProducts = [
    'pdt_v0slst9k4JI0Q2qUDkIAW', // Weekly
    'pdt_ugqyKXMT219386BcoejVN', // Monthly
    'pdt_W4YuF093U2MSpABbJ7miA', // 3 Months
    'pdt_Ah7DRDitJbvGcaFMrqrOf', // 6 Months
  ];

  console.log("🎯 Expected Product IDs (from code):");
  expectedProducts.forEach(id => console.log(`    - ${id}`));
  console.log();

  // Summary
  console.log("📊 Summary:");
  console.log("  ✓ Configuration check complete");
  console.log("\n💡 Next Steps:");
  console.log("  1. If products are missing, create them in DodoPayments dashboard");
  console.log("  2. If API key format doesn't match environment, update the appropriate variable");
  console.log("  3. Update product IDs in code if they don't match dashboard");
  console.log("  4. Redeploy application after making changes");
}

// Run verification
verifyConfiguration().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

