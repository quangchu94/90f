import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useInstallPrompt } from './useInstallPrompt';

function mountInstallPromptHarness() {
  return mount(
    defineComponent({
      setup() {
        return useInstallPrompt();
      },
      template: `
        <div>
          <button v-if="shouldShowInstallAction" type="button" @click="requestInstall">Install</button>
          <p v-if="showIosInstallHint">iOS hint</p>
        </div>
      `
    })
  );
}

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true
  });
}

describe('useInstallPrompt', () => {
  const originalMatchMedia = window.matchMedia;
  const originalUserAgent = window.navigator.userAgent;

  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    setUserAgent('Mozilla/5.0');
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    setUserAgent(originalUserAgent);
    vi.restoreAllMocks();
  });

  it('shows an install action after beforeinstallprompt and calls prompt on click', async () => {
    const wrapper = mountInstallPromptHarness();
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' })
    });

    window.dispatchEvent(event);
    await nextTick();

    expect(wrapper.find('button').exists()).toBe(true);

    await wrapper.find('button').trigger('click');

    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('hides the native install action when the prompt is dismissed', async () => {
    const wrapper = mountInstallPromptHarness();
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' })
    });

    window.dispatchEvent(event);
    await nextTick();
    await wrapper.find('button').trigger('click');
    await nextTick();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('shows the iOS install hint when Safari cannot use a native prompt', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );

    const wrapper = mountInstallPromptHarness();

    expect(wrapper.text()).toContain('iOS hint');
  });
});
