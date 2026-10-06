const GRAPHQL_URL = 'https://api.github.com/graphql';

export interface UserStats {
  login: string;
  name: string | null;
  stars: number;
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  contributedTo: number;
  followers: number;
}

export interface Language {
  name: string;
  color: string | null;
  size: number;
}

export interface Repo {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: { name: string; color: string | null } | null;
}

interface RepoLanguages {
  languages: { edges: { size: number; node: { name: string; color: string | null } }[] } | null;
}

interface Connection<T> {
  nodes: T[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

interface TotalCount {
  totalCount: number;
}

const USER_STATS_QUERY = `
  query userStats($login: String!) {
    user(login: $login) {
      name
      login
      contributionsCollection {
        totalCommitContributions
        totalPullRequestReviewContributions
      }
      repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
        totalCount
      }
      pullRequests(first: 1) { totalCount }
      openIssues: issues(states: OPEN) { totalCount }
      closedIssues: issues(states: CLOSED) { totalCount }
      followers { totalCount }
    }
  }
`;

// Uses the stargazerCount scalar: the stargazers connection is no longer readable with GITHUB_TOKEN.
const USER_STARS_QUERY = `
  query userStars($login: String!, $after: String) {
    user(login: $login) {
      repositories(first: 100, after: $after, ownerAffiliations: OWNER, privacy: PUBLIC) {
        nodes { stargazerCount }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const TOP_LANGUAGES_QUERY = `
  query topLanguages($login: String!, $after: String) {
    user(login: $login) {
      repositories(first: 100, after: $after, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
        nodes {
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const REPO_QUERY = `
  query repo($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      name
      description
      stargazerCount
      forkCount
      primaryLanguage { name color }
    }
  }
`;

async function graphql<T>(token: string, query: string, variables: object): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ssbarbee-profile-cards',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`GitHub API responded with ${response.status} ${response.statusText}`);
  }

  // Partial data with errors is treated as a failure, so a broken card is never written.
  const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) {
    throw new Error(body.errors.map(({ message }) => message).join('; '));
  }
  if (!body.data) {
    throw new Error('GitHub API returned no data');
  }
  return body.data;
}

function requireUser<T>(user: T | null, login: string): T {
  if (!user) {
    throw new Error(`User ${login} not found`);
  }
  return user;
}

// Pages through every repository matched by a query that takes $login and $after.
async function fetchAllRepos<T>(token: string, query: string, login: string): Promise<T[]> {
  const repos: T[] = [];
  let after: string | null = null;
  do {
    const data: { user: { repositories: Connection<T> } | null } = await graphql(token, query, {
      login,
      after,
    });
    const { nodes, pageInfo } = requireUser(data.user, login).repositories;
    repos.push(...nodes);
    after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (after);
  return repos;
}

async function fetchTotalStars(token: string, login: string): Promise<number> {
  const repos = await fetchAllRepos<{ stargazerCount: number }>(token, USER_STARS_QUERY, login);
  return repos.reduce((sum, { stargazerCount }) => sum + stargazerCount, 0);
}

export async function fetchUserStats(token: string, login: string): Promise<UserStats> {
  const data = await graphql<{
    user: {
      name: string | null;
      login: string;
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestReviewContributions: number;
      };
      repositoriesContributedTo: TotalCount;
      pullRequests: TotalCount;
      openIssues: TotalCount;
      closedIssues: TotalCount;
      followers: TotalCount;
    } | null;
  }>(token, USER_STATS_QUERY, { login });
  const user = requireUser(data.user, login);

  return {
    login: user.login,
    name: user.name,
    stars: await fetchTotalStars(token, login),
    commits: user.contributionsCollection.totalCommitContributions,
    prs: user.pullRequests.totalCount,
    issues: user.openIssues.totalCount + user.closedIssues.totalCount,
    reviews: user.contributionsCollection.totalPullRequestReviewContributions,
    contributedTo: user.repositoriesContributedTo.totalCount,
    followers: user.followers.totalCount,
  };
}

export function sumLanguages(repos: RepoLanguages[]): Language[] {
  const totals = new Map<string, Language>();
  for (const { languages } of repos) {
    for (const { size, node } of languages?.edges ?? []) {
      const total = totals.get(node.name) ?? { name: node.name, color: node.color, size: 0 };
      total.size += size;
      totals.set(node.name, total);
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.size - a.size);
}

export async function fetchTopLanguages(token: string, login: string): Promise<Language[]> {
  return sumLanguages(await fetchAllRepos<RepoLanguages>(token, TOP_LANGUAGES_QUERY, login));
}

export async function fetchRepo(token: string, owner: string, name: string): Promise<Repo> {
  const { repository } = await graphql<{
    repository: {
      name: string;
      description: string | null;
      stargazerCount: number;
      forkCount: number;
      primaryLanguage: { name: string; color: string | null } | null;
    } | null;
  }>(token, REPO_QUERY, { owner, name });
  if (!repository) {
    throw new Error(`Repository ${owner}/${name} not found`);
  }

  return {
    name: repository.name,
    description: repository.description,
    stars: repository.stargazerCount,
    forks: repository.forkCount,
    language: repository.primaryLanguage,
  };
}
