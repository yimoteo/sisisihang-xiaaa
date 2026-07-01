import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const PORT = 3000;

// Initialize the Google Gen AI client with appropriate telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();

  // Increase payload limits to safely transfer base64 room photos
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // Helper to extract base64 data cleanly (stripping prefix if present)
  function cleanBase64(base64Str: string): { mimeType: string; data: string } {
    const match = base64Str.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
    return { mimeType: "image/jpeg", data: base64Str };
  }

  // API 1: Generate original room makeover
  app.post("/api/design/makeover", async (req, res) => {
    try {
      const { image, style, customInstructions } = req.body;

      if (!image) {
        return res.status(400).json({ error: "No image provided." });
      }
      if (!style) {
        return res.status(400).json({ error: "No design style selected." });
      }

      console.log(`[Makeover] Processing style change to: ${style}`);

      const { mimeType, data: base64Data } = cleanBase64(image);

      // Prompt optimized for interior design makeover
      const textPrompt = `Reimagine this room photo in a pristine "${style}" interior design style.
- You MUST preserve the absolute structural architecture, wall placements, windows, doors, and general perspective of the room. It should look like the exact same room, but fully renovated/makeovered.
- Completely replace and redesign all furniture, decorations, color palette, lighting fixtures, plants, rugs, and accessories.
- Eliminate any clutter from the original photo and make it look professionally staged.
- Output a single photorealistic, high-resolution, beautifully lit, luxury-tier interior design photograph representing the Scandinavian, Boho, or specified ${style} theme.
${customInstructions ? `- Incorporate these additional user styling directions: ${customInstructions}` : ""}`;

      // Call the image generation/editing model specified by the instructions
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: textPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "4:3",
            imageSize: "1K",
          },
        },
      });

      let generatedImageUrl: string | null = null;
      let textFeedback = "";

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            textFeedback += part.text;
          }
        }
      }

      if (!generatedImageUrl) {
        // Fallback or error if no image returned
        throw new Error("No image was returned by the AI. Check API key status or safety settings.");
      }

      res.json({
        success: true,
        image: generatedImageUrl,
        feedback: textFeedback || "Makeover completed successfully!",
      });
    } catch (error: any) {
      console.error("[Makeover Error]:", error);
      res.status(500).json({
        error: error.message || "Failed to generate room makeover.",
      });
    }
  });

  // API 2: Context-aware interactive designer chat
  app.post("/api/design/chat", async (req, res) => {
    try {
      const { message, history, currentImage, originalImage, style } = req.body;

      if (!message) {
        return res.status(400).json({ error: "No message provided." });
      }

      console.log(`[Chat] User message: "${message}" inside style: ${style}`);

      // Prepare multimodal parts for the Gemini chatbot.
      // We send the current (reimagined) room image so the designer can inspect it.
      const contentsParts: any[] = [];

      // Add original room and current room context to the user message or context
      if (originalImage) {
        const { mimeType: origMime, data: origData } = cleanBase64(originalImage);
        contentsParts.push({
          inlineData: { data: origData, mimeType: origMime },
        });
        contentsParts.push({
          text: "[Original Room Photo Uploaded by User for Reference]",
        });
      }

      if (currentImage) {
        const { mimeType: currMime, data: currData } = cleanBase64(currentImage);
        contentsParts.push({
          inlineData: { data: currData, mimeType: currMime },
        });
        contentsParts.push({
          text: "[Current Reimagined Room Design that the User is Looking At]",
        });
      }

      // Add previous chat history in structured format to guide context (optional, we can condense it)
      if (history && history.length > 0) {
        const historyText = history
          .map((msg: any) => `${msg.role === "user" ? "User" : "Designer"}: ${msg.text}`)
          .join("\n");
        contentsParts.push({
          text: `[Chat History for Context]:\n${historyText}`,
        });
      }

      // Finally, add the current user message
      contentsParts.push({
        text: `User request: ${message}`,
      });

      // We use gemini-3.5-flash for the fast, highly capable multimodal chat
      const chatResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsParts,
        config: {
          systemInstruction: `You are Atelier AI, an elite, warm, and highly sophisticated interior design consultant.
The user is viewing their room redesigned in the "${style}" style (shown in the attached images).
Your goal is to answer their design questions, suggest modifications, explain design principles, and provide 2-3 specific, realistic, and shoppable items that would perfectly complement this space.

Review the original room structure and the current reimagined room carefully.
Always provide a highly structured JSON response with the following fields:
1. "reply": A friendly, expert, and conversational reply addressing their message, describing how the changes make the space feel, and answering design questions. Keep the tone refined and professional.
2. "shoppableItems": An array of 2 to 3 product recommendations. For each item:
   - "name": Product Name (e.g., "Sleek Oak Tripod Floor Lamp")
   - "category": e.g., "Lighting", "Rug", "Seating", "Table", "Plants", "Wall Art"
   - "price": e.g., "$149" or "$320" (estimated realistic price)
   - "brand": e.g., "West Elm", "Article", "IKEA", "Wayfair"
   - "description": Why this fits the current design and where to place it.
   - "link": A search URL, specifically formatted as: "https://www.google.com/search?tbm=shop&q=" + encodeURIComponent(name + " " + brand)
3. "shouldUpdateImage": Set to TRUE if the user is asking to visually change the room (e.g., "make the rug blue", "add a plant", "swap the chair for a leather recliner", "change wall colors", "add more lights", "replace coffee table"). Set to FALSE if they are just asking general design questions or chatting.
4. "imagePrompt": Only needed if shouldUpdateImage is true. Write a precise, descriptive visual editing prompt (for a base64 image-to-image generator) detailing exactly what to change while maintaining everything else (e.g., "Change the existing floor rug to a bright blue vintage wool rug with geometric patterns, while leaving the sofa, coffee table, walls, and lighting completely identical.").`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              shoppableItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    price: { type: Type.STRING },
                    brand: { type: Type.STRING },
                    description: { type: Type.STRING },
                    link: { type: Type.STRING },
                  },
                  required: ["name", "category", "price", "brand", "description", "link"],
                },
              },
              shouldUpdateImage: { type: Type.BOOLEAN },
              imagePrompt: { type: Type.STRING },
            },
            required: ["reply", "shoppableItems", "shouldUpdateImage"],
          },
        },
      });

      let parsedData: any = {
        reply: "I'd love to help you style this room further. What changes are you thinking of?",
        shoppableItems: [],
        shouldUpdateImage: false,
      };

      try {
        if (chatResponse.text) {
          parsedData = JSON.parse(chatResponse.text.trim());
        }
      } catch (err) {
        console.error("Failed to parse JSON schema response:", err, chatResponse.text);
        parsedData.reply = chatResponse.text || parsedData.reply;
      }

      let updatedImageUrl: string | null = null;

      // If the model indicated we need to edit/update the image, trigger the image generator
      if (parsedData.shouldUpdateImage && parsedData.imagePrompt && currentImage) {
        console.log(`[Chat Image Update] Triggering image edit with prompt: "${parsedData.imagePrompt}"`);
        const { mimeType: currMime, data: currData } = cleanBase64(currentImage);

        try {
          const editResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-image-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    data: currData,
                    mimeType: currMime,
                  },
                },
                {
                  text: `Apply this modification to the room: ${parsedData.imagePrompt}. Ensure the rest of the room layout, perspective, and furniture remain identical. High quality, realistic design photograph.`,
                },
              ],
            },
            config: {
              imageConfig: {
                aspectRatio: "4:3",
                imageSize: "1K",
              },
            },
          });

          if (editResponse.candidates?.[0]?.content?.parts) {
            for (const part of editResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                updatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }
          }
        } catch (editErr) {
          console.error("Error editing image during chat:", editErr);
          // Don't crash the whole response if image edit fails; just return the text chat
        }
      }

      res.json({
        success: true,
        reply: parsedData.reply,
        shoppableItems: parsedData.shoppableItems,
        updatedImage: updatedImageUrl, // Will be returned if an image edit was processed successfully
      });
    } catch (error: any) {
      console.error("[Chat Error]:", error);
      res.status(500).json({
        error: error.message || "Failed to process chat response.",
      });
    }
  });

  // Serve static UI assets and handle single-page fallback
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
