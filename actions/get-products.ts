"use server";

import { dodoClient } from "@/lib/dodopayments/client";
import type { ProductListResponse } from "dodopayments/resources/index.mjs";

export type ServerActionRes<T = undefined> = Promise<
  T extends undefined
    ? { success: true } | { success: false; error: string }
    : { success: true; data: T } | { success: false; error: string }
>;

/**
 * Get all products from DodoPayments
 * @returns ServerActionRes with products array
 */
export async function getProducts(): ServerActionRes<ProductListResponse[]> {
  try {
    const products = await dodoClient().products.list();
    return { success: true, data: products.items };
  } catch (error) {
    console.error('[getProducts] Error:', error);
    return { success: false, error: "Failed to fetch products" };
  }
}

