import { configureStore } from '@reduxjs/toolkit';
import type { EnhancedStore } from '@reduxjs/toolkit';
import parameterReducer, { IParameterState } from './slices/parameter';

export interface IRootState {
  parameter: IParameterState;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Window {
    __DATA__: IRootState;
  }
}

export const store: EnhancedStore<IRootState> = configureStore<IRootState>({
  preloadedState: window.__DATA__,
  reducer: {
    parameter: parameterReducer
  }
});

store.subscribe(() => {
  console.log('store changes', store.getState());
});

export type AppDispatch = typeof store.dispatch;
