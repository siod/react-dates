import React from 'react';
import SvgIcon from './SvgIcon';

export default function ChevronUp(props) {
  return (
    <SvgIcon viewBox="0 0 1000 1000" {...props}>
      <path d="M32 713l453-453c11-11 21-11 32 0l453 453c5 5 7 10 7 16 0 13-10 23-22 23-7 0-12-2-16-7L501 309 64 745c-4 4-9 7-15 7-7 0-12-3-17-7-9-11-9-21 0-32z" />
    </SvgIcon>
  );
}
