import React from 'react';

interface LayoutProps {
  children: [React.ReactNode, React.ReactNode];
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <div style={{ width: '58%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children[0]}
      </div>
      <div
        style={{
          width: '42%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: '1px solid var(--border-subtle)',
          position: 'relative',
        }}
      >
        {children[1]}
      </div>
    </div>
  );
}
