import { useEffect, useRef, useState, useCallback } from 'react';
import useAppStore from '../store/store';

interface ResizableContainerProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  aiChatPane?: React.ReactNode;
  initialLeftWidth?: number;
  initialRightWidth?: number;
  initialAiChatWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  minAiChatWidth?: number;
}

const ResizableContainer: React.FC<ResizableContainerProps> = ({
  leftPane,
  rightPane,
  aiChatPane,
  initialLeftWidth = 66,
  initialRightWidth = 34,
  initialAiChatWidth = 0,
  minLeftWidth = 20,
  minRightWidth = 20, 
  minAiChatWidth = 26
}) => {
  const hasAiChatPane = aiChatPane !== null;
  
  const totalInitialWidth = hasAiChatPane 
    ? initialLeftWidth + initialRightWidth + initialAiChatWidth 
    : initialLeftWidth + initialRightWidth;
  
  const scaleFactor = 100 / totalInitialWidth;
  
  const scaledInitialLeftWidth = initialLeftWidth * scaleFactor;
  const scaledInitialRightWidth = initialRightWidth * scaleFactor;
  const scaledInitialAiChatWidth = hasAiChatPane ? initialAiChatWidth * scaleFactor : 0;
  
  const storedLeftWidth = localStorage.getItem('leftPaneWidth');
  const storedRightWidth = localStorage.getItem('rightPaneWidth');
  const storedAiChatWidth = localStorage.getItem('aiChatPaneWidth');
  
  const [leftWidth, setLeftWidth] = useState(
    storedLeftWidth ? Number(storedLeftWidth) : scaledInitialLeftWidth
  );
  
  const [rightWidth, setRightWidth] = useState(
    storedRightWidth ? Number(storedRightWidth) : 
      hasAiChatPane ? scaledInitialRightWidth : (100 - leftWidth)
  );
  
  const [aiChatWidth, setAiChatWidth] = useState(
    hasAiChatPane 
      ? (storedAiChatWidth ? Number(storedAiChatWidth) : scaledInitialAiChatWidth) 
      : 0
  );
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const [leftDividerHovered, setLeftDividerHovered] = useState(false);
  const [rightDividerHovered, setRightDividerHovered] = useState(false);

  const currentWidthsRef = useRef({ leftWidth, rightWidth, aiChatWidth });

  useEffect(() => {
    currentWidthsRef.current = { leftWidth, rightWidth, aiChatWidth };
  }, [leftWidth, rightWidth, aiChatWidth]);
  
  useEffect(() => {
    if (!storedLeftWidth) {
      localStorage.setItem('leftPaneWidth', leftWidth.toString());
    }
    if (!storedRightWidth) {
      localStorage.setItem('rightPaneWidth', rightWidth.toString());
    }
    if (!storedAiChatWidth && hasAiChatPane) {
      localStorage.setItem('aiChatPaneWidth', aiChatWidth.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleLeftDividerResize = useCallback((mouseX: number, containerWidth: number) => {
    if (hasAiChatPane) {
      const newLeftWidth = (mouseX / containerWidth) * 100;
      const currentAiChatWidth = aiChatWidth;
      
      const newRightWidth = 100 - newLeftWidth - currentAiChatWidth;
      
      if (newLeftWidth >= minLeftWidth && newRightWidth >= minRightWidth) {
        setLeftWidth(Math.round(newLeftWidth * 10) / 10);
        setRightWidth(Math.round(newRightWidth * 10) / 10);
      } 
      else if (newLeftWidth >= minLeftWidth && newRightWidth < minRightWidth && currentAiChatWidth > minAiChatWidth) {
        
        const rightPaneDeficit = minRightWidth - newRightWidth;
        
        const aiChatAvailableSpace = currentAiChatWidth - minAiChatWidth;
        
        if (aiChatAvailableSpace >= rightPaneDeficit) {
          const newAiChatWidth = currentAiChatWidth - rightPaneDeficit;
          
          setLeftWidth(Math.round(newLeftWidth * 10) / 10);
          setRightWidth(minRightWidth);
          setAiChatWidth(Math.round(newAiChatWidth * 10) / 10);
        } else {
          const maxLeftPaneWidth = leftWidth + (aiChatAvailableSpace - rightPaneDeficit + (newRightWidth - minRightWidth));
          
          setLeftWidth(Math.round(maxLeftPaneWidth * 10) / 10);
          setRightWidth(minRightWidth);
          setAiChatWidth(minAiChatWidth);
        }
      }
    } else {
      const newLeftWidth = (mouseX / containerWidth) * 100;
      const newRightWidth = 100 - newLeftWidth;
      
      if (newLeftWidth >= minLeftWidth && newRightWidth >= minRightWidth) {
        setLeftWidth(Math.round(newLeftWidth * 10) / 10);
        setRightWidth(Math.round(newRightWidth * 10) / 10);
      }
    }
  }, [hasAiChatPane, aiChatWidth, leftWidth, minLeftWidth, minRightWidth, minAiChatWidth]);


  const handleRightDividerResize = useCallback((mouseX: number, containerWidth: number) => {
    if (!hasAiChatPane) return;
    
    const rightPaneLeftEdge = (leftWidth / 100) * containerWidth;
    const rightPaneWidth = mouseX - rightPaneLeftEdge;
    const newRightWidth = (rightPaneWidth / containerWidth) * 100;
    const newAiChatWidth = 100 - leftWidth - newRightWidth;
    
    if (newAiChatWidth >= minAiChatWidth) {
      if (newRightWidth >= minRightWidth) {
        setRightWidth(Math.round(newRightWidth * 10) / 10);
        setAiChatWidth(Math.round(newAiChatWidth * 10) / 10);
      } 
      else if (leftWidth > minLeftWidth) {
        const rightDeficit = minRightWidth - newRightWidth;
        const newLeftWidth = Math.max(leftWidth - rightDeficit, minLeftWidth);
        const adjustedRightWidth = minRightWidth;
        const adjustedAiChatWidth = 100 - newLeftWidth - adjustedRightWidth;
        
        if (adjustedAiChatWidth >= minAiChatWidth) {
          setLeftWidth(Math.round(newLeftWidth * 10) / 10);
          setRightWidth(adjustedRightWidth);
          setAiChatWidth(Math.round(adjustedAiChatWidth * 10) / 10);
        }
      }
    }
  }, [hasAiChatPane, leftWidth, minLeftWidth, minRightWidth, minAiChatWidth]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingLeft.current && !isDraggingRight.current) return;

    const { leftWidth, rightWidth, aiChatWidth } = currentWidthsRef.current;
    
    localStorage.setItem('leftPaneWidth', leftWidth.toString());
    localStorage.setItem('rightPaneWidth', rightWidth.toString());
    
    if (hasAiChatPane) {
      localStorage.setItem('aiChatPaneWidth', aiChatWidth.toString());
    }
    
    isDraggingLeft.current = false;
    isDraggingRight.current = false;
    document.body.style.cursor = 'default';
  }, [hasAiChatPane]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!isDraggingLeft.current && !isDraggingRight.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      
      if (isDraggingLeft.current) {
        handleLeftDividerResize(mouseX, containerWidth);
      } else if (isDraggingRight.current) {
        handleRightDividerResize(mouseX, containerWidth);
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleLeftDividerResize, handleRightDividerResize, handleMouseUp]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 575);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 575);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (hasAiChatPane) {
      const rightPaneAvailableSpace = rightWidth - minRightWidth;
      
      const aiChatNeededSpace = minAiChatWidth;
      
      let newRightWidth, newLeftWidth;
      
      if (rightPaneAvailableSpace >= aiChatNeededSpace) {
        newRightWidth = rightWidth - aiChatNeededSpace;
        newLeftWidth = leftWidth;
      }
      else {
        const spaceFromRight = rightPaneAvailableSpace;
        const neededFromLeft = aiChatNeededSpace - spaceFromRight;
        
        if (leftWidth - neededFromLeft >= minLeftWidth) {
          newRightWidth = minRightWidth;
          newLeftWidth = leftWidth - neededFromLeft;
        } 
        else {
          const totalAvailableSpace = (leftWidth - minLeftWidth) + (rightWidth - minRightWidth);
          
          if (totalAvailableSpace >= minAiChatWidth) {
            newLeftWidth = minLeftWidth;
            newRightWidth = minRightWidth;
          }
          else {
            newLeftWidth = minLeftWidth;
            newRightWidth = minRightWidth;
            console.warn('Not enough space to accommodate minimum width for all panes');
          }
        }
      }
      
      const newAiChatWidth = 100 - newLeftWidth - newRightWidth;
      
      setLeftWidth(newLeftWidth);
      setRightWidth(newRightWidth);
      setAiChatWidth(newAiChatWidth);
      
      localStorage.setItem('leftPaneWidth', newLeftWidth.toString());
      localStorage.setItem('rightPaneWidth', newRightWidth.toString());
      localStorage.setItem('aiChatPaneWidth', newAiChatWidth.toString());
    } else {
      setRightWidth(100 - leftWidth);
      localStorage.setItem('rightPaneWidth', (100 - leftWidth).toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAiChatPane]);

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
            background: leftDividerHovered || isDraggingLeft.current ? '#999' : '#ccc',
            position: 'relative',
            zIndex: 10,
            userSelect: 'none',
            touchAction: 'none',
            transition: 'background-color 0.2s'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            isDraggingLeft.current = true;
            document.body.style.cursor = 'col-resize';
          }}
          onMouseEnter={() => setLeftDividerHovered(true)}
          onMouseLeave={() => setLeftDividerHovered(false)}
        />
      )}
      
      <div style={{ 
        width: isMobile ? '100%' : `${rightWidth}%`,
        height: isMobile ? 'auto' : '100%',
        overflow: 'hidden',
        marginTop: isMobile ? '4px' : '0'
      }}>
        {rightPane}
      </div>
      
      {hasAiChatPane && (
        <>
          {!isMobile && (
            <div
              style={{
                width: '8px',
                cursor: 'col-resize',
                background: rightDividerHovered || isDraggingRight.current ? '#999' : '#ccc',
                position: 'relative',
                zIndex: 10,
                userSelect: 'none',
                touchAction: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                isDraggingRight.current = true;
                document.body.style.cursor = 'col-resize';
              }}
              onMouseEnter={() => setRightDividerHovered(true)}
              onMouseLeave={() => setRightDividerHovered(false)}
            />
          )}
          <div style={{ 
            width: isMobile ? '100%' : `${aiChatWidth}%`,
            height: isMobile ? 'auto' : '100%',
            overflow: 'hidden',
            marginTop: isMobile ? '4px' : '0'
          }}>
            {aiChatPane}
          </div>
        </>
      )}
    </div>
  );
};

export default ResizableContainer;