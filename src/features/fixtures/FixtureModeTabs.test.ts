import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FixtureModeTabs from './FixtureModeTabs.vue';

describe('FixtureModeTabs', () => {
  it('renders result and fixture tabs', () => {
    const wrapper = mount(FixtureModeTabs, {
      props: { modelValue: 'results' }
    });

    expect(wrapper.text()).toContain('Kết quả');
    expect(wrapper.text()).toContain('Lịch đấu');
  });

  it('emits mode updates when a tab is clicked', async () => {
    const wrapper = mount(FixtureModeTabs, {
      props: { modelValue: 'results' }
    });

    await wrapper.findAll('button')[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['fixtures']);
  });
});
