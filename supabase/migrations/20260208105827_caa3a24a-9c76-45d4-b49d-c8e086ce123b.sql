-- Add UPDATE policy for receipt_history table to prevent unauthorized modifications
CREATE POLICY "Users can update their own receipt history" 
ON public.receipt_history 
FOR UPDATE 
USING (auth.uid() = user_id);