const ADZUNA_BASE_URL =
  "https://api.adzuna.com/v1/api";

export async function searchAdzunaJobs(
  country: string,
  query: string
) {
  const appId =
    process.env.ADZUNA_APP_ID;

  const appKey =
    process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error(
      "ADZUNA_APP_ID or ADZUNA_APP_KEY is missing"
    );
  }

  const url = new URL(
    `${ADZUNA_BASE_URL}/jobs/${country}/search/1`
  );

  url.searchParams.set(
    "app_id",
    appId
  );

  url.searchParams.set(
    "app_key",
    appKey
  );

  url.searchParams.set(
    "results_per_page",
    "10"
  );

  url.searchParams.set(
    "what",
    query
  );

  const response =
    await fetch(url);

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      `Adzuna API error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}