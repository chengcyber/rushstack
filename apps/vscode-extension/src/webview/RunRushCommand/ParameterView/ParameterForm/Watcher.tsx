import { useEffect } from 'react';

import { FieldValues, UseFormWatch } from 'react-hook-form';
import { useAppDispatch } from '../../store/hooks';
import { onChangeFormValues } from '../../store/slices/parameter';

import type { AnyAction, Dispatch } from '@reduxjs/toolkit';
import type { Subscription } from 'react-hook-form/dist/utils/createSubject';

export interface IParameterFormWatcherProps {
  watch: UseFormWatch<FieldValues>;
}

export const ParameterFormWatcher = ({ watch }: IParameterFormWatcherProps): null => {
  const dispatch: Dispatch<AnyAction> = useAppDispatch();

  useEffect((): (() => void) => {
    const subscription: Subscription = watch((values) => {
      console.log('watch', values);
      dispatch(onChangeFormValues(values));
    });
    return () => subscription.unsubscribe;
  }, [watch]);

  return null;
};
