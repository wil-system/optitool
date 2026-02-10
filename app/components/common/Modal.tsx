interface IProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  preventClose?: boolean;
  width?: string;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  preventClose = false,
  width = 'w-[1000px]'
}: IProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className={`bg-card rounded-lg p-6 ${width} max-h-[90vh] overflow-y-auto relative`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              {!preventClose && (
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">닫기</span>
                  ×
                </button>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 