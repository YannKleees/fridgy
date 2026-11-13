import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Step 1: OCR - Extract raw text from the image
    console.log("Step 1: Starting OCR extraction...");
    const ocrResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an OCR assistant specialized in extracting text from receipts, shopping lists, and grocery images.You must respond in english although the text might be a different language. Take out the branding names if their are any.
            
Extract ALL visible text from the image exactly as it appears. Include:
- Item names and descriptions
- Prices and quantities
- Any numbers, codes, or abbreviations
- Store names, dates, and other metadata

Preserve the layout structure where possible (use newlines to separate lines).
Return ONLY the extracted text, nothing else. No explanations or formatting.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
              {
                type: "text",
                text: "Extract all text from this receipt, shopping list, or grocery image.",
              },
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      console.error("OCR step error:", errorText);
      throw new Error(`OCR step failed: ${ocrResponse.status}`);
    }

    const ocrResult = await ocrResponse.json();
    const extractedText = ocrResult.choices?.[0]?.message?.content || "";

    console.log("OCR extracted text length:", extractedText.length);
    console.log("OCR extracted text preview:", extractedText.substring(0, 200));

    // Check if OCR returned meaningful text
    if (!extractedText || extractedText.trim().length < 10) {
      console.log("OCR returned insufficient text, falling back to direct parsing...");
      return await directImageParsing(image, apiKey);
    }

    // Step 2: Parse - Send extracted text as JSON for structured extraction
    console.log("Step 2: Starting structured parsing...");
    const parseResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Extract grocery items from receipt/shopping-list TEXT and return ONLY valid JSON:
{"items":[{"name":string,"quantity":number,"category":string,"price":number|null}],"total":number|null}

Categories: dairy, meat, vegetables, fruits, beverages, condiments, leftovers, other.

Naming rules:
- English, lowercase, short and consistent.
- Prefer generic item names: "tomato", "tomato paste", "milk", "bread".
- Remove producer/store/brand names and marketing words (e.g., "johnny's", "farm", "premium", "bio", "fresh").
- Keep brand ONLY when it is the product identity (mostly packaged drinks/snacks), e.g. "coca-cola zero", "red bull". So try to remove the brand if not needed so that if you have 6 apples you don't see 3 apples from this and three apples from a different brand they are just apples
- Keep type words only when they change the base item class (tomato vs tomato paste, apple vs apple juice).

Rules:
- Only include food/grocery items; skip non-food, deposits (Pfand), coupons.
- Quantity: integer, default 1 if unclear.
- Price: item price if clearly tied to that item, else null.
- Total: receipt total if clearly present, else null.
Return JSON only.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              type: "receipt_text",
              extracted_text: extractedText,
              instruction:
                "Parse this receipt/shopping list text and extract all food/grocery items with prices as JSON.",
            }),
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error("Parse step error:", errorText);
      throw new Error(`Parse step failed: ${parseResponse.status}`);
    }

    const parseResult = await parseResponse.json();
    const content = parseResult.choices?.[0]?.message?.content || "[]";

    // Parse the JSON from the response
    let items = [];
    let total = null;
    try {
      // Try to extract JSON object from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        items = parsed.items || [];
        total = parsed.total || null;
      } else {
        // Fallback: try array format
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          items = JSON.parse(arrayMatch[0]);
        }
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      items = [];
    }

    console.log("Parsed items count:", items.length);
    console.log("Parsed total:", total);

    return new Response(
      JSON.stringify({
        items,
        total,
        method: "ocr+parse",
        ocrTextLength: extractedText.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in scan-recipe:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Fallback: Direct image parsing (original method)
async function directImageParsing(image: string, apiKey: string) {
  console.log("Using direct image parsing fallback...");

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are an assistant that extracts grocery/food items from images. 
The image could be a recipe, a shopping list, a receipt, or a photo of groceries.

Extract all identifiable food items and return a JSON object with:
1. "items": an array of items, each with:
   - name: the name of the item (string)
   - quantity: the count of items (integer, default to 1 if unclear)
   - category: one of "dairy", "meat", "vegetables", "fruits", "beverages", "condiments", "leftovers", "other"
   - price: the price if visible (number, or null if not found)
2. "total": the total amount from the receipt if visible (number, or null if not found)

Quantity should always be a whole number (round if needed).
Only return valid JSON, no other text. Example:
{"items": [{"name": "Milk", "quantity": 1, "category": "dairy", "price": 2.99}], "total": 15.50}`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
              },
            },
            {
              type: "text",
              text: "Please extract all food/grocery items with prices from this image and return them as JSON.",
            },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Direct parsing error:", errorText);
    throw new Error(`Direct parsing failed: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "[]";

  let items = [];
  let total = null;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      items = parsed.items || [];
      total = parsed.total || null;
    } else {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        items = JSON.parse(arrayMatch[0]);
      }
    }
  } catch (parseError) {
    console.error("Error parsing direct response:", parseError);
    items = [];
  }

  return new Response(
    JSON.stringify({
      items,
      total,
      method: "direct",
    }),
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Content-Type": "application/json",
      },
    },
  );
}
