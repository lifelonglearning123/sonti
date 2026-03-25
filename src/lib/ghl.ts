const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

export async function ghlFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${GHL_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Version: GHL_VERSION,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return response;
}
