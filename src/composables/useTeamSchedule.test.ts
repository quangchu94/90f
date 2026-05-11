import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTeamSchedule } from './useTeamSchedule';
import {
  fetchSoccerLeagues,
  fetchTeamFixtureSchedule,
  fetchTeamScheduleLeague
} from '@/services/espn/espnClient';
import type { EspnTeamScheduleResponse } from '@/services/espn/espnTypes';

vi.mock('@/services/espn/espnClient', async () => {
  const actual = await vi.importActual<typeof import('@/services/espn/espnClient')>(
    '@/services/espn/espnClient'
  );

  return {
    ...actual,
    fetchSoccerLeagues: vi.fn(),
    fetchTeamFixtureSchedule: vi.fn(),
    fetchTeamScheduleLeague: vi.fn()
  };
});

describe('useTeamSchedule', () => {
  beforeEach(() => {
    vi.mocked(fetchSoccerLeagues).mockReset();
    vi.mocked(fetchTeamFixtureSchedule).mockReset();
    vi.mocked(fetchTeamScheduleLeague).mockReset();
  });

  it('exposes matches as individual league schedule queries resolve', async () => {
    const spainSchedule = deferred<EspnTeamScheduleResponse>();
    const uclSchedule = deferred<EspnTeamScheduleResponse>();
    const fixtureSchedule = deferred<EspnTeamScheduleResponse>();

    vi.mocked(fetchSoccerLeagues).mockResolvedValue([
      { slug: 'esp.1', name: 'Spanish LALIGA', shortName: 'LaLiga' },
      { slug: 'uefa.champions', name: 'UEFA Champions League', shortName: 'UCL' }
    ]);
    vi.mocked(fetchTeamScheduleLeague).mockImplementation((league) =>
      league.slug === 'esp.1' ? spainSchedule.promise : uclSchedule.promise
    );
    vi.mocked(fetchTeamFixtureSchedule).mockReturnValue(fixtureSchedule.promise);

    const wrapper = mountTestComponent();
    await flushPromises();

    spainSchedule.resolve({
      events: [makeScheduleEvent('laliga-result', 'esp.1', 'Spanish LALIGA')]
    });
    await flushPromises();

    expect(wrapper.text()).toContain('laliga-result');
    expect(wrapper.text()).not.toContain('ucl-result');

    uclSchedule.resolve({
      events: [makeScheduleEvent('ucl-result', 'uefa.champions', 'UEFA Champions League')]
    });
    await flushPromises();

    expect(wrapper.text()).toContain('laliga-result,ucl-result');
  });
});

function mountTestComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  return mount(
    defineComponent({
      setup() {
        const { data } = useTeamSchedule(ref('esp.1'), ref('83'), ref(true));
        return () => h('div', data.value?.map((match) => match.id).join(',') ?? 'empty');
      }
    }),
    {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    }
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}

function makeScheduleEvent(
  eventId: string,
  leagueSlug: string,
  leagueName: string
): NonNullable<EspnTeamScheduleResponse['events']>[number] {
  return {
    id: eventId,
    date: '2026-05-08T14:00:00Z',
    leagues: [{ slug: leagueSlug, name: leagueName }],
    status: { type: { state: 'post', completed: true } },
    competitions: [
      {
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { id: '83', displayName: 'Barcelona', shortDisplayName: 'Barcelona' }
          },
          {
            homeAway: 'away',
            score: '0',
            team: { id: '2', displayName: 'Opponent', shortDisplayName: 'Opponent' }
          }
        ]
      }
    ]
  };
}
