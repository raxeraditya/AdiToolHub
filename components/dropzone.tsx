'use client';

import { useRef, useState, type ReactNode } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropzoneProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  children?: ReactNode;
  className?: string;
  hint?: string;
}

export function Dropzone({
  accept,
  multiple = false,
  onFiles,
  children,
  className,
  hint,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/60 hover:bg-accent/40',
        dragging && 'border-primary bg-accent/60',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {children ?? (
        <>
          <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Drop files here or click to browse</p>
          {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
        </>
      )}
    </div>
  );
}
