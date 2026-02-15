import type { CompetitorInfo } from "@specforge-dev/core";

interface NpmSearchResult {
  objects: Array<{
    package: {
      name: string;
      description?: string;
      links?: { npm?: string; homepage?: string; repository?: string };
      keywords?: string[];
    };
  }>;
}

interface GitHubSearchResult {
  items: Array<{
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    topics: string[];
    stargazers_count: number;
  }>;
}

/**
 * Search npm registry for packages matching keywords.
 * Uses the public npm search API (no auth required).
 */
export async function searchNpm(
  keywords: string[],
  limit: number = 10
): Promise<CompetitorInfo[]> {
  const query = keywords.slice(0, 5).join("+");
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`;

  try {
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`  npm search returned ${response.status}, skipping.`);
      return [];
    }

    const data = (await response.json()) as NpmSearchResult;

    return data.objects.map((obj) => ({
      name: obj.package.name,
      url: obj.package.links?.npm ?? obj.package.links?.homepage,
      source: "npm" as const,
      description: obj.package.description ?? "",
      features: obj.package.keywords ?? [],
    }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`  npm search failed: ${msg}`);
    return [];
  }
}

/**
 * Search GitHub repositories matching keywords.
 * Uses unauthenticated API (60 req/hr) or GITHUB_TOKEN if available.
 */
export async function searchGitHub(
  keywords: string[],
  limit: number = 10
): Promise<CompetitorInfo[]> {
  const query = keywords.slice(0, 5).join("+");
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=${limit}`;

  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "specforge-cli",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 403 || response.status === 429) {
      console.warn(
        `  GitHub API rate limited (${response.status}). Set GITHUB_TOKEN env var for higher limits.`
      );
      return [];
    }

    if (!response.ok) {
      console.warn(`  GitHub search returned ${response.status}, skipping.`);
      return [];
    }

    const data = (await response.json()) as GitHubSearchResult;

    return data.items.map((item) => ({
      name: item.full_name,
      url: item.html_url,
      source: "github" as const,
      description: item.description ?? "",
      features: item.topics ?? [],
    }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`  GitHub search failed: ${msg}`);
    return [];
  }
}

/**
 * Fetch a competitor page and extract basic info from HTML meta tags.
 */
export async function fetchCompetitorPage(url: string): Promise<CompetitorInfo | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "specforge-cli/1.0",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!response.ok) {
      console.warn(`  Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

    // Extract meta description
    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    ) ?? html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
    );
    const description = descMatch ? descMatch[1].trim() : "";

    // Extract meta keywords
    const kwMatch = html.match(
      /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i
    ) ?? html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']keywords["']/i
    );
    const features = kwMatch
      ? kwMatch[1].split(",").map((k) => k.trim()).filter(Boolean)
      : [];

    return {
      name: title,
      url,
      source: "url",
      description,
      features,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`  Failed to fetch ${url}: ${msg}`);
    return null;
  }
}

/**
 * Combine results from npm, GitHub, and user-provided URLs into a deduplicated list.
 */
export function buildCompetitorList(
  npm: CompetitorInfo[],
  github: CompetitorInfo[],
  urls: CompetitorInfo[]
): CompetitorInfo[] {
  const seen = new Set<string>();
  const result: CompetitorInfo[] = [];

  const addIfNew = (competitor: CompetitorInfo) => {
    const key = competitor.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(competitor);
    }
  };

  // User URLs get highest priority
  for (const c of urls) addIfNew(c);
  // Then npm
  for (const c of npm) addIfNew(c);
  // Then GitHub
  for (const c of github) addIfNew(c);

  return result;
}
