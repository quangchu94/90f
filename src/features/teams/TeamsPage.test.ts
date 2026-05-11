import { mount } from '@vue/test-utils';
import { computed } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeamsPage from './TeamsPage.vue';

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn()
}));

vi.mock('vue-router', () => ({
  useRouter: () => routerMock
}));

vi.mock('@/composables/useTeams', () => ({
  useTeams: () => ({
    data: computed(() => []),
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

describe('TeamsPage', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
  });

  it('replaces unsupported country cup routes with a supported league fallback', () => {
    mount(TeamsPage, {
      props: { leagueSlug: 'esp.copa_del_rey' },
      global: {
        stubs: {
          LeagueRouteSelector: true,
          StateBlock: true,
          TeamCard: true
        }
      }
    });

    expect(routerMock.replace).toHaveBeenCalledWith({
      name: 'teams',
      params: { leagueSlug: 'esp.1' }
    });
  });
});
