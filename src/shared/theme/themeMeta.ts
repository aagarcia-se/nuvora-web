import { darkThemeColor, lightThemeColor } from '@/shared/config/brand';

export function applyThemeColor(dark: boolean) {
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelector('#theme-color')?.setAttribute('content', dark ? darkThemeColor : lightThemeColor);
  document.querySelector('#apple-status-bar-style')?.setAttribute('content', dark ? 'black-translucent' : 'default');
}
