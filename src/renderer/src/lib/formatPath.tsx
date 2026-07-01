import { Fragment, type ReactNode } from 'react';

export const formatPathForWrap = (value: string | null | undefined, fallback: string): ReactNode => {
  if (!value) {
    return fallback;
  }

  return value.split(/([/\\])/).map((part, index) => (
    <Fragment key={`${part}-${index}`}>
      {part}
      {part === '/' || part === '\\' ? <wbr /> : null}
    </Fragment>
  ));
};
