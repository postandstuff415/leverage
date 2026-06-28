/**
 * Market Sentiment Analysis Service
 * Uses Alpha Vantage News Sentiment API to analyze market mood for a given topic.
 */

export interface SentimentResult {
  success: boolean;
  data: {
    market_mood: string;
    sentiment_score: number;
    top_articles: {
      title: string;
      url: string;
      summary: string;
      sentiment_label: string;
    }[];
  };
  error?: string;
  warning?: string;
}

const cache = new Map<string, { result: SentimentResult; timestamp: number }>();
const CACHE_TTL = 3600 * 1000; // 1 hour

const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

export async function performMarketSentimentAnalysis(topic: string): Promise<SentimentResult> {
  const normalizedTopic = topic.trim().toUpperCase();
  const now = Date.now();
  
  // Check cache
  const cached = cache.get(normalizedTopic);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`[Sentiment] Returning cached result for ${normalizedTopic}`);
    return cached.result;
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    console.warn("[Leverage] ALPHA_VANTAGE_API_KEY not set. Falling back to mock data.");
    const result: SentimentResult = {
      success: true,
      data: mockSentimentFallback(topic),
      warning: "Running in demo mode (no API key configured)",
    };
    return result;
  }

  const url = new URL(ALPHA_VANTAGE_BASE);
  url.searchParams.set("function", "NEWS_SENTIMENT");
  url.searchParams.set("topics", topic);
  url.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Alpha Vantage API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Handle Alpha Vantage information messages (often rate limits)
    if (data.Information || data.Note) {
      const msg = data.Information || data.Note;
      console.warn(`[Sentiment] Alpha Vantage notice: ${msg}`);
      const result: SentimentResult = { 
        success: true, 
        data: mockSentimentFallback(topic), 
        warning: `API limit reached or notice: ${msg.slice(0, 50)}...` 
      };
      return result;
    }

    if (data["Error Message"]) {
      console.error(`[Sentiment] Alpha Vantage error: ${data["Error Message"]}`);
      return { 
        success: false, 
        data: mockSentimentFallback(topic), 
        error: data["Error Message"] 
      };
    }

    const feed = data.feed || [];
    if (feed.length === 0) {
      return { 
        success: true, 
        data: mockSentimentFallback(topic), 
        warning: "No recent news found for this topic. Showing simulated data." 
      };
    }

    // Aggregate sentiment
    let totalScore = 0;
    feed.forEach((item: any) => {
      totalScore += item.overall_sentiment_score || 0;
    });
    const avgScore = totalScore / feed.length;

    let mood = "Neutral";
    if (avgScore > 0.35) mood = "Very Bullish";
    else if (avgScore > 0.15) mood = "Bullish";
    else if (avgScore < -0.35) mood = "Very Bearish";
    else if (avgScore < -0.15) mood = "Bearish";

    // Sort by relevance score descending
    const sortedFeed = [...feed].sort((a: any, b: any) => (b.relevance_score || 0) - (a.relevance_score || 0));

    const topArticles = sortedFeed.slice(0, 3).map((item: any) => ({
      title: item.title,
      url: item.url,
      summary: (item.summary || "").length > 200 ? item.summary.slice(0, 197) + "..." : item.summary,
      sentiment_label: item.overall_sentiment_label,
    }));

    const finalResult: SentimentResult = {
      success: true,
      data: {
        market_mood: mood,
        sentiment_score: parseFloat(avgScore.toFixed(2)),
        top_articles: topArticles,
      },
    };

    // Update cache
    cache.set(normalizedTopic, { result: finalResult, timestamp: now });
    
    return finalResult;
  } catch (err) {
    console.error(`[Sentiment] Fetch error: ${err}`);
    return {
      success: false,
      data: mockSentimentFallback(topic),
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function mockSentimentFallback(topic: string) {
  const scores = [0.42, 0.18, -0.05, -0.38, 0.08];
  const hash = topic.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score = scores[hash % scores.length];
  
  const mood = score > 0.35 ? "Very Bullish" : score > 0.15 ? "Bullish" : score < -0.35 ? "Very Bearish" : score < -0.15 ? "Bearish" : "Neutral";

  return {
    market_mood: mood,
    sentiment_score: score,
    top_articles: [
      {
        title: `Analyzing the Recent Trends in ${topic}`,
        url: "#",
        summary: `Market analysts are closely watching ${topic} as new data suggests a significant shift in institutional interest.`,
        sentiment_label: mood.includes("Bullish") ? "Bullish" : mood.includes("Bearish") ? "Bearish" : "Neutral",
      },
      {
        title: `${topic}: What Investors Need to Know Today`,
        url: "#",
        summary: `Global macro factors continue to influence ${topic}, with regional players showing mixed performance in the latest quarter.`,
        sentiment_label: "Neutral",
      },
      {
        title: `The Future of ${topic} in a High-Rate Environment`,
        url: "#",
        summary: `Experts discuss the long-term viability of ${topic} projects as capital costs rise across the industry.`,
        sentiment_label: score > 0 ? "Somewhat Bullish" : "Somewhat Bearish",
      }
    ]
  };
}
