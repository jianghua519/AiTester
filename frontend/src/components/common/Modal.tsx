import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';
import { X } from 'lucide-react';

const modalVariants = cva(
  'fixed inset-0 z-50 overflow-y-auto',
  {
    variants: {
      size: {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-7xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  closable?: boolean;
  maskClosable?: boolean;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    className, 
    size, 
    isOpen, 
    onClose, 
    title, 
    footer, 
    closable = true, 
    maskClosable = true,
    children, 
    ...props 
  }, ref) => {
    if (!isOpen) return null;

    const handleMaskClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && maskClosable) {
        onClose();
      }
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };

    React.useEffect(() => {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }, [closable]);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* 背景遮罩 */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleMaskClick}
        />
        
        {/* 模态框容器 */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            ref={ref}
            className={cn(
              modalVariants({ size }),
              'relative bg-white rounded-lg shadow-xl transform transition-all',
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {/* 标题栏 */}
            {(title || closable) && (
              <div className="flex items-center justify-between p-6 border-b">
                {title && (
                  <h3 className="text-lg font-medium text-gray-900">
                    {title}
                  </h3>
                )}
                {closable && (
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                )}
              </div>
            )}
            
            {/* 内容区域 */}
            <div className="p-6">
              {children}
            </div>
            
            {/* 底部区域 */}
            {footer && (
              <div className="flex items-center justify-end p-6 border-t bg-gray-50 rounded-b-lg">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

export { Modal, modalVariants };