import { SliceCaseReducers, createSlice, Slice, PayloadAction } from '@reduxjs/toolkit';

import { useAppSelector } from '../hooks';

import type { FieldValues } from 'react-hook-form';
import type { CommandLineParameterKind } from '@rushstack/ts-command-line';
import { store } from '..';

export interface ICommandLineParameter {
  readonly kind: CommandLineParameterKind;
  readonly longName: string;
  readonly shortName: string | undefined;
  readonly description: string;
  readonly required: boolean;
}

export interface IParameterState {
  commandName: string;
  parameters: ICommandLineParameter[];
  argsKV: Record<string, number | string | boolean | undefined | string[] | number[]>;
  searchText: string;
}

const initialState: IParameterState = {
  commandName: '',
  parameters: [],
  argsKV: {},
  searchText: ''
};

export const parameterSlice: Slice<IParameterState, SliceCaseReducers<IParameterState>, string> = createSlice(
  {
    name: 'parameter',
    initialState,
    reducers: {
      initializeParameters: (state, action: PayloadAction<IParameterState>) => {
        console.log('aaaa', action.payload);
        Object.assign(state, action.payload);
      },
      onChangeFormDefaultValues: (state, action: PayloadAction<FieldValues>) => {
        // clear argsKV first
        state.argsKV = {};
        patchStateByFormValues(state, action.payload);
      },
      onChangeFormValues: (state, action: PayloadAction<FieldValues>) => {
        patchStateByFormValues(state, action.payload);
      },
      onChangeSearchText: (state, action: PayloadAction<string>) => {
        state.searchText = action.payload;
      }
    }
  }
);

function patchStateByFormValues(state: IParameterState, fieldValues: FieldValues): void {
  for (const [key, value] of Object.entries(fieldValues)) {
    if (typeof value === 'string') {
      switch (value) {
        case '': {
          state.argsKV[key] = undefined;
          break;
        }
        case 'true': {
          state.argsKV[key] = true;
          break;
        }
        case 'false': {
          state.argsKV[key] = false;
          break;
        }
        default: {
          state.argsKV[key] = value;
          break;
        }
      }
    } else if (Array.isArray(value)) {
      const filteredValue: string[] = value
        .map(({ value }: { value: string | number }) => String(value))
        .filter(Boolean);
      if (filteredValue.length) {
        state.argsKV[key] = filteredValue;
      }
    } else {
      state.argsKV[key] = value;
    }
  }
}

export const { initializeParameters, onChangeFormDefaultValues, onChangeFormValues, onChangeSearchText } =
  parameterSlice.actions;

export const useParameterArgs: () => string[] = () =>
  useAppSelector((state) => {
    const args: string[] = [];
    for (const [k, v] of Object.entries(state.parameter.argsKV)) {
      if (v) {
        if (v === true) {
          args.push(k);
        } else if (Array.isArray(v)) {
          v.forEach((item: string | number) => {
            args.push(k);
            args.push(String(item));
          });
        } else {
          args.push(k);
          args.push(String(v));
        }
      }
    }
    return args;
  });

function isParametersEqual(left: ICommandLineParameter[], right: ICommandLineParameter[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let i: number = 0; i < left.length; i++) {
    const item: ICommandLineParameter = left[i];
    Object.entries(item).forEach(([key, value]) => {
      if (value !== right[i][key as keyof ICommandLineParameter]) {
        return false;
      }
    });
  }
  return true;
}

export const useParameters: () => ICommandLineParameter[] = () => {
  return useAppSelector((state) => {
    return state.parameter.parameters;
  }, isParametersEqual);
};

export const useSearchedParameters: () => ICommandLineParameter[] = () => {
  const parameters: ICommandLineParameter[] = useParameters();
  const searchText: string = useAppSelector((state) => state.parameter.searchText);
  return parameters.filter((parameter) => {
    return parameter.longName.includes(searchText) || parameter.description.includes(searchText);
  });
};

export default parameterSlice.reducer;
