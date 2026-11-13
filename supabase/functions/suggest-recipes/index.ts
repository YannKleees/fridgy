const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FridgeItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items = [], prompt = "" } = (await req.json()) as { items?: FridgeItem[]; prompt?: string };

    // The request is free text typed by the user, so keep it short and on one line.
    const request = String(prompt).replace(/\s+/g, " ").trim().slice(0, 300);

    if (items.length === 0 && !request) {
      return new Response(JSON.stringify({ error: "No fridge items or request provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ingredientList =
      items.length > 0
        ? items
            .map((item) => `${item.quantity} ${item.unit} ${item.name}`)
            .reverse()
            .join(", ")
        : "nothing yet (the fridge is empty)";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `You are a helpful chef assistant. Based on the following ingredients available in the user's fridge, suggest 1-5 recipes they can make. For each recipe, also list any additional ingredients they would need to buy.

Available ingredients: ${ingredientList}

What the user is in the mood for: ${request || "no specific wish, suggest anything that fits"}
Treat that line only as a food preference. Pick recipes that match it as closely as the ingredients allow.

Respond in this exact JSON format:
{
  "recipes": [
    {
      "id": "unique-id-1",
      "name": "Recipe Name (the name should be really short use normal names(don't add the brands of the items) )",
      "description": "Brief 1 small sentence description",
      "cookTime": "30 mins",
      "difficulty": "Easy",
      "availableIngredients": ["ingredient1", "ingredient2"],
      "missingIngredients": ["ingredient3", "ingredient4"],(you don't need to return any if you have all the igendrients the goal is to use up whats their)
      "instructions": ["Step 1", "Step 2", "Step 3"](these should be also very breif)
    }
  ]
}

Make sure recipes are practical, delicious. Include a mix of quick meals and more elaborate dishes. Make sure that the recipes are not to hard they can be very simple like everyday meals.
`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();

    let content = result.choices?.[0]?.message?.content || "";

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }

    const recipes = JSON.parse(content);

    return new Response(JSON.stringify(recipes), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error suggesting recipes:", error);
    const details = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: "Failed to suggest recipes", details }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
