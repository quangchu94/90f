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

vi.mock('vue-router', () => ({
  useRouter: () => routerMock
}));

vi.mock('@/composables/useStandings', () => ({
  useStandings: () => ({
    data: computed(() => []),
    isLoading: computed(() => false),
    isError: computed(() => false),
    refetch: vi.fn()
  })
}));

describe('StandingsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
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

  it('passes favorite leagues to the league selector', () => {
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
  });

  it('does not redirect valid routes outside favorite leagues', () => {
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
      params: { leagueSlug: 'eng.1' }
    });
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
