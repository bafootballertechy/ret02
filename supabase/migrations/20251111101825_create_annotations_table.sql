/*
  # Create annotations table for RetFlow Telestration

  1. New Tables
    - `annotations`
      - `id` (uuid, primary key) - Unique identifier for each annotation
      - `video_name` (text) - Name of the video file
      - `timestamp` (decimal) - Video timestamp in seconds where annotation appears
      - `type` (text) - Type of annotation tool used (circle, arrow, polygon, spotlight, etc.)
      - `drawings` (jsonb) - Array of drawing objects with tool-specific properties
      - `fade_in` (boolean) - Whether fade-in effect is enabled
      - `fade_out` (boolean) - Whether fade-out effect is enabled
      - `duration` (decimal) - Display duration in seconds (2-5s)
      - `color` (text) - Primary color used for annotation
      - `thumbnail` (text) - Base64 encoded thumbnail image
      - `created_at` (timestamptz) - Timestamp when annotation was created
      - `updated_at` (timestamptz) - Timestamp when annotation was last updated

  2. Security
    - Enable RLS on `annotations` table
    - Add policy for public access (no auth required for MVP)
    
  3. Indexes
    - Index on video_name for faster filtering
    - Index on timestamp for ordered retrieval
*/

CREATE TABLE IF NOT EXISTS annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_name text NOT NULL,
  timestamp decimal(10, 2) NOT NULL,
  type text NOT NULL,
  drawings jsonb NOT NULL DEFAULT '[]'::jsonb,
  fade_in boolean DEFAULT true,
  fade_out boolean DEFAULT true,
  duration decimal(3, 1) DEFAULT 3.0,
  color text DEFAULT '#FF3C00',
  thumbnail text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annotations_video_name ON annotations(video_name);
CREATE INDEX IF NOT EXISTS idx_annotations_timestamp ON annotations(timestamp);

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view annotations"
  ON annotations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert annotations"
  ON annotations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update annotations"
  ON annotations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete annotations"
  ON annotations FOR DELETE
  TO anon, authenticated
  USING (true);