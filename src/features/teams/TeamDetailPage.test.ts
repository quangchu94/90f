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

vi.mock('vue-router', () => ({
  useRoute: () => routerMock.route,
  useRouter: () => ({ replace: routerMock.replace })
}));

vi.mock('@/composables/useTeamDetail', () => ({
  useTeamDetail: () => ({
    data: computed(() => ({
      id: '359',
      leagueSlug: 'eng.1',
      name: 'Arsenal',
      shortName: 'Arsenal',
      abbreviation: 'ARS',
      venue: 'Emirates Stadium'
    })),
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
    data: computed(() => [
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
        awayScore: 1
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
        awayScore: 0
      },
      {
        id: '402',
        leagueSlug: 'eng.1',
        leagueName: 'Premier League',
        kickoff: '2026-05-10T14:00:00Z',
        status: 'scheduled',
        statusText: 'Scheduled',
        homeTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' },
        awayTeam: { id: '3', name: 'Liverpool', shortName: 'Liverpool' }
      },
      {
        id: '404',
        leagueSlug: 'uefa.champions',
        leagueName: 'UEFA Champions League',
        kickoff: '2026-05-12T19:00:00Z',
        status: 'scheduled',
        statusText: 'Scheduled',
        homeTeam: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
        awayTeam: { id: '359', name: 'Arsenal', shortName: 'Arsenal' }
      }
    ]),
    isLoading: computed(() => false),
    isError: computed(() => false),
    refetch: vi.fn()
  })
}));

vi.mock('@/stores/preferencesStore', () => ({
  usePreferencesStore: () => ({
    isFavoriteTeam: () => false,
    toggleFavoriteTeam: vi.fn()
  })
}));

describe('TeamDetailPage', () => {
  beforeEach(() => {
    routerMock.route.fullPath = '/team/eng.1/359';
    routerMock.route.query = {};
    routerMock.replace.mockClear();
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

  it('replaces unsupported route league with a supported country fallback', () => {
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
