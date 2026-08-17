import React from 'react';

export default function SvgIcon({ title, children, ...props }) {
  const labelled = Boolean(title || props['aria-label'] || props['aria-labelledby']);
  return (
    <svg
      focusable="false"
      aria-hidden={labelled ? undefined : true}
      role={labelled ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
