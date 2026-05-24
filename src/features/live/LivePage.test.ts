import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LivePage from './LivePage.vue';
import type { FootballMatch } from '@/domain/models';

const liveState = vi.hoisted(() => ({
  data: { value: [] as FootballMatch[] },
  supplementalMatches: { value: [] as FootballMatch[] },
  supplementalLeagueSlugs: undefined as { value: string[] } | undefined,
  refetch: vi.fn(),
  refetchAll: vi.fn()
}));

vi.mock('@/composables/useLiveScoreboard', () => ({
  useLiveScoreboard: () => ({
    data: liveState.data,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: liveState.refetch
  }),
  useLiveLeagueScoreboards: (_selectedDate: unknown, leagueSlugs: { value: string[] }) => {
    liveState.supplementalLeagueSlugs = leagueSlugs;

    return {
      matches: liveState.supplementalMatches,
      isFetching: false,
      isError: false,
      refetchAll: liveState.refetchAll
    };
  }
}));

describe('LivePage', () => {
  beforeEach(() => {
    liveState.data.value = [];
    liveState.supplementalMatches.value = [];
    liveState.supplementalLeagueSlugs = undefined;
    liveState.refetch.mockClear();
    liveState.refetchAll.mockClear();
    window.localStorage.clear();
    setActivePinia(createPinia());
  });

  it('shows all normalized live matches in the all filter', () => {
    liveState.data.value = [
      makeLiveMatch('epl-1', 'eng.1'),
      makeLiveMatch('laliga-1', 'esp.1')
    ];

    const wrapper = mountPage();

    expect(renderedMatchIds(wrapper)).toEqual(['epl-1', 'laliga-1']);
    expect(liveState.supplementalLeagueSlugs?.value).toEqual([]);
  });

  it('filters live matches by a single favorite league slug', async () => {
    liveState.data.value = [
      makeLiveMatch('epl-1', 'eng.1'),
      makeLiveMatch('laliga-1', 'esp.1')
    ];
    const wrapper = mountPage();

    await wrapper.findAll('button').find((button) => button.text() === 'EPL')?.trigger('click');

    expect(renderedMatchIds(wrapper)).toEqual(['epl-1']);
    expect(liveState.supplementalLeagueSlugs?.value).toEqual([]);
  });

  it('filters live matches to favorite leagues', async () => {
    liveState.data.value = [
      makeLiveMatch('epl-1', 'eng.1'),
      makeLiveMatch('unknown-1', 'per.1')
    ];
    const wrapper = mountPage();

    await wrapper.findAll('section[aria-label] button')[1].trigger('click');

    expect(renderedMatchIds(wrapper)).toEqual(['epl-1']);
  });

  it('uses league-specific supplemental matches only for filtered unresolved all-live data', async () => {
    liveState.data.value = [makeLiveMatch('epl-1', 'all')];
    liveState.supplementalMatches.value = [makeLiveMatch('epl-1', 'eng.1')];
    const wrapper = mountPage();

    expect(liveState.supplementalLeagueSlugs?.value).toEqual([]);

    await wrapper.findAll('button').find((button) => button.text() === 'EPL')?.trigger('click');

    expect(liveState.supplementalLeagueSlugs?.value).toEqual(['eng.1']);
    expect(renderedMatchIds(wrapper)).toEqual(['epl-1']);
    expect(wrapper.find('[data-testid="match-row"]').text()).toContain('eng.1');
  });
});

function mountPage() {
  return mount(LivePage, {
    global: {
      stubs: {
        MatchRow: {
          props: ['match'],
          template: '<div data-testid="match-row">{{ match.id }} {{ match.leagueSlug }}</div>'
        },
        StateBlock: {
          props: ['title', 'message'],
          template: '<div data-testid="state-block">{{ title }} {{ message }}</div>'
        }
      }
    }
  });
}

function renderedMatchIds(wrapper: ReturnType<typeof mountPage>): string[] {
  return wrapper
    .findAll('[data-testid="match-row"]')
    .map((row) => row.text().split(' ')[0]);
}

function makeLiveMatch(id: string, leagueSlug: string): FootballMatch {
  return {
    id,
    leagueSlug,
    leagueName: leagueSlug,
    leagueShortName: leagueSlug,
    kickoff: `2026-05-24T15:0${id.length % 10}:00Z`,
    status: 'in_progress',
    statusText: "45'",
    homeTeam: { id: `${id}-home`, name: 'Home', shortName: 'Home' },
    awayTeam: { id: `${id}-away`, name: 'Away', shortName: 'Away' },
    homeScore: 1,
    awayScore: 0
  };
}
