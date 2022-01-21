import { Label } from '@fluentui/react';

import type { CSSProperties } from 'react';
import { ICommandLineParameter, useSearchedParameters } from '../store/slices/parameter';

const navStyle: CSSProperties = {
  width: '140px',
  height: 'auto',
  boxSizing: 'border-box',
  overflowY: 'auto'
};

export const ParameterNav = (): JSX.Element => {
  const parameters: ICommandLineParameter[] = useSearchedParameters();
  return (
    <div style={navStyle}>
      {parameters.map((parameter: ICommandLineParameter) => {
        const text: string = parameter.longName;
        return (
          <Label key={text} required={parameter.required}>
            {text}
          </Label>
        );
      })}
    </div>
  );
};
