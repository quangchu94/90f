import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { computed } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFixturesStore } from '@/stores/fixturesStore';
import StandingsPage from './StandingsPage.vue';

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn()
}));
const routeMock = vi.hoisted(() => ({
  query: {} as Record<string, string>
}));
const useStandingsMock = vi.hoisted(() => vi.fn());
const useLeagueSeasonsMock = vi.hoisted(() => vi.fn());

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => routerMock
}));

vi.mock('@/composables/useStandings', () => ({
  useStandings: useStandingsMock
}));

vi.mock('@/composables/useLeagueSeasons', () => ({
  formatSeasonLabel: (value: string) => `${value}-${String((Number(value) + 1) % 100).padStart(2, '0')}`,
  useLeagueSeasons: useLeagueSeasonsMock
}));

describe('StandingsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    routeMock.query = {};
    useStandingsMock.mockReturnValue({
      data: computed(() => []),
      isLoading: computed(() => false),
      isError: computed(() => false),
      refetch: vi.fn()
    });
    useLeagueSeasonsMock.mockReturnValue({
      data: computed(() => [
        { value: '2025', label: '2025-26' },
        { value: '2024', label: '2024-25' },
        { value: '2023', label: '2023-24' }
      ]),
      isLoading: computed(() => false)
    });
  });

  it('replaces invalid routes with a favorite league fallback', () => {
    const store = useFixturesStore();
    store.favoriteLeagues = [{ slug: 'usa.1', name: 'MLS', shortName: 'MLS' }];
    store.selectedLeagueSlug = 'usa.1';

    mount(StandingsPage, {
      props: { leagueSlug: 'not-a-league' },
      global: {
        stubs: {
          LeagueRouteSelector: true,
          StateBlock: true,
          StandingsGroupTable: true
        }
      }
    });

    expect(routerMock.replace).toHaveBeenCalledWith({
      name: 'standings',
      params: { leagueSlug: 'usa.1' }
    });
  });

  it('passes favorite leagues to the league selector inside the standings control header', () => {
    const store = useFixturesStore();
    store.favoriteLeagues = [
      { slug: 'usa.1', name: 'MLS', shortName: 'MLS' },
      { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' }
    ];
    store.selectedLeagueSlug = 'usa.1';

    const wrapper = mount(StandingsPage, {
      props: { leagueSlug: 'usa.1' },
      global: {
        stubs: {
          LeagueRouteSelector: true,
          StateBlock: true,
          StandingsGroupTable: true
        }
      }
    });

    expect(wrapper.findComponent({ name: 'LeagueRouteSelector' }).props('leagues')).toEqual(store.favoriteLeagues);
    expect(wrapper.find('[data-testid="standings-control-header"]').findComponent({ name: 'LeagueRouteSelector' }).exists()).toBe(true);
  });

  it('does not redirect valid routes outside favorite leagues', () => {
    routeMock.query = { season: '2025' };
    const store = useFixturesStore();
    store.favoriteLeagues = [{ slug: 'eng.1', name: 'Premier League', shortName: 'EPL' }];
    store.selectedLeagueSlug = 'eng.1';

    mount(StandingsPage, {
      props: { leagueSlug: 'usa.1' },
      global: {
        stubs: {
          LeagueRouteSelector: true,
          StateBlock: true,
          StandingsGroupTable: true
        }
      }
    });

    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it('pushes the selected favorite league route', async () => {
    const store = useFixturesStore();
    store.favoriteLeagues = [
      { slug: 'usa.1', name: 'MLS', shortName: 'MLS' },
      { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' }
    ];
    store.selectedLeagueSlug = 'usa.1';

    const wrapper = mount(StandingsPage, {
      props: { leagueSlug: 'usa.1' },
      global: {
        stubs: {
          StateBlock: true,
          StandingsGroupTable: true
        }
      }
    });

    await wrapper.find('select').setValue('eng.1');

    expect(routerMock.push).toHaveBeenCalledWith({
      name: 'standings',
      params: { leagueSlug: 'eng.1' },
      query: { season: '2025' }
    });
  });

  it('passes the route season query to standings data fetching', () => {
    routeMock.query = { season: '2024' };

    mount(StandingsPage, {
      props: { leagueSlug: 'eng.1' },
      global: {
        stubs: {
          LeagueRouteSelector: true,
          StateBlock: true,
          StandingsGroupTable: true
        }
      }
    });

    const [, season] = useStandingsMock.mock.calls.at(-1) ?? [];
    expect(season.value).toBe('2024');
  });

  it('replaces missing or invalid season query with the latest season', () => {
    routeMock.query = { season: '1999' };

    mount(StandingsPage, {
      props: { leagueSlug: 'eng.1' },
      global: {
        stubs: {
          LeagueRouteSelector: true,
          StateBlock: true,
          StandingsGroupTable: true
        }
      }
    });

    expect(routerMock.replace).toHaveBeenCalledWith({
      name: 'standings',
      params: { leagueSlug: 'eng.1' },
      query: { season: '2025' }
    });
  });

  it('moves back and forward through seasons with arrow buttons', async () => {
    routeMock.query = { season: '2024' };
    const wrapper = mount(StandingsPage, {
      props: { leagueSlug: 'eng.1' },
      global: {
        stubs: {
          StateBlock: true,
          StandingsGroupTable: true
        }
      }
    });

    await wrapper.find('button[aria-label="Lùi 1 mùa giải"]').trigger('click');
    expect(routerMock.push).toHaveBeenCalledWith({
      name: 'standings',
      params: { leagueSlug: 'eng.1' },
      query: { season: '2023' }
    });

    await wrapper.find('button[aria-label="Tiến 1 mùa giải"]').trigger('click');
    expect(routerMock.push).toHaveBeenCalledWith({
      name: 'standings',
      params: { leagueSlug: 'eng.1' },
      query: { season: '2025' }
    });
  });

  it('disables moving forward when viewing the latest season', () => {
    routeMock.query = { season: '2025' };
    const wrapper = mount(StandingsPage, {
      props: { leagueSlug: 'eng.1' },
      global: {
        stubs: {
          StateBlock: true,
          StandingsGroupTable: true
        }
      }
    });

    expect(wrapper.find('button[aria-label="Tiến 1 mùa giải"]').attributes('disabled')).toBeDefined();
  });

  it('uses the league short label in the page subtitle', () => {
    const wrapper = mount(StandingsPage, {
      props: { leagueSlug: 'esp.1' },
      global: {
        stubs: {
          LeagueRouteSelector: true,
          StateBlock: true,
          StandingsGroupTable: true
        }
      }
    });

    expect(wrapper.text()).toContain('LaLiga');
    expect(wrapper.text()).not.toContain('La Liga');
  });
});
