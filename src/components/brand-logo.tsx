export function Logo() {
  return (
    <a className="brand" href="/" aria-label="OverMCP home">
      <span className="brand-glyph" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="presentation">
          <rect width="64" height="64" rx="17" />
          <circle cx="27" cy="37" r="16" />
          <path d="M35 29 51 13M40 13h11v11" />
        </svg>
      </span>
    </a>
  );
}
