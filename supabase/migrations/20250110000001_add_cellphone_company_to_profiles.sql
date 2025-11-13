-- Add cellphone_company column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cellphone_company TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.cellphone_company IS 'Cellphone service provider (Telcel, AT&T, Movistar, etc.)';
