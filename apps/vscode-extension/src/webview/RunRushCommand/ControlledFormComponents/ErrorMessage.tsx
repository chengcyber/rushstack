export interface IErrorMessageProps {
  message?: string;
}

export const ErrorMessage = ({ message }: IErrorMessageProps): JSX.Element => {
  return message ? (
    <div role={'alert'}>
      <p className="ms-TextField-errorMessage">{message}</p>
    </div>
  ) : (
    <div />
  );
};
