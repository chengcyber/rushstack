import { useEffect } from "react";

import { FieldValues, UseFormWatch } from 'react-hook-form';
import { useAppDispatch } from "../../store/hooks";
import { onChangeFormValues } from "../../store/slices/parameter";

export interface IParameterFormWatcherProps {
  watch: UseFormWatch<FieldValues>;
}

export const ParameterFormWatcher = ({ watch }: IParameterFormWatcherProps): null => {

  const dispatch = useAppDispatch();

  useEffect((): () => void => {
    const subscription = watch((values) => {
      dispatch(onChangeFormValues(values))
    });
    return () => subscription.unsubscribe;
  }, [watch])

  return null;
}