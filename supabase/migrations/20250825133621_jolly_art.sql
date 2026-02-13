/*
  # Initial Database Schema for Arabic Business Data Extraction

  1. New Tables
    - `profiles` - User profile information with credits tracking
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `credits` (integer, default 100)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `searches` - Business search records
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `keywords` (text)
      - `location` (text)
      - `category` (text)
      - `radius` (integer)
      - `coordinates` (jsonb)
      - `results_count` (integer)
      - `created_at` (timestamp)
    
    - `business_results` - Individual business results from searches
      - `id` (uuid, primary key)
      - `search_id` (uuid, references searches)
      - `name` (text)
      - `address` (text)
      - `phone` (text)
      - `website` (text)
      - `rating` (numeric)
      - `review_count` (integer)
      - `category` (text)
      - `coordinates` (jsonb)
      - `hours` (text)
      - `price_level` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    
  3. Functions
    - Auto-create profile on user signup
    - Update profile timestamps
</example>*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  credits integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create searches table
CREATE TABLE IF NOT EXISTS searches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  keywords text NOT NULL,
  location text NOT NULL,
  category text,
  radius integer DEFAULT 5000,
  coordinates jsonb,
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create business_results table
CREATE TABLE IF NOT EXISTS business_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_id uuid REFERENCES searches(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  website text,
  rating numeric(2,1),
  review_count integer DEFAULT 0,
  category text,
  coordinates jsonb,
  hours text,
  price_level text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for searches
CREATE POLICY "Users can view own searches"
  ON searches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own searches"
  ON searches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own searches"
  ON searches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own searches"
  ON searches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for business_results
CREATE POLICY "Users can view own business results"
  ON business_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM searches
      WHERE searches.id = business_results.search_id
      AND searches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert business results"
  ON business_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM searches
      WHERE searches.id = business_results.search_id
      AND searches.user_id = auth.uid()
    )
  );

-- Function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_results_search_id ON business_results(search_id);