import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';

// --- Types ---
type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

interface PopoverContextValue {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  virtualAnchor: DOMRect | null;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

const usePopoverContext = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover components must be used within a Popover provider');
  }
  return context;
};

// --- Main Provider Component ---
interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  virtualAnchor?: DOMRect | null;
}

export const Popover: React.FC<PopoverProps> = ({ children, open: controlledOpen, onOpenChange: setControlledOpen, virtualAnchor = null }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const isOpen = controlledOpen ?? uncontrolledOpen;
  const onOpenChange = setControlledOpen ?? setUncontrolledOpen;

  const value = useMemo(() => ({
    isOpen,
    onOpenChange,
    anchorEl,
    setAnchorEl,
    virtualAnchor,
  }), [isOpen, onOpenChange, anchorEl, setAnchorEl, virtualAnchor]);
  
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
};

// --- Trigger Component (Optional) ---
export const PopoverTrigger = React.forwardRef<HTMLElement, { children: React.ReactElement }>(({ children }, ref) => {
  const { isOpen, onOpenChange, setAnchorEl } = usePopoverContext();
  const child = React.Children.only(children);

  return React.cloneElement(child, {
    ref: (node: HTMLElement) => {
      setAnchorEl(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
      if (typeof (child as any).ref === 'function') (child as any).ref(node);
      else if ((child as any).ref) (child as any).ref.current = node;
    },
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
      onOpenChange(!isOpen);
    },
  });
});

// --- Content Component ---
interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: Side;
  align?: Align;
  sideOffset?: number;
  alignOffset?: number;
}

const VIEWPORT_PADDING = 10;
const ARROW_SIZE = 8;

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, side = 'bottom', align = 'center', sideOffset = 0, alignOffset = 0, style, ...props }, ref) => {
    const { isOpen, onOpenChange, anchorEl, virtualAnchor } = usePopoverContext();
    const contentRef = useRef<HTMLDivElement>(null);
    const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
      if (!isOpen || (!anchorEl && !virtualAnchor)) return;
      
      const contentEl = contentRef.current;
      if (!contentEl) return;
      
      const anchorRect = virtualAnchor || anchorEl?.getBoundingClientRect();
      if (!anchorRect) return;

      const contentRect = contentEl.getBoundingClientRect();
      
      const getPosition = (currentSide: Side) => {
        let top = 0, left = 0;
        
        if (currentSide === 'top') top = anchorRect.top - contentRect.height - sideOffset;
        else if (currentSide === 'bottom') top = anchorRect.bottom + sideOffset;
        else if (currentSide === 'left') left = anchorRect.left - contentRect.width - sideOffset;
        else if (currentSide === 'right') left = anchorRect.right + sideOffset;
        
        if (currentSide === 'top' || currentSide === 'bottom') {
          if (align === 'start') left = anchorRect.left + alignOffset;
          else if (align === 'center') left = anchorRect.left + anchorRect.width / 2 - contentRect.width / 2 + alignOffset;
          else if (align === 'end') left = anchorRect.right - contentRect.width + alignOffset;
        } else if (currentSide === 'left' || currentSide === 'right') {
          if (align === 'start') top = anchorRect.top + alignOffset;
          else if (align === 'center') top = anchorRect.top + anchorRect.height / 2 - contentRect.height / 2 + alignOffset;
          else if (align === 'end') top = anchorRect.bottom - contentRect.height + alignOffset;
        }
        
        return { top, left };
      }
      
      // Fix: Explicitly type `finalSide` as `Side` to prevent type widening.
      let finalSide: Side = side;
      let pos = getPosition(finalSide);
      
      // Vertical collision detection
      if (finalSide === 'top' && pos.top < VIEWPORT_PADDING) finalSide = 'bottom';
      if (finalSide === 'bottom' && pos.top + contentRect.height > window.innerHeight - VIEWPORT_PADDING) finalSide = 'top';

      pos = getPosition(finalSide); // Recalculate with new side if needed

      // Horizontal clamping
      pos.left = Math.max(VIEWPORT_PADDING, pos.left);
      pos.left = Math.min(window.innerWidth - VIEWPORT_PADDING - contentRect.width, pos.left);

      setPositionStyle({
        position: 'fixed',
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        transform: 'scale(1)',
        opacity: 1,
        transition: 'opacity 150ms ease-out, transform 150ms ease-out',
      });
      
      // Arrow positioning
      const arrowLeft = anchorRect.left + anchorRect.width / 2 - pos.left - ARROW_SIZE;
      const clampedArrowLeft = Math.max(ARROW_SIZE, Math.min(arrowLeft, contentRect.width - ARROW_SIZE * 2));

      if (finalSide === 'top') {
        setArrowStyle({ bottom: `-${ARROW_SIZE}px`, left: `${clampedArrowLeft}px`, borderTopColor: '#1f2937' });
      } else if (finalSide === 'bottom') {
        setArrowStyle({ top: `-${ARROW_SIZE}px`, left: `${clampedArrowLeft}px`, borderBottomColor: '#1f2937' });
      } else {
        setArrowStyle({});
      }

    }, [isOpen, anchorEl, virtualAnchor, side, align, sideOffset, alignOffset]);

    useEffect(() => {
      if (!isOpen) return;
      const close = () => onOpenChange(false);

      const handlePointerDown = (e: PointerEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          // Allow starting a new selection without immediately closing
          if (window.getSelection()?.toString() === '') {
             close();
          }
        }
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close();
      };
      
      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', close, true); // Use capture phase
      window.addEventListener('resize', close);

      return () => {
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('scroll', close, true);
        window.removeEventListener('resize', close);
      };
    }, [isOpen, onOpenChange]);

    if (!isOpen) return null;

    return (
      <div
        ref={(node) => {
          if (node) contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        style={{ ...positionStyle, ...style }}
        {...props}
      >
        {children}
        <div 
          className="absolute w-0 h-0 border-x-8 border-x-transparent"
          style={{ ...arrowStyle, borderWidth: `${ARROW_SIZE}px`, borderColor: 'transparent' }}
        />
      </div>
    );
  }
);