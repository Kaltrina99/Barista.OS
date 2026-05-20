/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoldItem, ProductInfo } from "../types";

async function fetchGemini(endpoint: string, base64Image: string, mimeType: string) {
  // Extract base64 part if it's a data URL
  const data = base64Image.split(',')[1] || base64Image;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: data, mimeType })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'AI analysis failed');
  }

  return response.json();
}

export async function analyzeSalesPhoto(base64Image: string, mimeType: string): Promise<SoldItem[]> {
  try {
    return await fetchGemini("/api/gemini/analyze-sales", base64Image, mimeType);
  } catch (error) {
    console.error("Error analyzing sales photo:", error);
    throw new Error("Failed to analyze sales photo. Please try again.");
  }
}

export async function analyzeRestockPhoto(base64Image: string, mimeType: string): Promise<SoldItem[]> {
  try {
    return await fetchGemini("/api/gemini/analyze-restock", base64Image, mimeType);
  } catch (error) {
    console.error("Error analyzing restock photo:", error);
    throw new Error("Failed to analyze restock photo. Please try again.");
  }
}

export async function identifyProduct(base64Image: string, mimeType: string): Promise<ProductInfo> {
  try {
    return await fetchGemini("/api/gemini/identify", base64Image, mimeType);
  } catch (error) {
    console.error("Error identifying product:", error);
    throw new Error("Failed to identify product. Please try again.");
  }
}
