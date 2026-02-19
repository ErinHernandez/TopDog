import React, { createContext, useContext } from 'react';

const InPhoneFrameContext = createContext<boolean>(false);

export function InPhoneFrameProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return (
    <InPhoneFrameContext.Provider value={value}>
      {children}
    </InPhoneFrameContext.Provider>
  );
}

export function useInPhoneFrame(): boolean {
  return useContext(InPhoneFrameContext);
}
