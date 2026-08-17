import {
  cleanup,
  configure,
} from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import { installRuntimeErrorGuard } from './helpers/runtime-errors.js';

configure({ reactStrictMode: true });

let runtimeErrorGuard;

beforeEach(() => {
  runtimeErrorGuard = installRuntimeErrorGuard({
    unhandled: { target: globalThis.window || globalThis },
  });
});

afterEach(() => {
  try {
    cleanup();
    runtimeErrorGuard.assertClean();
  } finally {
    runtimeErrorGuard.restore();
    runtimeErrorGuard = null;
  }
});
