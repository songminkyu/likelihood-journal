#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Server setup
const server = new Server(
  {
    name: "counting-chars-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Schema definitions
const CountCharsArgsSchema = z.object({
  text: z.string().describe('The source text to analyze'),
  search: z.string().describe('The character or substring to count occurrences of'),
  caseSensitive: z.boolean().default(true).describe('Whether to perform case-sensitive matching'),
});

const CountWordsArgsSchema = z.object({
  text: z.string().describe('The source text to analyze'),
  search: z.string().describe('The word to count occurrences of'),
  caseSensitive: z.boolean().default(true).describe('Whether to perform case-sensitive matching'),
  exactMatch: z.boolean().default(true).describe('Whether to match whole words only'),
});

const GetTextStatsArgsSchema = z.object({
  text: z.string().describe('The source text to analyze'),
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Tool implementations
function countCharOccurrences(text: string, search: string, caseSensitive: boolean): number {
  if (!caseSensitive) {
    text = text.toLowerCase();
    search = search.toLowerCase();
  }
  
  if (search.length === 0) {
    return 0;
  }
  
  // For single characters, we can use split technique which is efficient
  if (search.length === 1) {
    return text.split(search).length - 1;
  }
  
  // For longer substrings, we count overlapping matches
  let count = 0;
  let position = 0;
  
  while ((position = text.indexOf(search, position)) !== -1) {
    count++;
    position += 1; // Move position by 1 to allow for overlapping matches
  }
  
  return count;
}

function countWordOccurrences(text: string, word: string, caseSensitive: boolean, exactMatch: boolean): number {
  if (!caseSensitive) {
    text = text.toLowerCase();
    word = word.toLowerCase();
  }
  
  if (word.length === 0) {
    return 0;
  }
  
  if (exactMatch) {
    // Use regex with word boundaries to count exact word matches
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, caseSensitive ? 'g' : 'gi');
    const matches = text.match(pattern);
    return matches ? matches.length : 0;
  } else {
    // Count all occurrences including within words
    return countCharOccurrences(text, word, caseSensitive);
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
}

function getTextStatistics(text: string): {
  charCount: number;
  wordCount: number;
  lineCount: number;
  sentenceCount: number;
  paragraphCount: number;
} {
  // Character count (including spaces and special characters)
  const charCount = text.length;
  
  // Word count (simple split by whitespace and filter out empty strings)
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  // Line count (split by newline characters)
  const lineCount = text.split('\n').length;
  
  // Sentence count (simple heuristic: split by period, exclamation mark, or question mark)
  const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
  
  // Paragraph count (split by multiple newlines)
  const paragraphCount = text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length || 1;
  
  return {
    charCount,
    wordCount,
    lineCount,
    sentenceCount,
    paragraphCount
  };
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "count_chars",
        description: 
          "Count the number of occurrences of a specific character or substring within a text. " +
          "This tool supports both case-sensitive and case-insensitive matching. " +
          "It counts all instances of the substring, including overlapping occurrences.",
        inputSchema: zodToJsonSchema(CountCharsArgsSchema) as ToolInput,
      },
      {
        name: "count_words",
        description:
          "Count occurrences of a specific word within text. By default, performs exact word " +
          "matching (not counting the word if it appears as part of another word). " +
          "Supports both case-sensitive and case-insensitive matching. " +
          "Use 'exactMatch: false' to count all occurrences including within other words.",
        inputSchema: zodToJsonSchema(CountWordsArgsSchema) as ToolInput,
      },
      {
        name: "text_stats",
        description:
          "Analyze text to provide comprehensive statistics including character count, " +
          "word count, line count, sentence count, and paragraph count. " +
          "This gives a complete overview of the text's structure and composition.",
        inputSchema: zodToJsonSchema(GetTextStatsArgsSchema) as ToolInput,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "count_chars": {
        const parsed = CountCharsArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for count_chars: ${parsed.error}`);
        }
        
        const { text, search, caseSensitive } = parsed.data;
        const count = countCharOccurrences(text, search, caseSensitive);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({ 
              count, 
              text_length: text.length,
              search_term: search,
              case_sensitive: caseSensitive
            }, null, 2) 
          }],
        };
      }

      case "count_words": {
        const parsed = CountWordsArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for count_words: ${parsed.error}`);
        }
        
        const { text, search, caseSensitive, exactMatch } = parsed.data;
        const count = countWordOccurrences(text, search, caseSensitive, exactMatch);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({ 
              count, 
              text_length: text.length,
              search_term: search,
              case_sensitive: caseSensitive,
              exact_match: exactMatch
            }, null, 2) 
          }],
        };
      }

      case "text_stats": {
        const parsed = GetTextStatsArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for text_stats: ${parsed.error}`);
        }
        
        const { text } = parsed.data;
        const stats = getTextStatistics(text);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(stats, null, 2) 
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Counting Chars MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
