// src/components/NarrativeComponent/NarrativeComponent.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { DataFrame, FieldType, getFieldDisplayName } from '@grafana/data'; // Added getFieldDisplayName
import { LoadingPlaceholder } from '@grafana/ui';
import { LLM_API_ENDPOINT, LLM_API_KEY, LLM_MODEL } from '../../constants';

interface Props {
  data?: DataFrame[];
  isLoading: boolean;
  country: string;
}

// Helper function - Assuming your updated version is correct for your data structure
const getLatestDataPoint = (
    dataFrames: DataFrame[],
    country: string
  ): { year: string; value: number } | null => {
    if (!dataFrames || dataFrames.length === 0) {
      return null;
    }

    // This part heavily depends on the ACTUAL structure of the DataFrame
    // coming from your CSV query after potential transformations.
    // Let's keep your provided logic, but add console logs for debugging.
    // You might need to adjust this based on inspecting the 'data' prop.

    console.log("getLatestDataPoint input frames:", dataFrames);

    const frame = dataFrames[0]; // Assumes data is in the first frame
    if (!frame || frame.fields.length === 0) {
      console.log("No frame or no fields found.");
      return null;
    }

    // Attempt to find date/time field more robustly
    const dateField = frame.fields.find(
      (f) => f.type === FieldType.time || f.name.toLowerCase().includes('time') || f.name.toLowerCase().includes('date')
    );

    // Attempt to find the value field based on the 'country' prop
    // Using getFieldDisplayName handles potential overrides/aliases
    const countryField = frame.fields.find(
      (f) => getFieldDisplayName(f, frame) === country // Match display name
    );


    if (!dateField) {
      console.error("Date field not found in frame:", frame.fields.map(f => f.name));
      return null;
    }
    if (!countryField) {
        console.error(`Field matching country '${country}' not found. Available fields:`, frame.fields.map(f => getFieldDisplayName(f, frame)));
        return null;
    }
     if (countryField.type !== FieldType.number) {
         console.error(`Field '${country}' is not of type number.`);
         return null;
     }


    const rowCount = dateField.values.length;
    if (rowCount === 0) {
        console.log("Frame has 0 rows.");
        return null;
    }

    // Find the latest non-null value
    let latestIndex = -1;
    let latestTime = -Infinity;

    for (let i = 0; i < rowCount; i++) {
        const timeVal = dateField.values.get(i);
        const countryVal = countryField.values.get(i);

        // Check if country value is valid number for this row
        if (countryVal !== null && typeof countryVal === 'number' && !isNaN(countryVal)) {
            // Check if this row's time is the latest valid one found so far
            if (timeVal > latestTime) {
                latestTime = timeVal;
                latestIndex = i;
            }
        }
    }


    if (latestIndex !== -1) {
      const rawVal = countryField.values.get(latestIndex);
      const timeVal = dateField.values.get(latestIndex);

      // Extract year (more robustly)
      const date = new Date(timeVal);
      const year = date.getFullYear().toString();

      const value = Math.round(rawVal * 100) / 100;
      console.log("Found latest data:", { year, value });
      return { year, value };
    }


    console.log(`No valid numeric data found for ${country} with a corresponding date.`);
    return null;
  };


export const NarrativeComponent: React.FC<Props> = ({ data, isLoading, country }) => {
  const [narrative, setNarrative] = useState<string>('Loading narrative...');
  const [isLLMLoading, setIsLLMLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const latestDataPoint = useMemo(() => getLatestDataPoint(data || [], country), [data, country]);

  useEffect(() => {
    // --- Cleanup function for fetch cancellation ---
    const abortController = new AbortController();

    const fetchNarrative = () => {
        // Check conditions *before* setting loading state
        if (!latestDataPoint) {
            setNarrative(`No recent forest data available for ${country}.`);
            return;
        }

        if (!LLM_API_KEY || LLM_API_KEY === 'YOUR_LLM_API_KEY_HERE') {
            setNarrative("[LLM API Key not configured in constants.ts]");
            console.warn("LLM API Key not configured.");
            return;
        }

        // If already loading, don't start another fetch
        if (isLLMLoading) {
            console.log("LLM fetch already in progress, skipping.");
            return;
        }

        const { year, value } = latestDataPoint;
        setIsLLMLoading(true); // Set loading state *only when starting the fetch*
        setError(null);
        setNarrative("Generating story...");

        const prompt = `You are a concise environmental storyteller for a Grafana dashboard focused on UN Sustainable Development Goals.
        The latest available data point for forest area in ${country} is from the year ${year}, showing ${value}% of land area covered by forest.
        Write a very short (1-2 sentence) narrative comment about this specific data point. Be slightly creative, perhaps from the perspective of the country's nature. Do not greet or sign off.`;

        console.log("Sending prompt to LLM:", prompt);

        fetch(LLM_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LLM_API_KEY}`,
            },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 60, // Slightly increased just in case
                temperature: 0.7,
            }),
            signal: abortController.signal, // Pass the abort signal
        })
        .then(response => {
            if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(`API Error (${response.status}): ${errData?.error?.message || response.statusText}`);
            });
            }
            return response.json();
        })
        .then(llmData => {
            const generatedText = llmData?.choices?.[0]?.message?.content?.trim();
            if (generatedText) {
                setNarrative(generatedText);
                console.log("LLM Response:", generatedText);
            } else {
                throw new Error("Received empty or malformed response from LLM.");
            }
        })
        .catch(err => {
            if (err.name === 'AbortError') {
                console.log('LLM fetch aborted');
            } else {
                console.error("Error fetching narrative from LLM:", err);
                setError(`Failed to generate narrative: ${err.message}`);
                setNarrative(`Could not load story for ${year}.`);
            }
        })
        .finally(() => {
            setIsLLMLoading(false); // Reset loading state
        });
    }

    // Only run fetch logic if Grafana data isn't loading
    if (!isLoading) {
         fetchNarrative();
    } else {
        setNarrative('Waiting for data...'); // Update status while Grafana loads
    }


    // --- Return cleanup function ---
    // This runs when the component unmounts OR dependencies change before the effect re-runs
    return () => {
      console.log("Narrative component effect cleanup: Aborting fetch.");
      abortController.abort(); // Cancel the fetch if it's still in progress
    };

    // Remove isLLMLoading from the dependency array!
  }, [latestDataPoint, country, isLoading]); // Keep only the *external* dependencies


  // --- Render Logic --- (Keep your existing render logic)
  const style: React.CSSProperties = {
    border: '1px solid lightgreen',
    height: '100%',
    padding: '15px',
    fontSize: '1.1em',
    color: '#333',
    boxSizing: 'border-box',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'center',
  };

  // Handle combined loading states more clearly
  let displayText = narrative;
  if (isLoading) {
      displayText = 'Loading data...';
  } else if (isLLMLoading) {
      displayText = 'Generating story...';
  }

  return (
    <div style={style}>
      {(isLoading || isLLMLoading) && !error && <LoadingPlaceholder text={displayText} />}
      {!isLoading && !isLLMLoading && !error && <p>{narrative}</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
};