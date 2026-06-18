/**
 * Shared SparkLogs endpoint helpers for the Node.js examples.
 *
 * These mirror the SPARKLOGS_RESOLVE_BASE_URI helper from
 * `mk/sparklogs-otel.mk`, so the same env vars (SPARKLOGS_INGEST_BASE_URI or
 * SPARKLOGS_REGION + SPARKLOGS_INGEST_KEY_ID + SPARKLOGS_INGEST_KEY_ACCESS_TOKEN) drive
 * every example regardless of which logging library it uses.
 */

/**
 * Resolve the SparkLogs ingest base URI from the standard env vars.
 *
 *   - SPARKLOGS_INGEST_BASE_URI wins if set (QA / dev-cloud / on-prem override).
 *   - Otherwise build from SPARKLOGS_REGION (public-cloud shortcut).
 *
 * Throws if neither is set. A missing trailing slash is normalized so callers
 * can safely append paths like `v1/logs`.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {string} fully-qualified base URI with a trailing slash
 */
export function resolveIngestBaseUri(env = process.env) {
  if (env.SPARKLOGS_INGEST_BASE_URI) {
    const u = env.SPARKLOGS_INGEST_BASE_URI;
    return u.endsWith('/') ? u : u + '/';
  }
  if (env.SPARKLOGS_REGION) {
    return `https://ingest-${env.SPARKLOGS_REGION}.engine.sparklogs.app/`;
  }
  throw new Error(
    "Set either SPARKLOGS_INGEST_BASE_URI (e.g. https://ingest-us.engine.sparklogs.app/) " +
    "or SPARKLOGS_REGION (e.g. us|eu|...)."
  );
}

/**
 * For the Elasticsearch-bulk ingestion path only. The `@elastic/elasticsearch`
 * v8+ client doesn't accept a path on the `node` URL — its undici-based
 * connection pool only accepts an origin (scheme + host [+ port]). See
 * https://github.com/elastic/elasticsearch-js/issues/1701.
 *
 * SparkLogs solves this by serving the Elasticsearch-bulk-compat endpoint on
 * a dedicated `es8.` host so the client's `node` URL stays a clean origin.
 * This helper rewrites a standard SparkLogs ingest base URI to that host:
 *
 *   https://ingest-us.engine.sparklogs.app/  →  https://es8.ingest-us.engine.sparklogs.app/
 *   (replace `us` with your product region code)
 *
 * Localhost / IP-based hosts (QA setups where the user controls routing) are
 * passed through unchanged — they're assumed to expose the bulk API at the
 * root of whatever the operator configured. A URL that already starts with
 * `es8.` is also passed through unchanged (idempotent).
 *
 * @param {string} baseUri  e.g. the output of resolveIngestBaseUri()
 * @returns {string}
 */
export function resolveEs8Endpoint(baseUri) {
  const url = new URL(baseUri);
  const host = url.hostname;
  const isLocalish =
    host === 'localhost' ||
    host.includes(':') ||                          // any IPv6 form (url.hostname strips brackets)
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host);          // IPv4
  if (isLocalish || host.startsWith('es8.')) {
    return url.toString();
  }
  url.hostname = `es8.${host}`;
  return url.toString();
}

/**
 * Read the SparkLogs agent credentials from env. Returns the bearer-token
 * string that the @elastic/elasticsearch / bunyan-elasticsearch-bulk clients
 * accept via their `auth.bearer` option (`<id>:<access-token>` form).
 *
 * Throws with a clear message if either piece is missing.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {{ id: string, token: string, bearer: string }}
 */
export function resolveAgentCredentials(env = process.env) {
  const id = env.SPARKLOGS_INGEST_KEY_ID;
  const token = env.SPARKLOGS_INGEST_KEY_ACCESS_TOKEN;
  if (!id || !token) {
    throw new Error(
      "Set SPARKLOGS_INGEST_KEY_ID and SPARKLOGS_INGEST_KEY_ACCESS_TOKEN before running. " +
      "View or create an agent in the SparkLogs app under Configure → Agents."
    );
  }
  return { id, token, bearer: `${id}:${token}` };
}
