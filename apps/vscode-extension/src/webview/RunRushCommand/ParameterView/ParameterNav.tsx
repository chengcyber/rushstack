import { Label } from "@fluentui/react";
import { useAppSelector } from "../store/hooks";

import type { CSSProperties } from "react";
import type { ICommandLineParameter } from "../Message/fromExtension";

const navStyle: CSSProperties = {
  width: '140px',
  height: 'auto',
  boxSizing: 'border-box',
  overflowY: 'auto',
};

export const ParameterNav = (): JSX.Element => {
  const parameters: ICommandLineParameter[] = useAppSelector(state => state.parameter.parameters)
  return (
    <div style={navStyle}>
      {
        parameters.map((parameter: ICommandLineParameter) => {
          const text: string = parameter.longName;
          return <Label key={text} required={parameter.required}>{text}</Label>
        })
      }
    </div>
  )
}