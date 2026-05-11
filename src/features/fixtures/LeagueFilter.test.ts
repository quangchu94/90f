import { mount } from '@vue/test-utils';
import { computed } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import LeagueFilter from './LeagueFilter.vue';

vi.mock('@/composables/useSoccerLeagues', () => ({
  useSoccerLeagues: () => ({
    data: computed(() => [
      { slug: 'fifa.world', name: 'FIFA World Cup', shortName: 'World Cup' },
      { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' },
      { slug: 'esp.1', name: 'La Liga', shortName: 'LaLiga' },
      { slug: 'uefa.champions', name: 'UEFA Champions League', shortName: 'UCL' },
      { slug: 'usa.1', name: 'MLS', shortName: 'MLS' }
    ]),
    isLoading: computed(() => false),
    isError: computed(() => false)
  })
}));

describe('LeagueFilter', () => {
  it('uses favorite leagues as a single-select filter', async () => {
    const wrapper = mountFilter();

    await wrapper.findAll('section > div:first-child button')[1].trigger('click');

    expect(wrapper.emitted('select')?.[0]).toEqual(['uefa.champions']);
  });

  it('groups ESPN catalog by world, continent, and country', async () => {
    const wrapper = mountFilter();

    await openPicker(wrapper);

    const text = wrapper.text();
    expect(text).toContain('World');
    expect(text).toContain('Europe / UEFA');
    expect(text).toContain('England');
    expect(text).toContain('Spain');
  });

  it('keeps search results inside league groups', async () => {
    const wrapper = mountFilter();

    await openPicker(wrapper);
    await wrapper.find('input[type="search"]').setValue('premier');

    expect(wrapper.text()).toContain('England');
    expect(wrapper.text()).toContain('Premier League');
    expect(wrapper.text()).not.toContain('La Liga');
  });

  it('emits selected catalog league as favorite', async () => {
    const wrapper = mountFilter();

    await openPicker(wrapper);
    await wrapper.find('input[type="search"]').setValue('mls');
    await wrapper.findAll('button').find((button) => button.text().includes('MLS'))?.trigger('click');

    expect(wrapper.emitted('addFavorite')?.[0]).toEqual([
      expect.objectContaining({ slug: 'usa.1', name: 'MLS', shortName: 'MLS' })
    ]);
  });

  it('emits unfavorite from the popup', async () => {
    const wrapper = mountFilter();

    await openPicker(wrapper);
    await wrapper.findAll('button').find((button) => button.text() === 'Bỏ theo dõi')?.trigger('click');

    expect(wrapper.emitted('removeFavorite')?.[0]).toEqual(['uefa.champions']);
  });
});

async function openPicker(wrapper: ReturnType<typeof mountFilter>) {
  await wrapper.findAll('section > div:first-child button').at(-1)?.trigger('click');
}

function mountFilter() {
  return mount(LeagueFilter, {
    props: {
      selectedLeagueSlug: 'eng.1',
      favoriteLeagues: [
        { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' },
        { slug: 'uefa.champions', name: 'UEFA Champions League', shortName: 'UCL' }
      ]
    }
  });
}
