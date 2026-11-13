import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/FloatingInput';
import { ScanLoader } from '@/components/ScanLoader';
import { Camera, Plus, Check, Upload } from 'lucide-react';
import { FridgeItem, CATEGORIES } from '@/types/item';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScannedItem {
  name: string;
  quantity: number;
  unit?: string;
  category: string;
  price?: number;
  selected: boolean;
  isEditing?: boolean;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<FridgeItem, 'id' | 'addedAt'>) => Promise<FridgeItem | null>;
  onAddItems: (items: Omit<FridgeItem, 'id' | 'addedAt'>[]) => Promise<FridgeItem[]>;
  onSaveReceipt?: (items: { name: string; quantity: number; category: string; price?: number }[], total?: number) => Promise<void>;
}

export function AddItemModal({ isOpen, onClose, onAddItem, onAddItems, onSaveReceipt }: AddItemModalProps) {
  const [mode, setMode] = useState<'scan' | 'manual' | 'review'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scannedTotal, setScannedTotal] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasStartedCamera = useRef(false);
  
  // Manual entry state
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('other');
  const [expiryDate, setExpiryDate] = useState('');

  const resetForm = () => {
    setName('');
    setQuantity('1');
    setUnit('pcs');
    setCategory('other');
    setExpiryDate('');
    setScannedItems([]);
    setScannedTotal(null);
    setMode('scan');
    hasStartedCamera.current = false;
  };

  const handleClose = () => {
    stopCamera();
    resetForm();
    onClose();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Camera not available. Upload a photo or add the item by hand.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const processImage = useCallback(async (base64: string) => {
    setIsScanning(true);
    stopCamera();

    try {
      const { data, error } = await supabase.functions.invoke('scan-recipe', {
        body: { image: base64 }
      });

      if (error) throw error;

      const items = data.items || [];
      const total = data.total || null;
      
      if (items.length === 0) {
        toast.error('No groceries found in that picture. Try a sharper photo.');
        setMode('scan');
        setTimeout(startCamera, 100);
      } else {
        setScannedItems(items.map((item: Omit<ScannedItem, 'selected'>) => ({ ...item, selected: true })));
        setScannedTotal(total);
        setMode('review');
      }
    } catch (err) {
      console.error('Scan error:', err);
      toast.error('Scanning failed. Please try again.');
      setMode('scan');
      setTimeout(startCamera, 100);
    } finally {
      setIsScanning(false);
    }
  }, [stopCamera]);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];

    await processImage(base64);
  }, [processImage]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      await processImage(base64);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processImage]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onAddItem({
      name: name.trim(),
      quantity: parseInt(quantity) || 1,
      unit,
      category,
      expiryDate: expiryDate || undefined,
      isFavorite: false,
    });

    handleClose();
  };

  const handleAddScannedItems = async () => {
    const selectedItems = scannedItems.filter(item => item.selected);
    if (selectedItems.length === 0) return;

    const itemsToAdd = selectedItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',  // Default to 'pcs' if no unit from scan
      category: item.category,
      isFavorite: false,
    }));

    await onAddItems(itemsToAdd);

    // Save to receipt history for dashboard tracking
    if (onSaveReceipt) {
      await onSaveReceipt(
        selectedItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          price: item.price,
        })),
        scannedTotal || undefined
      );
    }

    handleClose();
  };

  const toggleItemSelection = (index: number) => {
    setScannedItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updateScannedItem = (index: number, updates: Partial<ScannedItem>) => {
    setScannedItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    );
  };

  // Auto-start camera when modal opens in scan mode
  useState(() => {
    if (isOpen && mode === 'scan' && !hasStartedCamera.current) {
      hasStartedCamera.current = true;
      setTimeout(startCamera, 100);
    }
  });

  // Start camera when modal opens
  if (isOpen && mode === 'scan' && !hasStartedCamera.current) {
    hasStartedCamera.current = true;
    setTimeout(startCamera, 100);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-[20px]" style={{
        boxShadow: 'inset 0 -3em 3em rgba(0,0,0,0.1), 0 0 0 2px rgb(190, 190, 190), 0.3em 0.3em 1em rgba(0,0,0,0.3)'
      }}>
        <DialogHeader>
          <DialogTitle>
            {mode === 'manual' && 'Add Item Manually'}
            {mode === 'scan' && 'Add Items'}
            {mode === 'review' && 'Review Scanned Items'}
          </DialogTitle>
        </DialogHeader>

        {/* Scan Mode */}
        {mode === 'scan' && (
          <div className="space-y-4 py-4">
            {isScanning ? (
              <ScanLoader />
            ) : (
              <>
                <div className="relative overflow-hidden rounded-xl bg-muted">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <Button
                  className="w-full rounded-full"
                  onClick={captureAndScan}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture & Scan
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => {
                      stopCamera();
                      setMode('manual');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manually
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Review Scanned Items */}
        {mode === 'review' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {scannedItems.filter(i => i.selected).length} of {scannedItems.length} items selected
            </p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {scannedItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    item.selected ? 'bg-accent border-foreground' : 'bg-muted border-transparent'
                  }`}
                  onClick={() => toggleItemSelection(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                        item.selected ? 'bg-foreground border-foreground' : 'border-muted-foreground'
                      }`}>
                        {item.selected && <Check className="w-3 h-3 text-background" />}
                      </div>
                      {item.isEditing ? (
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateScannedItem(index, { name: e.target.value })}
                          onBlur={() => updateScannedItem(index, { isEditing: false })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateScannedItem(index, { isEditing: false });
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="flex-1 px-2 py-1 bg-background border rounded text-sm font-medium min-w-0"
                        />
                      ) : (
                        <span 
                          className="font-medium truncate hover:text-primary cursor-text transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateScannedItem(index, { isEditing: true });
                          }}
                        >
                          {item.name}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground flex-shrink-0">
                      x{item.quantity}
                    </span>
                  </div>
                  {item.selected && (
                    <div className="mt-2 grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateScannedItem(index, { quantity: parseInt(e.target.value) || 1 })}
                        className="px-2 py-1 bg-background border rounded text-sm"
                        min={1}
                      />
                      <select
                        value={item.category}
                        onChange={(e) => updateScannedItem(index, { category: e.target.value })}
                        className="px-2 py-1 bg-background border rounded text-sm"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => {
                  setMode('scan');
                  hasStartedCamera.current = false;
                  setTimeout(startCamera, 100);
                }}
              >
                Back
              </Button>
              <Button
                className="flex-1 rounded-full"
                onClick={handleAddScannedItems}
              >
                Add {scannedItems.filter(i => i.selected).length} Items
              </Button>
            </div>
          </div>
        )}

        {/* Manual Entry Mode */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-6 py-4">
            <FloatingInput
              label="Item Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            
            <FloatingInput
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={1}
            />

            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 px-3 bg-background border-b border-muted-foreground focus:border-foreground outline-none transition-colors"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <FloatingInput
              label="Expiry Date (optional)"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => {
                  setMode('scan');
                  hasStartedCamera.current = false;
                  setTimeout(startCamera, 100);
                }}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
