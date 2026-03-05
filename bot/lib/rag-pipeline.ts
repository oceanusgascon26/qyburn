/**
 * RAG Pipeline — Text-based retrieval-augmented generation
 *
 * Uses TF-IDF style keyword matching against the knowledge base.
 * No vector DB required — chunks are scored by keyword frequency,
 * exact phrase matches, and title relevance.
 */

import { getKnowledgeDocuments, type KnowledgeDocument } from "../../src/lib/mock-data";

// ─── Types ───────────────────────────────────────────────────

export interface KBChunk {
  id: string;
  title: string;
  content: string;
  category: string;
  relevanceScore?: number;
}

export interface RagResult {
  context: string;
  sources: { id: string; title: string; score: number }[];
}

// ─── In-memory chunk index ───────────────────────────────────

let chunkIndex: KBChunk[] = [];
let indexed = false;

// ─── Stop words to filter out of queries ─────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "out", "off", "over",
  "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "no", "not", "only", "own", "same",
  "so", "than", "too", "very", "just", "because", "but", "and", "or",
  "if", "while", "about", "up", "it", "its", "i", "me", "my", "we",
  "our", "you", "your", "he", "she", "they", "them", "what", "which",
  "who", "this", "that", "these", "those", "am",
]);

// ─── Chunking ────────────────────────────────────────────────

function splitIntoChunks(
  doc: KnowledgeDocument,
  chunkSize: number = 500,
  overlap: number = 50
): KBChunk[] {
  const text = doc.content;
  const chunks: KBChunk[] = [];

  if (text.length <= chunkSize) {
    chunks.push({
      id: `${doc.id}-0`,
      title: doc.title,
      content: text,
      category: doc.category ?? "General",
    });
    return chunks;
  }

  let start = 0;
  let chunkIdx = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.slice(start, end);
    chunks.push({
      id: `${doc.id}-${chunkIdx}`,
      title: doc.title,
      content: chunkText,
      category: doc.category ?? "General",
    });
    chunkIdx++;
    start += chunkSize - overlap;
  }

  return chunks;
}

// ─── Indexing ────────────────────────────────────────────────

/**
 * Read all knowledge base documents, split into chunks, store in memory.
 */
export function indexKnowledgeBase(): void {
  const docs = getKnowledgeDocuments();
  chunkIndex = [];
  for (const doc of docs) {
    const chunks = splitIntoChunks(doc, 500, 50);
    chunkIndex.push(...chunks);
  }
  indexed = true;
  console.log(`[RAG] Indexed ${chunkIndex.length} chunks from ${docs.length} documents`);
}

// ─── Tokenization ────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// ─── TF-IDF style scoring ────────────────────────────────────

function scoreChunk(chunk: KBChunk, queryTokens: string[], rawQuery: string): number {
  const contentLower = chunk.content.toLowerCase();
  const titleLower = chunk.title.toLowerCase();
  const queryLower = rawQuery.toLowerCase().trim();
  const contentTokens = tokenize(chunk.content);
  const contentLength = Math.max(contentTokens.length, 1);

  let score = 0;

  // Keyword match frequency, normalized by chunk length
  for (const token of queryTokens) {
    const matchCount = contentTokens.filter((t) => t === token || t.includes(token)).length;
    score += (matchCount / contentLength) * 10;
  }

  // Exact phrase match boost (full query appears in content)
  if (queryLower.length > 3 && contentLower.includes(queryLower)) {
    score += 25;
  }

  // Partial phrase matches (2+ word sequences)
  if (queryTokens.length >= 2) {
    for (let i = 0; i < queryTokens.length - 1; i++) {
      const bigram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
      if (contentLower.includes(bigram)) {
        score += 10;
      }
    }
  }

  // Title match boost
  for (const token of queryTokens) {
    if (titleLower.includes(token)) {
      score += 15;
    }
  }

  // Exact title match (strongest signal)
  if (queryLower.length > 3 && titleLower.includes(queryLower)) {
    score += 30;
  }

  return score;
}

// ─── Search ──────────────────────────────────────────────────

/**
 * TF-IDF style search across all indexed chunks.
 * Returns top N results sorted by relevance score.
 */
export function searchKnowledge(query: string, limit: number = 3): KBChunk[] {
  if (!indexed) {
    indexKnowledgeBase();
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored = chunkIndex
    .map((chunk) => ({
      ...chunk,
      relevanceScore: scoreChunk(chunk, queryTokens, query),
    }))
    .filter((c) => c.relevanceScore > 0)
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  // De-duplicate by title — keep highest-scoring chunk per document
  const seen = new Set<string>();
  const deduped: KBChunk[] = [];
  for (const chunk of scored) {
    if (!seen.has(chunk.title)) {
      seen.add(chunk.title);
      deduped.push(chunk);
    }
    if (deduped.length >= limit) break;
  }

  return deduped;
}

// ─── Context Builder ─────────────────────────────────────────

/**
 * Search knowledge base and format results as context for the AI prompt.
 */
export function buildRagContext(query: string): string {
  const results = searchKnowledge(query, 3);

  if (results.length === 0) {
    return "";
  }

  const articles = results
    .map((r) => {
      // Trim content to a reasonable length for context
      const excerpt = r.content.length > 400
        ? r.content.slice(0, 400) + "..."
        : r.content;
      return `[${r.title}] ${excerpt}`;
    })
    .join("\n\n");

  return `## Relevant IT Knowledge Base Articles\n\n${articles}`;
}

// ─── Full RAG Query ──────────────────────────────────────────

/**
 * Full RAG pipeline: search KB, build context, return sources.
 */
export function ragQuery(
  query: string,
  userContext?: { name: string; department: string }
): RagResult {
  if (!indexed) {
    indexKnowledgeBase();
  }

  const results = searchKnowledge(query, 3);
  const contextParts: string[] = [];

  // Add RAG context
  if (results.length > 0) {
    const articles = results
      .map((r) => {
        const excerpt = r.content.length > 400
          ? r.content.slice(0, 400) + "..."
          : r.content;
        return `[${r.title}] ${excerpt}`;
      })
      .join("\n\n");
    contextParts.push(`## Relevant IT Knowledge Base Articles\n\n${articles}`);
  }

  // Add user context if provided
  if (userContext) {
    contextParts.push(
      `## Requesting User\n- Name: ${userContext.name}\n- Department: ${userContext.department}`
    );
  }

  return {
    context: contextParts.join("\n\n"),
    sources: results.map((r) => ({
      id: r.id,
      title: r.title,
      score: r.relevanceScore ?? 0,
    })),
  };
}
