import { Label } from "@fluentui/react";
import { useAppSelector } from "../store/hooks";

import type { CommandLineParameter } from "@rushstack/ts-command-line";
import type { CSSProperties } from "react";

const navStyle: CSSProperties = {
  width: '140px',
  height: 'auto',
  boxSizing: 'border-box',
  overflowY: 'auto',
};

export const ParameterNav = (): JSX.Element => {
  const parameters: CommandLineParameter[] = useAppSelector(state => state.parameter.parameters)
  return (
    <div style={navStyle}>
      {
        parameters.map((parameter: CommandLineParameter) => {
          const text: string = parameter.longName;
          return <Label required={parameter.required}>{text}</Label>
        })
      }
    </div>
  )
}