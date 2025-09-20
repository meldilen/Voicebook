import React, { useRef, useEffect, useState, useCallback } from 'react';
import './BottomSheet.css';

const BottomSheet = ({ isOpen, onClose, onOpen, children }) => {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateSheetHeight = useCallback((height) => {
    if (sheetRef.current) {
      sheetRef.current.style.height = `${height}px`;
    }
  }, []);

  const snapToPoint = useCallback((point) => {
    const windowHeight = window.innerHeight;
    
    if (point === 'full') {
      updateSheetHeight(windowHeight);
      if (onOpen) onOpen();
    } else if (point === 'peek') {
      updateSheetHeight(40);
    } else {
      updateSheetHeight(0);
      if (onClose) onClose();
    }
  }, [onClose, onOpen, updateSheetHeight]);

  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    
    setIsDragging(true);
    setStartY(e.touches ? e.touches[0].clientY : e.clientY);
    setStartHeight(parseInt(sheetRef.current.style.height));
    sheetRef.current.classList.add('dragging');
  }, [isMobile]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !isMobile) return;
    
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = startY - currentY;
    const newHeight = startHeight + deltaY;
    
    const maxHeight = window.innerHeight - 40;
    const minHeight = 0;
    
    if (newHeight < minHeight) {
      updateSheetHeight(minHeight);
    } else if (newHeight > maxHeight) {
      updateSheetHeight(maxHeight);
    } else {
      updateSheetHeight(newHeight);
    }
  }, [isDragging, isMobile, startY, startHeight, updateSheetHeight]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    
    setIsDragging(false);
    sheetRef.current.classList.remove('dragging');
    
    const currentHeight = parseInt(sheetRef.current.style.height);
    const windowHeight = window.innerHeight;
    
    const openThreshold = windowHeight * 0.5;
    const peekThreshold = 30; // Минимальная высота для возврата в peek состояние
    
    if (currentHeight > openThreshold) {
      snapToPoint('full');
    } else if (currentHeight > peekThreshold) {
      snapToPoint('peek');
    } else {
      snapToPoint('closed');
    }
  }, [isMobile, snapToPoint]);

  // Автоматически показываем peek состояние на мобильных устройствах
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        snapToPoint('peek');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, snapToPoint]);

  useEffect(() => {
    if (isOpen) {
      snapToPoint('full');
    } else if (isMobile) {
      snapToPoint('peek');
    } else {
      snapToPoint('closed');
    }
  }, [isOpen, isMobile, snapToPoint]);

  if (!isMobile && !isOpen) return null;

  return (
    <div className="bottom-sheet-container">
      <div 
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? 'open' : ''}`}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        <div className="bottom-sheet-handle">
          <div className="handle-indicator"></div>
        </div>
        <div ref={contentRef} className="bottom-sheet-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;