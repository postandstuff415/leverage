/**
 * Content Repurposer Logic
 * Uses Firecrawl for scraping and OpenAI for snippet generation.
 */

export interface RepurposerResult {
  linkedin_post: string;
  twitter_thread: string;
  email_subject: string;
}

export async function repurposeContent(
  url?: string,
  transcript?: string,
): Promise<RepurposerResult> {
  let content = "";

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Scrape content if URL is provided
  if (url) {
    if (!firecrawlKey) {
      console.warn("[Leverage] FIRECRAWL_API_KEY not set. Cannot scrape URL.");
      content = "[MOCK CONTENT FROM " + url + "]\nThis is a simulated scrape result because FIRECRAWL_API_KEY is missing. In a real scenario, this would contain the Markdown content of the page.";
    } else {
      try {
        const response = await fetch("https://api.firecrawl.dev/v0/scrape", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + firecrawlKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });

        if (response.ok) {
          const json = await response.json() as any;
          content = json.data?.markdown || json.markdown || "";
        } else {
          console.error("Firecrawl error: " + response.status + " " + response.statusText);
          content = "Error scraping URL: " + response.statusText;
        }
      } catch (err) {
        console.error("Failed to call Firecrawl:", err);
        content = "Error calling Firecrawl: " + (err instanceof Error ? err.message : "Unknown error");
      }
    }
  } else if (transcript) {
    content = transcript;
  } else {
    throw new Error("Either 'url' or 'transcript' must be provided.");
  }

  // 2. Generate snippets using OpenAI
  if (!openaiKey) {
    console.warn("[Leverage] OPENAI_API_KEY not set. Returning mock snippets.");
    return mockRepurposerFallback(content);
  }

  try {
    const prompt = "You are an expert content strategist. Repurpose the following content into three formats:\n1. A LinkedIn thought-leadership post (engaging, professional, formatted with emojis).\n2. A Twitter (X) thread (5-7 tweets, numbered, hook-driven).\n3. An engaging email subject line.\n\nCONTENT:\n" + content.substring(0, 6000) + "\n\nReturn your response in exactly this JSON format:\n{\n  \"linkedin_post\": \"...\",\n  \"twitter_thread\": \"...\",\n  \"email_subject\": \"...\"\n}";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + openaiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant that outputs JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI error: " + response.status + " " + response.statusText);
    }

    const json = await response.json() as any;
    const result = JSON.parse(json.choices[0].message.content);

    return {
      linkedin_post: result.linkedin_post || "",
      twitter_thread: result.twitter_thread || "",
      email_subject: result.email_subject || "",
    };
  } catch (err) {
    console.error("Failed to call OpenAI:", err);
    return mockRepurposerFallback(content);
  }
}

function mockRepurposerFallback(content: string): RepurposerResult {
  const summary = content.substring(0, 100) + "...";
  return {
    linkedin_post: "🚀 Repurposed from content: " + summary + "\n\nI just read something fascinating about this topic. The key takeaway is that innovation never stops. #Growth #Innovation",
    twitter_thread: "1/ I just analyzed this content: " + summary + "\n\n2/ Here are 3 things I learned...\n\n3/ First, consistency is key.\n\n4/ Second, always keep learning.\n\n5/ Third, share your knowledge!\n\n6/ What do you think? 👇",
    email_subject: "New insights on " + summary.substring(0, 20),
  };
}
