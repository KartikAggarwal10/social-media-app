import { streamText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export const runtime = "nodejs";

// Groq OpenAI-compatible Client
const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
console.log("step 1")
// Tools definition: Web Search & Image Search
const tools = {
  webSearch: tool({
    description: "Search the live web for current facts, news, references, and statistics.",
    inputSchema: z.object({
      query: z.string().describe("The search query to look up on the web"),
    }),
    execute: async ({ query }) => {
      try {
        if (!process.env.TAVILY_API_KEY) {
          return { error: "TAVILY_API_KEY is not configured." };
        }

        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query,
            search_depth: "basic",
            include_answer: true,
            max_results: 5,
          }),
        });

        if (!response.ok) {
          throw new Error(`Tavily error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          answer: data.answer || "No direct answer found",
          results:
            data.results?.map((r) => ({
              title: r.title,
              url: r.url,
              content: r.content,
            })) || [],
          query,
        };
      } catch (error) {
        return { error: "Web search failed", message: error.message };
      }
    },
  }),

  imageSearch: tool({
    description: "Search for high quality royalty-free photos from the internet to illustrate post content.",
    inputSchema: z.object({
      query: z.string().describe("Topic or keyword for images to find (e.g. 'artificial intelligence', 'mountains')"),
    }),
    execute: async ({ query }) => {
      try {
        // Search Unsplash Source or Wikimedia Open API
        const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
        if (unsplashAccessKey) {
          const res = await fetch(
            `https://api.unsplash.com/search/photos?page=1&per_page=6&query=${encodeURIComponent(query)}&client_id=${unsplashAccessKey}`
          );
          if (res.ok) {
            const data = await res.json();
            return {
              images: data.results.map((img) => ({
                title: img.alt_description || query,
                url: img.urls.regular,
                thumb: img.urls.small,
                author: img.user.name,
              })),
            };
          }
        }

        // Fallback search via Open Wikimedia API (Requires no API key)
        const wikiRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=imageinfo&iiprop=url&format=json`
        );
        const wikiData = await wikiRes.json();
        const pages = wikiData?.query?.pages || {};
        const images = Object.values(pages)
          .map((p) => ({
            title: p.title?.replace("File:", "") || query,
            url: p.imageinfo?.[0]?.url,
            thumb: p.imageinfo?.[0]?.url,
          }))
          .filter((img) => img.url && (img.url.endsWith(".jpg") || img.url.endsWith(".png") || img.url.endsWith(".jpeg")));

        return { images: images.slice(0, 6), query };
      } catch (error) {
        return { error: "Image search failed", message: error.message };
      }
    },
  }),
};

export async function POST(req) {
  try {
    const { messages, action, imageQuery } = await req.json();
console.log("step 2")
    // Direct Image Search API handling (if requested directly by client)
    if (action === "find_images") {
      const query = imageQuery || "technology";
      const result = await tools.imageSearch.execute({ query });
      return Response.json(result);
    }

  console.log("BODY:", JSON.stringify(messages, null, 2));
    // Context from post
    const postContext = messages[0]?.metadata?.prompt || "General post assistant";
    const modelMessages = messages.map((message)=>({
      role : message.role,
      content : message.content
    }))
    const result = streamText({
  model: groq("openai/gpt-oss-120b"),

  instructions: `You are an expert AI Writing & Research Assistant for a modern blogging/social publishing platform.

Your job is to assist the author with creating, polishing, and researching blog posts.

CURRENT POST CONTEXT:
${postContext}

Guidelines:
1. Base your suggestions and enhancements on the author's current post context.
2. When the user asks for current news, facts, recent dates, or external information, call the webSearch tool.
3. When the user asks for photos or illustrations, call the imageSearch tool.
4. Format written content in clean Markdown or HTML paragraphs that can be directly pasted into a rich text editor.
5. Be concise, engaging, and provide structured outlines and headings.
6. Keep generated content relevant to the current post.
7. Consider the existing content before suggesting new content.`,

  messages: modelMessages,

  tools,

  maxSteps: 5,
});

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("ChatBot API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
