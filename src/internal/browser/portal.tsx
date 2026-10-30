import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal as reactCreatePortal } from 'react-dom';

export interface PortalProps {
  children?: ReactNode;
  container?: Element | DocumentFragment | null;
}

interface PortalContainerState {
  node: Element | DocumentFragment | null;
  owned: boolean;
}

export function canUseDOM() {
  return typeof window !== 'undefined'
    && typeof document !== 'undefined'
    && typeof document.createElement === 'function';
}

export function usePortalContainer(container?: Element | DocumentFragment | null) {
  const [state, setState] = useState<PortalContainerState>(() => ({
    node: container || null,
    owned: false,
  }));

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

export function createPortal(
  children: ReactNode,
  container: Element | DocumentFragment | null | undefined,
) {
  if (!container || typeof reactCreatePortal !== 'function') return null;
  return reactCreatePortal(children, container);
}

export function Portal({ children, container = null }: PortalProps) {
  const target = usePortalContainer(container);
  return target ? createPortal(children, target) : null;
}

export default Portal;
