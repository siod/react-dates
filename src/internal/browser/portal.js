import React, { useEffect, useState } from 'react';
import { createPortal as reactCreatePortal } from 'react-dom';

/** Return true without touching browser globals during SSR/module evaluation. */
export function canUseDOM() {
  return typeof window !== 'undefined'
    && typeof document !== 'undefined'
    && typeof document.createElement === 'function';
}

/**
 * Lazily create a body portal container. A container is removed only if this
 * instance created it, so a caller-owned container is never removed by us.
 */
export function usePortalContainer(container) {
  const [state, setState] = useState(() => ({ node: container || null, owned: false }));

  useEffect(() => {
    if (container) {
      setState({ node: container, owned: false });
      return undefined;
    }
    if (!canUseDOM()) return undefined;

    const node = document.createElement('div');
    document.body.appendChild(node);
    setState({ node, owned: true });
    return () => {
      node.remove();
    };
  }, [container]);

  return state.node;
}

export function createPortal(children, container) {
  if (!container || typeof reactCreatePortal !== 'function') return null;
  return reactCreatePortal(children, container);
}

export function Portal({ children, container }) {
  const target = usePortalContainer(container);
  return target ? createPortal(children, target) : null;
}

Portal.defaultProps = { container: null };

export default Portal;
