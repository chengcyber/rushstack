import { SliceCaseReducers, createSlice, Slice, PayloadAction } from '@reduxjs/toolkit';

import type { FieldValues} from 'react-hook-form';
import type { ICommandLineParameter } from '../../Message/fromExtension';

export interface IParameterState {
  parameters: ICommandLineParameter[];
  args: (string | [string, string])[];
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
      onChangeFormValues: (state, action: PayloadAction<FieldValues>) => {
        const fieldValues: FieldValues = action.payload;
        const args: (string | [string, string])[] = [];
        for (const parameter of state.parameters) {
          const name = parameter.longName;
          const value: string | number | string[] | number[] | undefined = fieldValues[name];
          if (typeof value === 'undefined') {
            continue;
          }
          if (Array.isArray(value)) {
            if (value.length === 0) {
              continue;
            }
            value.forEach((v: string | number) => {
              args.push([name, String(v)]);
            });
            continue;
          }

          // empty string or 'false'
          if (typeof value === 'string' && (!value || value === 'false')) {
            continue;
          }
          if (value === 'true') {
            args.push(name);
          } else {
            args.push([name, String(value)]);
          }
          return {
            ...state,
            args,
          }
        }
      }
    }
  }
);

export const { initializeParameters, onChangeFormValues } = parameterSlice.actions;

export default parameterSlice.reducer;
