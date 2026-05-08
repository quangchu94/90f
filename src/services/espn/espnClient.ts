import { buildMatchSummaryUrl, buildScoreboardUrl } from './espnEndpoints';
import type { EspnScoreboardResponse, EspnSummaryResponse } from './espnTypes';

const DEFAULT_TIMEOUT_MS = 10_000;

export class EspnError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isNetworkError = false
  ) {
    super(message);
    this.name = 'EspnError';
  }
}

export interface EspnHttpClient {
  getJson<T>(url: string, signal?: AbortSignal): Promise<T>;
}

export class FetchEspnHttpClient implements EspnHttpClient {
  async getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const timeoutController = new AbortController();
    const timeoutId = window.setTimeout(() => timeoutController.abort(), DEFAULT_TIMEOUT_MS);
    const abortFromParent = () => timeoutController.abort();
    signal?.addEventListener('abort', abortFromParent, { once: true });

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: timeoutController.signal
      });

      if (!response.ok) {
        throw new EspnError('ESPN request failed', response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof EspnError) {
        throw error;
      }

      throw new EspnError(
        'Không thể tải dữ liệu trận đấu. Vui lòng thử lại.',
        undefined,
        true
      );
    } finally {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromParent);
    }
  }
}

export const espnHttpClient: EspnHttpClient = new FetchEspnHttpClient();

export function isRetryableEspnError(error: unknown): boolean {
  if (!(error instanceof EspnError)) {
    return false;
  }

  return error.isNetworkError || error.status === undefined || error.status >= 500;
}

export async function fetchScoreboard(
  leagueSlug: string,
  dateParam: string,
  signal?: AbortSignal
): Promise<EspnScoreboardResponse> {
  return espnHttpClient.getJson<EspnScoreboardResponse>(
    buildScoreboardUrl(leagueSlug, dateParam),
    signal
  );
}

export async function fetchMatchSummary(
  leagueSlug: string,
  eventId: string,
  signal?: AbortSignal
): Promise<EspnSummaryResponse> {
  return espnHttpClient.getJson<EspnSummaryResponse>(
    buildMatchSummaryUrl(leagueSlug, eventId),
    signal
  );
}
