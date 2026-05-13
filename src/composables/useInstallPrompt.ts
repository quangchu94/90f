import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

type InstallOutcome = 'accepted' | 'dismissed';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice?: Promise<{ outcome: InstallOutcome; platform: string }>;
  prompt: () => Promise<void>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  return window.matchMedia?.('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function isIosSafari(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isWebKit = /safari/i.test(userAgent);
  const isOtherIosBrowser = /crios|fxios|edgios/i.test(userAgent);
  return isIos && isWebKit && !isOtherIosBrowser;
}

export function useInstallPrompt() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
  const installed = ref(isStandaloneDisplay());
  const installDismissed = ref(false);
  const iosInstallHintDismissed = ref(false);

  const canInstall = computed(() => Boolean(deferredPrompt.value) && !installed.value && !installDismissed.value);
  const showIosInstallHint = computed(
    () => isIosSafari() && !installed.value && !iosInstallHintDismissed.value && !canInstall.value
  );
  const shouldShowInstallAction = computed(() => canInstall.value || showIosInstallHint.value);

  function handleBeforeInstallPrompt(event: Event): void {
    event.preventDefault();
    installDismissed.value = false;
    deferredPrompt.value = event as BeforeInstallPromptEvent;
  }

  function handleAppInstalled(): void {
    installed.value = true;
    deferredPrompt.value = null;
  }

  async function requestInstall(): Promise<void> {
    if (!deferredPrompt.value) {
      return;
    }

    const promptEvent = deferredPrompt.value;
    deferredPrompt.value = null;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice?.outcome === 'dismissed') {
      installDismissed.value = true;
    }
  }

  function dismissIosInstallHint(): void {
    iosInstallHintDismissed.value = true;
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  });

  return {
    canInstall,
    showIosInstallHint,
    shouldShowInstallAction,
    requestInstall,
    dismissIosInstallHint
  };
}
