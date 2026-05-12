import { mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LeagueFilter from './LeagueFilter.vue';

const mockedLeagues = ref([
  { slug: 'fifa.world', name: 'FIFA World Cup', shortName: 'World Cup' },
  { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' },
  { slug: 'eng.2', name: 'English League Championship', shortName: 'EFL Championship' },
  { slug: 'eng.fa', name: 'English FA Cup', shortName: 'FA Cup' },
  { slug: 'eng.league_cup', name: 'English League Cup', shortName: 'League Cup' },
  { slug: 'esp.1', name: 'La Liga', shortName: 'LaLiga' },
  { slug: 'ger.2', name: 'German 2. Bundesliga', shortName: '2.' },
  { slug: 'ita.2', name: 'Italian Serie B', shortName: 'Italian Serie B' },
  { slug: 'uefa.champions', name: 'UEFA Champions League', shortName: 'UCL' },
  { slug: 'usa.1', name: 'MLS', shortName: 'MLS' }
]);
const mockedIsFetching = ref(false);

vi.mock('@/composables/useSoccerLeagues', () => ({
  useSoccerLeagues: () => ({
    data: computed(() => mockedLeagues.value),
    isLoading: computed(() => false),
    isFetching: computed(() => mockedIsFetching.value),
    isError: computed(() => false)
  })
}));

describe('LeagueFilter', () => {
  beforeEach(() => {
    mockedIsFetching.value = false;
    mockedLeagues.value = [
      { slug: 'fifa.world', name: 'FIFA World Cup', shortName: 'World Cup' },
      { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' },
      { slug: 'eng.2', name: 'English League Championship', shortName: 'EFL Championship' },
      { slug: 'eng.fa', name: 'English FA Cup', shortName: 'FA Cup' },
      { slug: 'eng.league_cup', name: 'English League Cup', shortName: 'League Cup' },
      { slug: 'esp.1', name: 'La Liga', shortName: 'LaLiga' },
      { slug: 'ger.2', name: 'German 2. Bundesliga', shortName: '2.' },
      { slug: 'ita.2', name: 'Italian Serie B', shortName: 'Italian Serie B' },
      { slug: 'uefa.champions', name: 'UEFA Champions League', shortName: 'UCL' },
      { slug: 'usa.1', name: 'MLS', shortName: 'MLS' }
    ];
  });

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
    expect(text).toContain('Germany');
  });

  it('keeps search results inside league groups', async () => {
    const wrapper = mountFilter();

    await openPicker(wrapper);
    await wrapper.find('input[type="search"]').setValue('premier');

    expect(wrapper.text()).toContain('England');
    expect(wrapper.text()).toContain('EPL');
    expect(wrapper.text()).not.toContain('La Liga');
  });

  it('renders enriched detail short names for second-tier leagues', async () => {
    const wrapper = mountFilter();

    await openPicker(wrapper);
    await wrapper.find('input[type="search"]').setValue('championship');

    expect(wrapper.text()).toContain('EFL Championship');
    expect(wrapper.text()).not.toContain('English 2');

    await wrapper.find('input[type="search"]').setValue('serie b');

    expect(wrapper.text()).toContain('Italian Serie B');
    expect(wrapper.text()).not.toContain('Italian 2');
  });

  it('sorts leagues inside country groups by natural competition order', async () => {
    const wrapper = mountFilter();

    await openPicker(wrapper);
    const text = wrapper.find('[role="dialog"]').text();

    expect(text.indexOf('EPL')).toBeLessThan(text.indexOf('EFL Championship'));
    expect(text.indexOf('EFL Championship')).toBeLessThan(text.indexOf('FA Cup'));
    expect(text.indexOf('FA Cup')).toBeLessThan(text.indexOf('League Cup'));
  });

  it('shows existing priority data while background enrichment is still fetching', async () => {
    mockedIsFetching.value = true;
    mockedLeagues.value = [
      { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' },
      { slug: 'uefa.champions', name: 'UEFA Champions League', shortName: 'UCL' }
    ];
    const wrapper = mountFilter();

    await openPicker(wrapper);

    expect(wrapper.text()).toContain('EPL');
    expect(wrapper.text()).toContain('Đang tải thêm giải...');
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

  it('renders safe league labels instead of weak ESPN abbreviations', async () => {
    const wrapper = mountFilter({
      selectedLeagueSlug: 'ger.2',
      favoriteLeagues: [{ slug: 'ger.2', name: 'ger.2', shortName: '2.' }]
    });

    expect(wrapper.find('section > div:first-child button').text()).toBe('2. Bundesliga');

    await openPicker(wrapper);

    expect(wrapper.text()).toContain('2. Bundesliga');
    expect(wrapper.text()).not.toContain('German 2');
  });

  it('collapses and expands league groups while search results stay visible', async () => {
    const wrapper = mountFilter({
      selectedLeagueSlug: 'ger.2',
      favoriteLeagues: [{ slug: 'ger.2', name: 'ger.2', shortName: '2.' }]
    });

    await openPicker(wrapper);
    const dialogText = () => wrapper.find('[role="dialog"]').text();

    const germanyHeader = () => wrapper.findAll('button').find((button) => button.text().includes('Germany'));
    expect(dialogText()).toContain('2. Bundesliga');

    await germanyHeader()?.trigger('click');
    expect(dialogText()).not.toContain('2. Bundesliga');

    await germanyHeader()?.trigger('click');
    expect(dialogText()).toContain('2. Bundesliga');

    await germanyHeader()?.trigger('click');
    await wrapper.find('input[type="search"]').setValue('bundesliga');
    expect(dialogText()).toContain('2. Bundesliga');
  });
});

async function openPicker(wrapper: ReturnType<typeof mountFilter>) {
  await wrapper.findAll('section > div:first-child button').at(-1)?.trigger('click');
}

function mountFilter(props?: Partial<InstanceType<typeof LeagueFilter>['$props']>) {
  return mount(LeagueFilter, {
    props: {
      selectedLeagueSlug: 'eng.1',
      favoriteLeagues: [
        { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' },
        { slug: 'uefa.champions', name: 'UEFA Champions League', shortName: 'UCL' }
      ],
      ...props
    }
  });
}
