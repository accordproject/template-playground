import { useEffect, useRef, useState } from 'react';
import useAppStore from '../store/store';

interface ResizableContainerProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  initialLeftWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
}

const ResizableContainer: React.FC<ResizableContainerProps> = ({
  leftPane,
  rightPane,
  initialLeftWidth = 66,
  minLeftWidth = 30,
  minRightWidth = 30,
}) => {
  const [leftWidth, setLeftWidth] = useState(
    Number(localStorage.getItem('editorPaneWidth')) || initialLeftWidth
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      const newLeftWidth = (mouseX / containerWidth) * 100;

      if (newLeftWidth >= minLeftWidth && (100 - newLeftWidth) >= minRightWidth) {
        setLeftWidth(newLeftWidth);
        localStorage.setItem('editorPaneWidth', newLeftWidth.toString());
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minLeftWidth, minRightWidth]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 320);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 320);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        position: 'relative',
        backgroundColor,
        flexDirection: isMobile ? 'column' : 'row',
        height: '100%',
        overflow: isMobile ? 'auto' : 'hidden'
      }}
    >
      <div style={{ 
        width: isMobile ? '100%' : `${leftWidth}%`,
        height: isMobile ? 'auto' : '100%',
        overflow: 'hidden' 
      }}>
        {leftPane}
      </div>
      {!isMobile && (
        <div
          style={{
            width: '8px',
            cursor: 'col-resize',
            background: isHovered || isDragging.current ? '#999' : '#ccc',
            position: 'relative',
            zIndex: 10,
            userSelect: 'none',
            transition: 'background-color 0.2s'
          }}
          onMouseDown={() => {
            isDragging.current = true;
            document.body.style.cursor = 'col-resize';
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}
      <div style={{ 
        width: isMobile ? '100%' : `${100 - leftWidth}%`,
        height: isMobile ? 'auto' : '100%',
        overflow: 'hidden',
        marginTop: isMobile ? '4px' : '0'
      }}>
        {rightPane}
      </div>
    </div>
  );
};

export default ResizableContainer;