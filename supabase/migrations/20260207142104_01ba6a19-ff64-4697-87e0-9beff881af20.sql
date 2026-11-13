-- Create a table for storing receipt scans with expense and recipe data
CREATE TABLE public.receipt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_amount DECIMAL(10,2),
  store_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  recipe_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.receipt_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own receipt history" 
ON public.receipt_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipt history" 
ON public.receipt_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipt history" 
ON public.receipt_history 
FOR DELETE 
USING (auth.uid() = user_id);