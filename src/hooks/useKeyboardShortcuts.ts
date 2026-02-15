import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/store';
import tour from '../components/Tour';
import { message } from 'antd';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const tourStartingRef = useRef(false);
  
  const {
    setEditorsVisible,
    setPreviewVisible,
    setProblemPanelVisible,
    setAIChatOpen,
    toggleDarkMode,
    generateShareableLink,
    setTourRunning,
    setFullScreenModalOpen,
    isEditorsVisible,
    isPreviewVisible,
    isProblemPanelVisible,
    isAIChatOpen,
    isFullScreenModalOpen,
    isTourRunning,
  } = useAppStore((state) => ({
    setEditorsVisible: state.setEditorsVisible,
    setPreviewVisible: state.setPreviewVisible,
    setProblemPanelVisible: state.setProblemPanelVisible,
    setAIChatOpen: state.setAIChatOpen,
    toggleDarkMode: state.toggleDarkMode,
    generateShareableLink: state.generateShareableLink,
    setTourRunning: state.setTourRunning,
    setFullScreenModalOpen: state.setFullScreenModalOpen,
    isEditorsVisible: state.isEditorsVisible,
    isPreviewVisible: state.isPreviewVisible,
    isProblemPanelVisible: state.isProblemPanelVisible,
    isAIChatOpen: state.isAIChatOpen,
    isFullScreenModalOpen: state.isFullScreenModalOpen,
    isTourRunning: state.isTourRunning,
  }));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      
      if (!event.altKey) return;

      
      const key = event.key.toUpperCase();

      switch (key) {
        case 'E':
          event.preventDefault();
          setEditorsVisible(!isEditorsVisible);
          break;

        case 'P':
          event.preventDefault();
          setPreviewVisible(!isPreviewVisible);
          break;

        case 'B':
          event.preventDefault();
          setProblemPanelVisible(!isProblemPanelVisible);
          break;

        case 'A':
          event.preventDefault();
          setAIChatOpen(!isAIChatOpen);
          break;

        case 'O':
          event.preventDefault();
          setFullScreenModalOpen(!isFullScreenModalOpen);
          break;

        case 'D':
          event.preventDefault();
          toggleDarkMode();
          break;

        case 'S':
          event.preventDefault();
          try {
            const link = generateShareableLink();
            navigator.clipboard.writeText(link);
            message.success('Share link copied to clipboard!');
          } catch (error) {
            message.error('Failed to copy share link');
            console.error('Clipboard error:', error);
          }
          break;

        case 'T':
          event.preventDefault();
          
          // Check if tour is active (Shepherd has an isActive method)
          const isTourActive = tour.isActive();
          
          if (isTourActive) {
            // Close tour if it's already running
            tourStartingRef.current = false;
            tour.cancel();
            setTourRunning(false);
            message.info('Tour closed');
          } else if (!tourStartingRef.current && !isTourRunning) {
       
            tourStartingRef.current = true;
            setTourRunning(true);
            tour.currentStep = null;
            tour.steps = tour.steps.map((step: any, index: number) => {
              if (index === 0) {
                return step;
              }
              return step;
            });
            
            tour
              .start()
              .then(() => {
                tourStartingRef.current = false;
                setTourRunning(false);
              })
              .catch((error) => {
                tourStartingRef.current = false;
                if (error && error.message !== 'Tour cancelled') {
                  console.error('Tour failed to start:', error);
                }
                setTourRunning(false);
              });
          }
          break;

        case 'L':
          event.preventDefault();
          navigate('/learn/intro');
          break;

        case '1':
          event.preventDefault();
          window.open('https://github.com/accordproject', '_blank');
          break;

        case '2':
          event.preventDefault();
          window.open('https://discord.com/invite/Zm99SKhhtA', '_blank');
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    setEditorsVisible,
    setPreviewVisible,
    setProblemPanelVisible,
    setAIChatOpen,
    toggleDarkMode,
    generateShareableLink,
    setTourRunning,
    setFullScreenModalOpen,
    navigate,
    isEditorsVisible,
    isPreviewVisible,
    isProblemPanelVisible,
    isAIChatOpen,
    isFullScreenModalOpen,
    isTourRunning,
  ]);
};
