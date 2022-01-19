import { PrimaryButton } from "@fluentui/react";
import { useForm, FieldValues } from "react-hook-form";
import { ControlledTextField } from "../ControlledFormComponents/ControlledTextField";

export const ParameterForm = (): JSX.Element => {
  const { handleSubmit, control } = useForm();
  const onSubmit = (values: FieldValues): void => console.log(values);

  return (
    <div>
      <ControlledTextField
        name="email"
        control={control}
      />
      <PrimaryButton text="Save" onClick={handleSubmit(onSubmit)} />
    </div>
  )
}