import { mount } from '@vue/test-utils';
import { computed } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
  });

  it('replaces unsupported country cup routes with a supported league fallback', () => {
    mount(StandingsPage, {
      props: { leagueSlug: 'esp.copa_del_rey' },
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
      params: { leagueSlug: 'esp.1' }
    });
  });
});
