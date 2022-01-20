import { SliceCaseReducers, createSlice, Slice, PayloadAction } from '@reduxjs/toolkit';

import type { CommandLineParameter } from '@rushstack/ts-command-line';

export interface IParameterState {
  parameters: CommandLineParameter[];
  args: string[];
}

const initialState: IParameterState = {
  parameters: [],
  args: []
};

export const parameterSlice: Slice<IParameterState, SliceCaseReducers<IParameterState>, string> = createSlice(
  {
    name: 'parameter',
    initialState,
    reducers: {
      initializeParameters: (state, action: PayloadAction<Pick<IParameterState, 'parameters'>>) => {
        return {
          ...state,
          parameters: action.payload.parameters
        };
      },
      onChangeFormValues: (state, action: PayloadAction<Record<string, unknown>>) => {}
    }
  }
);

export const { initializeParameters, onChangeFormValues } = parameterSlice.actions;

export default parameterSlice.reducer;
