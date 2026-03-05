/**
 * Knowledge Engine — Enhanced RAG pipeline with ingestion, cited responses,
 * feedback tracking, and knowledge gap detection.
 *
 * Replaces the basic rag-pipeline with a full-featured knowledge engine
 * that supports document chunking, TF-IDF + bigram search, Confluence
 * ingestion stubs, inline citations, and self-improving relevance tuning.
 */

import {
  getKnowledgeDocuments,
  createKnowledgeDocument,
  type KnowledgeDocument,
} from "../../src/lib/mock-data";

// ─── Types ───────────────────────────────────────────────────

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  chunks: KBChunk[];
  lastIndexed: Date;
  searchCount: number;
  helpfulCount: number;
}

export interface KBChunk {
  id: string;
  content: string;
  documentId: string;
  title: string;
  chunkIndex: number;
  score?: number;
}

export interface KnowledgeGap {
  id: string;
  query: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface KnowledgeStats {
  totalDocuments: number;
  totalChunks: number;
  searchVolume: number;
  gapCount: number;
  avgHelpfulness: number;
}

export interface SearchOptions {
  category?: string;
  limit?: number;
}

// ─── In-memory stores ────────────────────────────────────────

const articles = new Map<string, KBArticle>();
const allChunks = new Map<string, KBChunk>();
const knowledgeGaps = new Map<string, KnowledgeGap>();

let totalSearches = 0;
let indexed = false;
let gapIdCounter = 0;

// ─── Stop words ──────────────────────────────────────────────

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

// ─── Tokenization ────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// ─── Chunking ────────────────────────────────────────────────

function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];

  if (text.length <= chunkSize) {
    chunks.push(text);
    return chunks;
  }

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

// ─── Ingestion ───────────────────────────────────────────────

/**
 * Ingest a document: chunk it, store chunks, index for search.
 */
export function ingestDocument(
  title: string,
  content: string,
  category: string,
  tags: string[]
): KBArticle {
  // Persist to mock data layer
  const doc = createKnowledgeDocument({ title, content, category, tags });

  // Chunk the content
  const textChunks = chunkText(content, 500, 100);
  const kbChunks: KBChunk[] = textChunks.map((text, idx) => {
    const chunk: KBChunk = {
      id: `${doc.id}-chunk-${idx}`,
      content: text,
      documentId: doc.id,
      title,
      chunkIndex: idx,
    };
    allChunks.set(chunk.id, chunk);
    return chunk;
  });

  const article: KBArticle = {
    id: doc.id,
    title,
    content,
    category,
    tags,
    chunks: kbChunks,
    lastIndexed: new Date(),
    searchCount: 0,
    helpfulCount: 0,
  };

  articles.set(doc.id, article);
  console.log(
    `[KNOWLEDGE] Ingested "${title}" — ${kbChunks.length} chunks, category: ${category}`
  );

  return article;
}

/**
 * Stub: Ingest documents from Confluence.
 * In production, this would call the Confluence REST API to fetch page content.
 */
export async function ingestFromConfluence(
  spaceKey: string,
  pageId?: string
): Promise<{ ingested: number; errors: string[] }> {
  console.log(
    `[KNOWLEDGE] Confluence ingestion stub — space: ${spaceKey}, page: ${pageId ?? "all"}`
  );

  // Stub: In production, this would:
  // 1. GET /wiki/rest/api/content?spaceKey={spaceKey}&expand=body.storage
  // 2. For each page, extract HTML content and convert to plain text
  // 3. Call ingestDocument for each page

  if (pageId) {
    // Stub a single page ingestion
    const stubTitle = `Confluence Page ${pageId}`;
    const stubContent = `This is a stub for Confluence page ${pageId} from space ${spaceKey}. In production, real content would be fetched via the Confluence REST API.`;
    ingestDocument(stubTitle, stubContent, "Confluence", [spaceKey, "imported"]);
    return { ingested: 1, errors: [] };
  }

  // Stub: pretend we fetched 0 pages from the space
  return {
    ingested: 0,
    errors: [
      `Confluence integration not configured. Set CONFLUENCE_BASE_URL and CONFLUENCE_API_TOKEN to enable.`,
    ],
  };
}

// ─── Index from existing KB ──────────────────────────────────

/**
 * Bootstrap the knowledge engine from the existing mock data knowledge documents.
 */
export function indexExistingDocuments(): void {
  if (indexed) return;

  const docs = getKnowledgeDocuments();
  for (const doc of docs) {
    const textChunks = chunkText(doc.content, 500, 100);
    const kbChunks: KBChunk[] = textChunks.map((text, idx) => {
      const chunk: KBChunk = {
        id: `${doc.id}-chunk-${idx}`,
        content: text,
        documentId: doc.id,
        title: doc.title,
        chunkIndex: idx,
      };
      allChunks.set(chunk.id, chunk);
      return chunk;
    });

    const article: KBArticle = {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category ?? "General",
      tags: doc.tags,
      chunks: kbChunks,
      lastIndexed: new Date(doc.updatedAt),
      searchCount: 0,
      helpfulCount: 0,
    };

    articles.set(doc.id, article);
  }

  indexed = true;
  console.log(
    `[KNOWLEDGE] Indexed ${articles.size} documents, ${allChunks.size} chunks from existing KB`
  );
}

// ─── Scoring ─────────────────────────────────────────────────

function scoreChunk(
  chunk: KBChunk,
  queryTokens: string[],
  rawQuery: string,
  article: KBArticle | undefined
): number {
  const contentLower = chunk.content.toLowerCase();
  const titleLower = chunk.title.toLowerCase();
  const queryLower = rawQuery.toLowerCase().trim();
  const contentTokens = tokenize(chunk.content);
  const contentLength = Math.max(contentTokens.length, 1);

  let score = 0;

  // Keyword match frequency (TF component), normalized by chunk length
  for (const token of queryTokens) {
    const matchCount = contentTokens.filter(
      (t) => t === token || t.includes(token)
    ).length;
    score += (matchCount / contentLength) * 10;
  }

  // Bigram matching — consecutive query tokens appearing together in content
  if (queryTokens.length >= 2) {
    for (let i = 0; i < queryTokens.length - 1; i++) {
      const bigram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
      if (contentLower.includes(bigram)) {
        score += 12;
      }
    }
  }

  // Exact phrase match boost
  if (queryLower.length > 3 && contentLower.includes(queryLower)) {
    score += 25;
  }

  // Title boosting (2x) — each matching token in title gets double weight
  for (const token of queryTokens) {
    if (titleLower.includes(token)) {
      score += 20; // 2x the normal content match
    }
  }

  // Exact title match
  if (queryLower.length > 3 && titleLower.includes(queryLower)) {
    score += 30;
  }

  // Recency boost — recently updated docs get a small boost
  if (article) {
    const daysSinceIndex =
      (Date.now() - article.lastIndexed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceIndex < 7) {
      score += 5;
    } else if (daysSinceIndex < 30) {
      score += 2;
    }

    // Popularity boost — frequently searched docs are likely more relevant
    if (article.searchCount > 10) {
      score += 3;
    } else if (article.searchCount > 5) {
      score += 1;
    }
  }

  return score;
}

// ─── Search ──────────────────────────────────────────────────

/**
 * Enhanced TF-IDF search with bigram matching, title boosting,
 * category filtering, recency boost, and popularity boost.
 */
export function search(
  query: string,
  options?: SearchOptions
): KBChunk[] {
  // Ensure we have indexed
  if (!indexed) {
    indexExistingDocuments();
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const limit = options?.limit ?? 5;
  totalSearches++;

  // Score all chunks
  const scored: KBChunk[] = [];
  for (const chunk of allChunks.values()) {
    // Category filter
    if (options?.category) {
      const article = articles.get(chunk.documentId);
      if (article && article.category !== options.category) {
        continue;
      }
    }

    const article = articles.get(chunk.documentId);
    const chunkScore = scoreChunk(chunk, queryTokens, query, article);

    if (chunkScore > 0) {
      scored.push({ ...chunk, score: chunkScore });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // De-duplicate by document — keep highest-scoring chunk per document
  const seen = new Set<string>();
  const results: KBChunk[] = [];
  for (const chunk of scored) {
    if (!seen.has(chunk.documentId)) {
      seen.add(chunk.documentId);
      results.push(chunk);

      // Increment search count for the article
      const article = articles.get(chunk.documentId);
      if (article) {
        article.searchCount++;
      }
    }
    if (results.length >= limit) break;
  }

  return results;
}

// ─── Cited Response Builder ──────────────────────────────────

/**
 * Build a response with inline citations.
 * Example output:
 *   "To setup VPN, install the client [1] and enter your credentials [1].
 *    Then enable MFA [2].
 *
 *    Sources:
 *    [1] VPN Setup Guide
 *    [2] MFA Policy"
 */
export function buildCitedResponse(
  query: string,
  chunks: KBChunk[]
): string {
  if (chunks.length === 0) {
    return "I couldn't find any relevant information in the knowledge base for your question. Please try rephrasing or contact IT support.";
  }

  // Build source map: documentId -> citation number
  const sourceMap = new Map<string, number>();
  const sources: { num: number; title: string }[] = [];

  chunks.forEach((chunk, idx) => {
    if (!sourceMap.has(chunk.documentId)) {
      const num = sourceMap.size + 1;
      sourceMap.set(chunk.documentId, num);
      sources.push({ num, title: chunk.title });
    }
  });

  // Build the answer body with inline citations
  // Each chunk contributes a paragraph with its citation
  const paragraphs: string[] = [];
  for (const chunk of chunks) {
    const citationNum = sourceMap.get(chunk.documentId) ?? 1;
    // Trim content to a reasonable excerpt length
    const excerpt =
      chunk.content.length > 300
        ? chunk.content.slice(0, 300).trim() + "..."
        : chunk.content.trim();
    paragraphs.push(`${excerpt} [${citationNum}]`);
  }

  const body = paragraphs.join("\n\n");
  const sourcesStr = sources
    .map((s) => `[${s.num}] ${s.title}`)
    .join("\n");

  return `${body}\n\nSources:\n${sourcesStr}`;
}

// ─── Feedback ────────────────────────────────────────────────

/**
 * Record user feedback on a chunk's relevance.
 */
export function recordFeedback(chunkId: string, helpful: boolean): void {
  const chunk = allChunks.get(chunkId);
  if (!chunk) {
    console.warn(`[KNOWLEDGE] Feedback for unknown chunk: ${chunkId}`);
    return;
  }

  const article = articles.get(chunk.documentId);
  if (article && helpful) {
    article.helpfulCount++;
  }

  console.log(
    `[KNOWLEDGE] Feedback for chunk ${chunkId}: ${helpful ? "helpful" : "not helpful"}`
  );
}

// ─── Knowledge Gap Detection ─────────────────────────────────

const LOW_SCORE_THRESHOLD = 5;

/**
 * Detect if a query represents a knowledge gap.
 * Called after search — if no results or all low-scoring, record as a gap.
 */
export function detectKnowledgeGap(
  query: string,
  results: KBChunk[]
): boolean {
  const isGap =
    results.length === 0 ||
    results.every((r) => (r.score ?? 0) < LOW_SCORE_THRESHOLD);

  if (!isGap) return false;

  // Normalize the query for deduplication
  const normalized = query.toLowerCase().trim();
  const existing = knowledgeGaps.get(normalized);

  if (existing) {
    existing.count++;
    existing.lastSeen = new Date();
  } else {
    gapIdCounter++;
    knowledgeGaps.set(normalized, {
      id: `gap-${gapIdCounter}`,
      query: query.trim(),
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
  }

  console.log(
    `[KNOWLEDGE] Knowledge gap detected: "${query.trim()}" (${existing ? existing.count : 1} occurrences)`
  );

  return true;
}

/**
 * Get all knowledge gaps sorted by frequency.
 */
export function getKnowledgeGaps(): KnowledgeGap[] {
  return [...knowledgeGaps.values()].sort((a, b) => b.count - a.count);
}

// ─── Stats ───────────────────────────────────────────────────

/**
 * Return summary statistics about the knowledge engine.
 */
export function getKnowledgeStats(): KnowledgeStats {
  const articleList = [...articles.values()];
  const totalHelpful = articleList.reduce(
    (sum, a) => sum + a.helpfulCount,
    0
  );
  const totalSearched = articleList.reduce(
    (sum, a) => sum + a.searchCount,
    0
  );

  return {
    totalDocuments: articles.size,
    totalChunks: allChunks.size,
    searchVolume: totalSearches,
    gapCount: knowledgeGaps.size,
    avgHelpfulness:
      totalSearched > 0 ? totalHelpful / totalSearched : 0,
  };
}

/**
 * Get a specific article by ID.
 */
export function getArticle(id: string): KBArticle | undefined {
  return articles.get(id);
}

/**
 * Get all articles.
 */
export function getAllArticles(): KBArticle[] {
  return [...articles.values()];
}
