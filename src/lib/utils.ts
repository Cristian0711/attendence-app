import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { init } from "@paralleldrive/cuid2";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(length: number = 16) {
  return init({ length })();
}