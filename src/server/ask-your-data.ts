/**
 * Server-side LLM-to-SQL engine for the "Ask Your Data" tool.
 *
 * Given a CSV schema + sample rows + a natural language query,
 * generates a DuckDB-compatible SQL query using OpenAI.
 */

import { createServerFn } from "@tanstack/react-start";
import { getToolById } from "~/config/tools";

// ── Types ────────────────────────────────────────────────────────

export interface AskYourDataInput {
  schema: { name: string; type: string }[];
  sampleRows: Record<string, string>[];
  userQuery: string;
}

export interface AskYourDataResult {
  success: boolean;
  sql?: string;
  error?: string;
}

// ── CSV Schema Extraction (server-side from URL) ─────────────────

export interface CsvSchemaResult {
  success: boolean;
  schema: { name: string; type: string }[];
  sampleRows: Record<string, string>[];
  error?: string;
}

/**
 * Fetches a CSV from a URL and returns its schema + sample rows.
 */
export const extractCsvSchema = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { url: string })
  .handler(async (ctx) => {
    const { url } = ctx.data;

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        return {
          success: false,
          schema: [],
          sampleRows: [],
          error: `Failed to fetch CSV: HTTP ${response.status}`,
        } satisfies CsvSchemaResult;
      }

      const text = await response.text();
      const lines = text.split("\n").filter((l) => l.trim().length > 0);

      if (lines.length < 2) {
        return {
          success: false,
          schema: [],
          sampleRows: [],
          error: "CSV must have a header row and at least one data row",
        } satisfies CsvSchemaResult;
      }

      // Parse header
      const headers = parseCsvLine(lines[0]);
      if (headers.length === 0) {
        return {
          success: false,
          schema: [],
          sampleRows: [],
          error: "CSV has no valid headers",
        } satisfies CsvSchemaResult;
      }

      // Parse data rows (up to 5 for sample)
      const dataRows: string[][] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        dataRows.push(parseCsvLine(lines[i]));
      }

      // Infer types from sample rows
      const schema = headers.map((header, colIdx) => {
        const values = dataRows
          .map((row) => row[colIdx]?.trim() ?? "")
          .filter((v) => v.length > 0);
        return {
          name: header,
          type: inferType(values),
        };
      });

      // Build sample rows as key-value objects
      const sampleRows = dataRows.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i]?.trim() ?? "";
        });
        return obj;
      });

      return {
        success: true,
        schema,
        sampleRows,
      } satisfies CsvSchemaResult;
    } catch (err) {
      return {
        success: false,
        schema: [],
        sampleRows: [],
        error: `Error fetching/parsing CSV: ${err instanceof Error ? err.message : "Unknown error"}`,
      } satisfies CsvSchemaResult;
    }
  });

/**
 * LLM-to-SQL: generates DuckDB SQL from user query + schema.
 */
export const generateSql = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as AskYourDataInput)
  .handler(async (ctx) => {
    const { schema, sampleRows, userQuery } = ctx.data;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback: generate a simple SELECT query from the schema
      const colNames = schema.map((s) => `"${s.name}"`).join(", ");
      return {
        success: true,
        sql: `SELECT ${colNames} FROM 'data.csv' LIMIT 100`,
      } satisfies AskYourDataResult;
    }

    const schemaJson = JSON.stringify(schema, null, 2);
    const sampleJson = JSON.stringify(sampleRows, null, 2);

    const prompt = `You are a DuckDB SQL expert. Convert the user's question into a single valid DuckDB SQL query.

Table Name: 'data.csv'
Schema (column name → inferred type):
${schemaJson}

Sample Data (first ${sampleRows.length} rows):
${sampleJson}

User Question: "${userQuery}"

Instructions:
- Use ONLY DuckDB-compatible SQL syntax.
- For date string comparisons, use the strptime() function: strptime(column_name, '%Y-%m-%d')
- Use double quotes for column names with spaces or special characters.
- Return ONLY the SQL code block wrapped in \`\`\`sql ... \`\`\`.
- The query MUST be a single SELECT statement.
- If the question asks for aggregation (SUM, COUNT, AVG, etc.), include appropriate GROUP BY.
- If the user asks about time trends, use strptime() for date parsing.`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a DuckDB SQL expert. You generate precise SQL queries from natural language questions. You always respond with a valid SQL code block.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 500,
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );

      if (!response.ok) {
        const errBody = await response.text().catch(() => "Unknown");
        return {
          success: false,
          error: `OpenAI API error (${response.status}): ${errBody.slice(0, 200)}`,
        } satisfies AskYourDataResult;
      }

      const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content ?? "";

      // Extract SQL from code block
      const sqlMatch = content.match(/```sql\s*([\s\S]*?)```/);
      const sql = sqlMatch
        ? sqlMatch[1].trim()
        : content.trim();

      if (!sql || sql.length === 0) {
        return {
          success: false,
          error: "LLM returned empty SQL query",
        } satisfies AskYourDataResult;
      }

      return {
        success: true,
        sql,
      } satisfies AskYourDataResult;
    } catch (err) {
      return {
        success: false,
        error: `LLM call failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      } satisfies AskYourDataResult;
    }
  });

// ── Helpers ──────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function inferType(values: string[]): string {
  // Check for integers
  if (values.every((v) => /^-?\d+$/.test(v))) return "INTEGER";
  // Check for decimals
  if (values.every((v) => /^-?\d+\.?\d*$/.test(v))) return "FLOAT";
  // Check for dates
  if (
    values.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v))
  )
    return "DATE";
  // Default
  return "VARCHAR";
}