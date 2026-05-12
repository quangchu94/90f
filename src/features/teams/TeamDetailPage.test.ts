import { mount, RouterLinkStub } from '@vue/test-utils';
import { computed } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeamDetailPage from './TeamDetailPage.vue';

const routerMock = vi.hoisted(() => ({
  route: {
    fullPath: '/team/eng.1/359',
    query: {} as Record<string, string>
  },
  replace: vi.fn()
}));

const teamDetailMock = vi.hoisted(() => ({
  team: {
    id: '359',
    leagueSlug: 'eng.1',
    name: 'Arsenal',
    shortName: 'Arsenal',
    abbreviation: 'ARS',
    venue: 'Emirates Stadium' as string | undefined
  }
}));

const teamScheduleMock = vi.hoisted(() => ({
  matches: [
    {
      id: '401',
      leagueSlug: 'eng.1',
      leagueName: 'Premier League',
      kickoff: '2026-05-08T14:00:00Z',
      status: 'finished',
      statusText: 'FT',
      homeTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' },
      awayTeam: { id: '2', name: 'Chelsea', shortName: 'Chelsea' },
      homeScore: 2,
      awayScore: 1,
      venue: 'Emirates Stadium'
    },
    {
      id: '403',
      leagueSlug: 'uefa.champions',
      leagueName: 'UEFA Champions League',
      kickoff: '2026-05-09T19:00:00Z',
      status: 'finished',
      statusText: 'FT',
      homeTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' },
      awayTeam: { id: '86', name: 'Real Madrid', shortName: 'Real Madrid' },
      homeScore: 1,
      awayScore: 0,
      venue: 'Emirates Stadium',
      neutralSite: true
    },
    {
      id: '402',
      leagueSlug: 'eng.1',
      leagueName: 'Premier League',
      kickoff: '2026-05-10T14:00:00Z',
      status: 'scheduled',
      statusText: 'Scheduled',
      homeTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' },
      awayTeam: { id: '3', name: 'Liverpool', shortName: 'Liverpool' },
      venue: 'Emirates Stadium'
    },
    {
      id: '404',
      leagueSlug: 'uefa.champions',
      leagueName: 'UEFA Champions League',
      kickoff: '2026-05-12T19:00:00Z',
      status: 'scheduled',
      statusText: 'Scheduled',
      homeTeam: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
      awayTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' },
      venue: 'Camp Nou'
    }
  ] as Array<Record<string, unknown>>,
  isLoading: false,
  isFetching: false,
  isError: false
}));

const routeLeagueMock = vi.hoisted(() => ({
  redirectSlugs: new Set<string>(),
  fallbackBySlug: new Map<string, string>([['esp.copa_del_rey', 'esp.1']]),
  leagueBySlug: new Map<string, { slug: string; name: string; shortName?: string }>([
    ['eng.1', { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' }],
    ['usa.1', { slug: 'usa.1', name: 'MLS', shortName: 'MLS' }]
  ])
}));

vi.mock('vue-router', () => ({
  useRoute: () => routerMock.route,
  useRouter: () => ({ replace: routerMock.replace })
}));

vi.mock('@/composables/useTeamRouteLeague', () => ({
  useTeamRouteLeague: (leagueSlug: { value: string }) => {
    const effectiveLeague = computed(() =>
      routeLeagueMock.leagueBySlug.get(leagueSlug.value) ??
      routeLeagueMock.leagueBySlug.get(routeLeagueMock.fallbackBySlug.get(leagueSlug.value) ?? 'eng.1')
    );

    return {
      effectiveLeague,
      effectiveLeagueSlug: computed(() => effectiveLeague.value?.slug ?? 'eng.1'),
      canUseLeague: computed(() => !routeLeagueMock.redirectSlugs.has(leagueSlug.value)),
      shouldRedirect: computed(() => routeLeagueMock.redirectSlugs.has(leagueSlug.value)),
      fallbackLeagueSlug: computed(() => routeLeagueMock.fallbackBySlug.get(leagueSlug.value) ?? 'eng.1')
    };
  }
}));

vi.mock('@/composables/useTeamDetail', () => ({
  useTeamDetail: () => ({
    data: computed(() => teamDetailMock.team),
    isLoading: computed(() => false),
    isError: computed(() => false),
    refetch: vi.fn()
  })
}));

vi.mock('@/composables/useTeamRoster', () => ({
  useTeamRoster: () => ({
    data: computed(() => []),
    isLoading: computed(() => false),
    isError: computed(() => false),
    refetch: vi.fn()
  })
}));

vi.mock('@/composables/useTeamSchedule', () => ({
  useTeamSchedule: () => ({
    data: computed(() => teamScheduleMock.matches),
    isLoading: computed(() => teamScheduleMock.isLoading),
    isFetching: computed(() => teamScheduleMock.isFetching),
    isError: computed(() => teamScheduleMock.isError),
    refetch: vi.fn()
  })
}));

vi.mock('@/stores/preferencesStore', () => ({
  usePreferencesStore: () => ({
    isFavoriteTeam: () => false,
    toggleFavoriteTeam: vi.fn()
  })
}));

function makeDefaultTeamScheduleMatches() {
  return [
    {
      id: '401',
      leagueSlug: 'eng.1',
      leagueName: 'Premier League',
      kickoff: '2026-05-08T14:00:00Z',
      status: 'finished',
      statusText: 'FT',
      homeTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' },
      awayTeam: { id: '2', name: 'Chelsea', shortName: 'Chelsea' },
      homeScore: 2,
      awayScore: 1,
      venue: 'Emirates Stadium'
    },
    {
      id: '403',
      leagueSlug: 'uefa.champions',
      leagueName: 'UEFA Champions League',
      kickoff: '2026-05-09T19:00:00Z',
      status: 'finished',
      statusText: 'FT',
      homeTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' },
      awayTeam: { id: '86', name: 'Real Madrid', shortName: 'Real Madrid' },
      homeScore: 1,
      awayScore: 0,
      venue: 'Wembley Stadium',
      neutralSite: true
    },
    {
      id: '402',
      leagueSlug: 'eng.1',
      leagueName: 'Premier League',
      kickoff: '2026-05-10T14:00:00Z',
      status: 'scheduled',
      statusText: 'Scheduled',
      homeTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' },
      awayTeam: { id: '3', name: 'Liverpool', shortName: 'Liverpool' },
      venue: 'Emirates Stadium'
    },
    {
      id: '404',
      leagueSlug: 'uefa.champions',
      leagueName: 'UEFA Champions League',
      kickoff: '2026-05-12T19:00:00Z',
      status: 'scheduled',
      statusText: 'Scheduled',
      homeTeam: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
      awayTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' },
      venue: 'Camp Nou'
    }
  ];
}

describe('TeamDetailPage', () => {
  beforeEach(() => {
    routerMock.route.fullPath = '/team/eng.1/359';
    routerMock.route.query = {};
    routerMock.replace.mockClear();
    teamDetailMock.team = {
      id: '359',
      leagueSlug: 'eng.1',
      name: 'Arsenal',
      shortName: 'Arsenal',
      abbreviation: 'ARS',
      venue: 'Emirates Stadium'
    };
    teamScheduleMock.matches = makeDefaultTeamScheduleMatches();
    teamScheduleMock.isLoading = false;
    teamScheduleMock.isFetching = false;
    teamScheduleMock.isError = false;
    routeLeagueMock.redirectSlugs.clear();
  });

  it('renders venue and upcoming team fixtures by default', () => {
    const wrapper = mount(TeamDetailPage, {
      props: { leagueSlug: 'eng.1', teamId: '359' },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    expect(wrapper.text()).toContain('Emirates Stadium');
    expect(wrapper.text()).toContain('Liverpool');
    expect(wrapper.text()).toContain('Barcelona');
    expect(wrapper.text()).toContain('EPL');
    expect(wrapper.text()).toContain('UCL');
    expect(wrapper.text()).toContain('10/05/2026');
    expect(wrapper.text()).not.toContain('Chelsea');
  });

  it('infers venue from non-neutral home schedule matches when team venue is missing', () => {
    teamDetailMock.team = {
      ...teamDetailMock.team,
      venue: undefined
    };
    teamScheduleMock.matches = [
      {
        ...makeDefaultTeamScheduleMatches()[0],
        venue: 'Wembley Stadium',
        neutralSite: true
      },
      {
        ...makeDefaultTeamScheduleMatches()[2],
        venue: 'Emirates Stadium'
      }
    ];

    const wrapper = mount(TeamDetailPage, {
      props: { leagueSlug: 'eng.1', teamId: '359' },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    expect(wrapper.text()).toContain('Emirates Stadium');
    expect(wrapper.text()).not.toContain('Wembley Stadium');
  });

  it('shows loading copy while schedule is still fetching and no matches are visible', () => {
    teamScheduleMock.matches = [];
    teamScheduleMock.isFetching = true;

    const wrapper = mount(TeamDetailPage, {
      props: { leagueSlug: 'eng.1', teamId: '359' },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    expect(wrapper.text()).toContain('Đang tải dữ liệu');
    expect(wrapper.text()).not.toContain('Chưa có lịch thi đấu cho đội này.');
  });

  it('shows empty schedule copy only after schedule fetching is done', () => {
    teamScheduleMock.matches = [];
    teamScheduleMock.isFetching = false;

    const wrapper = mount(TeamDetailPage, {
      props: { leagueSlug: 'eng.1', teamId: '359' },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    expect(wrapper.text()).toContain('Chưa có lịch thi đấu cho đội này.');
    expect(wrapper.text()).not.toContain('Đang tải dữ liệu');
  });

  it('switches team schedule tabs to finished multi-league results newest first', async () => {
    const wrapper = mount(TeamDetailPage, {
      props: { leagueSlug: 'eng.1', teamId: '359' },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    const tabButtons = wrapper.findAll('section[aria-label] button');
    await tabButtons[0].trigger('click');

    expect(wrapper.text()).toContain('Chelsea');
    expect(wrapper.text()).toContain('Real Madrid');
    expect(wrapper.text()).toContain('EPL');
    expect(wrapper.text()).toContain('UCL');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).not.toContain('Liverpool');

    expect(wrapper.text().indexOf('Real Madrid')).toBeLessThan(wrapper.text().indexOf('Chelsea'));
  });

  it('filters team schedule by league without resetting across tabs', async () => {
    const wrapper = mount(TeamDetailPage, {
      props: { leagueSlug: 'eng.1', teamId: '359' },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    const select = wrapper.find('select');
    expect((select.element as HTMLSelectElement).value).toBe('all');

    await select.setValue('uefa.champions');

    expect(wrapper.text()).toContain('Barcelona');
    expect(wrapper.text()).not.toContain('Liverpool');
    expect(routerMock.replace).toHaveBeenLastCalledWith({
      query: { league: 'uefa.champions' }
    });

    const tabButtons = wrapper.findAll('section[aria-label] button');
    await tabButtons[0].trigger('click');

    expect(wrapper.text()).toContain('Real Madrid');
    expect(wrapper.text()).not.toContain('Chelsea');
    expect(routerMock.replace).toHaveBeenLastCalledWith({
      query: { tab: 'results', league: 'uefa.champions' }
    });
  });

  it('restores schedule tab and league filter from query params', () => {
    routerMock.route.fullPath = '/team/eng.1/359?tab=results&league=uefa.champions';
    routerMock.route.query = { tab: 'results', league: 'uefa.champions' };

    const wrapper = mount(TeamDetailPage, {
      props: { leagueSlug: 'eng.1', teamId: '359' },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('uefa.champions');
    expect(wrapper.text()).toContain('Real Madrid');
    expect(wrapper.text()).not.toContain('Chelsea');
    expect(wrapper.text()).not.toContain('Barcelona');
  });

  it('keeps catalog-backed team route leagues such as MLS without redirecting', () => {
    teamDetailMock.team = {
      id: '20232',
      leagueSlug: 'usa.1',
      name: 'San Diego FC',
      shortName: 'San Diego',
      abbreviation: 'SD',
      venue: 'Snapdragon Stadium'
    };
    teamScheduleMock.matches = [
      {
        id: '761611',
        leagueSlug: 'usa.1',
        leagueName: 'MLS',
        kickoff: '2026-05-10T02:30:00Z',
        status: 'scheduled',
        statusText: 'Scheduled',
        homeTeam: { id: '20232', name: 'San Diego FC', shortName: 'San Diego' },
        awayTeam: { id: '184', name: 'LA Galaxy', shortName: 'LA Galaxy' },
        venue: 'Snapdragon Stadium'
      }
    ];

    const wrapper = mount(TeamDetailPage, {
      props: { leagueSlug: 'usa.1', teamId: '20232' },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('MLS');
    expect(wrapper.text()).toContain('LA Galaxy');
  });

  it('replaces unsupported route league with a supported country fallback', () => {
    routeLeagueMock.redirectSlugs.add('esp.copa_del_rey');

    mount(TeamDetailPage, {
      props: { leagueSlug: 'esp.copa_del_rey', teamId: '83' },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    expect(routerMock.replace).toHaveBeenCalledWith({
      name: 'team-detail',
      params: { leagueSlug: 'esp.1', teamId: '83' },
      query: {}
    });
  });
});
