export function Icon({ name }: { name: 'sun' | 'moon' | 'download' | 'close' }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {name === 'sun' && <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>}
    {name === 'moon' && <path d="M20.5 13a8.5 8.5 0 0 1-9.5-9.5A8.5 8.5 0 1 0 20.5 13Z" />}
    {name === 'download' && <path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" />}
    {name === 'close' && <path d="m6 6 12 12M6 18 18 6" />}
  </svg>;
}
