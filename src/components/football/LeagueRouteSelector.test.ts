import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LeagueRouteSelector from './LeagueRouteSelector.vue';

describe('LeagueRouteSelector', () => {
  it('renders leagues from props', () => {
    const wrapper = mount(LeagueRouteSelector, {
      props: {
        modelValue: 'usa.1',
        leagues: [
          { slug: 'usa.1', name: 'MLS', shortName: 'MLS' },
          { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' }
        ]
      }
    });

    const options = wrapper.findAll('option').map((option) => option.text());

    expect(options).toEqual(['MLS', 'EPL']);
  });

  it('emits the selected league slug', async () => {
    const wrapper = mount(LeagueRouteSelector, {
      props: {
        modelValue: 'usa.1',
        leagues: [
          { slug: 'usa.1', name: 'MLS', shortName: 'MLS' },
          { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' }
        ]
      }
    });

    await wrapper.find('select').setValue('eng.1');

    expect(wrapper.emitted('update:modelValue')).toEqual([['eng.1']]);
  });

  it('adds the current route league when it is not in favorites', () => {
    const wrapper = mount(LeagueRouteSelector, {
      props: {
        modelValue: 'usa.1',
        leagues: [{ slug: 'eng.1', name: 'Premier League', shortName: 'EPL' }]
      }
    });

    expect(wrapper.find('select').element.value).toBe('usa.1');
    expect(wrapper.findAll('option').map((option) => option.attributes('value'))).toEqual(['usa.1', 'eng.1']);
  });
});
