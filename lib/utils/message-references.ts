/**
 * Utility functions for handling contextual references in messages
 */

export interface JobReference {
  id: string;
  title?: string;
}

export interface QuoteReference {
  id: string;
  amount?: string;
}

/**
 * Create a job reference that can be embedded in messages
 */
export function createJobReference(job: { id: string; title?: string }): string {
  if (job.title) {
    return `[job:${job.id}:${job.title}]`;
  }
  return `[job:${job.id}]`;
}

/**
 * Create a quote reference that can be embedded in messages
 */
export function createQuoteReference(quote: { id: string; total?: number; currency?: string }): string {
  if (quote.total && quote.currency) {
    const formattedAmount = new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: quote.currency,
    }).format(quote.total);
    return `[quote:${quote.id}:${formattedAmount}]`;
  }
  return `[quote:${quote.id}]`;
}

/**
 * Extract job references from message content
 */
export function extractJobReferences(content: string): JobReference[] {
  const jobRegex = /\[job:([a-zA-Z0-9-]+)(?::([^\]]+))?\]/g;
  const references: JobReference[] = [];
  let match;

  while ((match = jobRegex.exec(content)) !== null) {
    references.push({
      id: match[1],
      title: match[2],
    });
  }

  return references;
}

/**
 * Extract quote references from message content
 */
export function extractQuoteReferences(content: string): QuoteReference[] {
  const quoteRegex = /\[quote:([a-zA-Z0-9-]+)(?::([^\]]+))?\]/g;
  const references: QuoteReference[] = [];
  let match;

  while ((match = quoteRegex.exec(content)) !== null) {
    references.push({
      id: match[1],
      amount: match[2],
    });
  }

  return references;
}

/**
 * Check if a message contains any contextual references
 */
export function hasContextualReferences(content: string): boolean {
  const jobRegex = /\[job:[a-zA-Z0-9-]+(?::[^\]]+)?\]/;
  const quoteRegex = /\[quote:[a-zA-Z0-9-]+(?::[^\]]+)?\]/;
  
  return jobRegex.test(content) || quoteRegex.test(content);
}