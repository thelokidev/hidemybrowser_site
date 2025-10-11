"use server";

import { dodoClient } from "@/lib/dodopayments/client";
import type { Customer } from "dodopayments/resources/index.mjs";

export type ServerActionRes<T = undefined> = Promise<
  T extends undefined
    ? { success: true } | { success: false; error: string }
    : { success: true; data: T } | { success: false; error: string }
>;

/**
 * Create a DodoPayments customer
 * @param props Customer data
 * @returns ServerActionRes with customer data
 */
export async function createDodoCustomer(props: {
  email: string;
  name?: string;
}): ServerActionRes<Customer> {
  try {
    const customer = await dodoClient().customers.create({
      email: props.email,
      name: props.name ? props.name : props.email.split("@")[0],
    });

    return { success: true, data: customer };
  } catch (error) {
    console.error('[createDodoCustomer] Error:', error);
    return { success: false, error: "Failed to create customer" };
  }
}

