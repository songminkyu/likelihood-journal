# Counting Chars MCP Server

Node.js server implementing Model Context Protocol (MCP) for text analysis operations.

## Features

- Count character/substring occurrences in text
- Count word occurrences with exact or partial matching
- Generate comprehensive text statistics
- Support for case-sensitive and case-insensitive matching

## API

### Tools

- **count_chars**
  - Count occurrences of a character or substring in text
  - Inputs:
    - `text` (string): Source text to analyze
    - `search` (string): Character or substring to count
    - `caseSensitive` (boolean, default: true): Whether to perform case-sensitive matching
  - Returns JSON with count and search parameters

- **count_words**
  - Count occurrences of a specific word
  - Inputs:
    - `text` (string): Source text to analyze
    - `search` (string): Word to count
    - `caseSensitive` (boolean, default: true): Whether to perform case-sensitive matching
    - `exactMatch` (boolean, default: true): Whether to match whole words only
  - Returns JSON with count and search parameters

- **text_stats**
  - Generate comprehensive text statistics
  - Input:
    - `text` (string): Source text to analyze
  - Returns:
    - `charCount`: Total character count
    - `wordCount`: Total word count
    - `lineCount`: Number of lines
    - `sentenceCount`: Estimated number of sentences
    - `paragraphCount`: Number of paragraphs

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

### Docker

```json
{
  "mcpServers": {
    "counting-chars": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "mcp/counting-chars"
      ]
    }
  }
}
```

### NPX

```json
{
  "mcpServers": {
    "counting-chars": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-counting-chars"
      ]
    }
  }
}
```

## Example Usage

### Counting Character Occurrences

```json
{
  "text": "Hello world! This is a simple example.",
  "search": "l",
  "caseSensitive": true
}
```

Returns:
```json
{
  "count": 3,
  "text_length": 38,
  "search_term": "l",
  "case_sensitive": true
}
```

### Counting Word Occurrences

```json
{
  "text": "The quick brown fox jumps over the lazy dog. The fox is quick.",
  "search": "the",
  "caseSensitive": false,
  "exactMatch": true
}
```

Returns:
```json
{
  "count": 2,
  "text_length": 60,
  "search_term": "the",
  "case_sensitive": false,
  "exact_match": true
}
```

### Getting Text Statistics

```json
{
  "text": "Hello world! This is a simple example.\n\nMultiple paragraphs are supported."
}
```

Returns:
```json
{
  "charCount": 73,
  "wordCount": 11,
  "lineCount": 3,
  "sentenceCount": 2,
  "paragraphCount": 2
}
```

## Build

Docker build:

```bash
docker build -t mcp/counting-chars .
```

Node.js build:

```bash
npm install
npm run build
```

## License

This MCP server is licensed under the MIT License.
