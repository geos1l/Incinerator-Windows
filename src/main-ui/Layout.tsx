import React from 'react';

interface LayoutProps {
  children: [React.ReactNode, React.ReactNode];
}

export default function Layout({ children }: LayoutProps) {
  // Lock left pane close to 3-card grid width so the divider
  // stays visually tight to the card column on all window sizes.
  const LEFT_WIDTH_PX = 560;
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: `0 0 ${LEFT_WIDTH_PX}px`,
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children[0]}
      </div>
      <div
        style={{
          flex: '1 1 0',
          minWidth: 0,
          minHeight: 0,
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
