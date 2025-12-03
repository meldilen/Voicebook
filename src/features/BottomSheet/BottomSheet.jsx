import React, { useRef, useEffect, useState, useCallback } from "react";
import "./BottomSheet.css";

const BottomSheet = ({
  isOpen,
  isPeek,
  onClose,
  onOpen,
  onTogglePeek,
  children,
}) => {
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
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const updateSheetHeight = useCallback((height) => {
    if (sheetRef.current) {
      sheetRef.current.style.height = `${height}px`;
    }
  }, []);

  const snapToPoint = useCallback(
    (point) => {
      const windowHeight = window.innerHeight;

      if (point === "full") {
        updateSheetHeight(windowHeight);
        if (onOpen) onOpen();
      } else if (point === "peek") {
        updateSheetHeight(40);
        if (onTogglePeek) onTogglePeek();
      } else {
        updateSheetHeight(0);
        if (onClose) onClose();
      }
    },
    [updateSheetHeight, onOpen, onClose, onTogglePeek]
  );

  const handleTouchStart = useCallback(
    (e) => {
      if (!isMobile) return;
      
      const touchY = e.touches ? e.touches[0].clientY : e.clientY;
      const sheetRect = sheetRef.current.getBoundingClientRect();
      const isHandleClick = touchY - sheetRect.top < 60;
      
      if (!isHandleClick) return;
      
      setIsDragging(true);
      setStartY(touchY);
      setStartHeight(parseInt(sheetRef.current.style.height) || 40);
      sheetRef.current.classList.add("dragging");
    },
    [isMobile]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging || !isMobile) return;

      const currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = startY - currentY;
      const newHeight = startHeight + deltaY;

      const maxHeight = window.innerHeight;
      const minHeight = 0;

      if (newHeight < minHeight) {
        updateSheetHeight(minHeight);
      } else if (newHeight > maxHeight) {
        updateSheetHeight(maxHeight);
      } else {
        updateSheetHeight(newHeight);
      }
    },
    [isDragging, isMobile, startY, startHeight, updateSheetHeight]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;

    setIsDragging(false);
    sheetRef.current.classList.remove("dragging");

    const currentHeight = parseInt(sheetRef.current.style.height);
    const windowHeight = window.innerHeight;

    const velocityThreshold = windowHeight * 0.3;
    const peekThreshold = windowHeight * 0.1;

    const heightDiff = currentHeight - startHeight;
    
    if (heightDiff > velocityThreshold) {
      snapToPoint("full");
    } 
    else if (heightDiff < -velocityThreshold) {
      snapToPoint("closed");
    }
    else if (currentHeight > windowHeight * 0.7) {
      snapToPoint("full");
    } else if (currentHeight > peekThreshold) {
      snapToPoint("peek");
    } else {
      snapToPoint("closed");
    }
  }, [isMobile, startHeight, snapToPoint]);

  const handleHandleClick = useCallback((e) => {
    e.stopPropagation();
    if (isOpen) {
      snapToPoint(isPeek ? "closed" : "peek");
    } else if (isPeek) {
      snapToPoint("full");
    } else {
      snapToPoint("peek");
    }
  }, [isOpen, isPeek, snapToPoint]);

  useEffect(() => {
    if (!isDragging) {
      if (isOpen) {
        updateSheetHeight(window.innerHeight);
      } else if (isPeek) {
        updateSheetHeight(40);
      } else {
        updateSheetHeight(0);
      }
    }
  }, [isOpen, isPeek, isDragging, updateSheetHeight]);

  useEffect(() => {
    if (isMobile && !isOpen && !isPeek) {
      const timer = setTimeout(() => {
        snapToPoint("peek");
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, isOpen, isPeek, snapToPoint]);

  const handleContentClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleOverlayClick = useCallback(() => {
    snapToPoint("closed");
  }, [snapToPoint]);

  if (!isMobile && !isOpen && !isPeek) return null;

  return (
    <>
      <div 
        className={`bottom-sheet-overlay ${(isOpen || isPeek) ? 'active' : ''}`}
        onClick={handleOverlayClick}
      />
      <div className="bottom-sheet-container">
        <div 
          ref={sheetRef}
          className={`bottom-sheet ${isOpen ? 'open' : ''} ${isPeek ? 'peek' : ''}`}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bottom-sheet-handle"
            onClick={handleHandleClick}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="handle-indicator"></div>
          </div>
          <div 
            ref={contentRef} 
            className="bottom-sheet-inner"
            onClick={handleContentClick}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomSheet;