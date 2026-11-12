export function Icon({
  name,
}: {
  name:
    | 'id-card'
    | 'calendar'
    | 'clock'
    | 'pencil'
    | 'menu'
    | 'sun'
    | 'moon'
    | 'download'
    | 'close'
    | 'chevron-down'
    | 'log-out'
    | 'layers'
    | 'user'
    | 'shield'
    | 'plus'
    | 'arrow-right'
    | 'check'
    | 'alert'
    | 'search';
}) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'id-card' && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8" cy="10" r="1.5" />
          <path d="M5.5 15a2.5 2.5 0 0 1 5 0M14 9h4m-4 4h4" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18m-13 5h2" />
        </>
      )}
      {name === 'clock' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
      {name === 'pencil' && (
        <>
          <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z" />
        </>
      )}
      {name === 'menu' && <path d="M4 6h16M4 12h16M4 18h16" />}
      {name === 'sun' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </>
      )}
      {name === 'moon' && (
        <path d="M20.5 13a8.5 8.5 0 0 1-9.5-9.5A8.5 8.5 0 1 0 20.5 13Z" />
      )}
      {name === 'download' && <path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" />}
      {name === 'close' && <path d="m6 6 12 12M6 18 18 6" />}
      {name === 'chevron-down' && <path d="m7 10 5 5 5-5" />}
      {name === 'log-out' && (
        <>
          <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M9 12h12" />
        </>
      )}
      {name === 'layers' && (
        <>
          <path d="m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
        </>
      )}
      {name === 'user' && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </>
      )}
      {name === 'shield' && (
        <>
          <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" />
          <path d="m8 12 3 3 5-5" />
        </>
      )}
      {name === 'plus' && <path d="M12 5v14M5 12h14" />}
      {name === 'arrow-right' && <path d="M4 12h16m-6-6 6 6-6 6" />}
      {name === 'check' && <path d="m5 12 4 4L19 6" />}
      {name === 'alert' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6m0 4h.01" />
        </>
      )}
      {name === 'search' && (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </>
      )}
    </svg>
  );
}
