
import { useState, useEffect } from "react";
import { getTrack } from "@/services/trackQueryService";
import { handleError } from "@/utils/errorHandler";
import { PlaylistTrack } from "@/types/playlist";

export const useTrackLoader = (currentTrack: PlaylistTrack | null) => {
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [trackAudioUrl, setTrackAudioUrl] = useState<string | undefined>();
  const [waveformUrl, setWaveformUrl] = useState<string | undefined>();

  // Load detailed track data when current track changes
  useEffect(() => {
    const loadTrackData = async () => {
      if (currentTrack?.track_id) {
        console.log("Loading track data for track_id:", currentTrack.track_id);
        setIsLoadingTrack(true);
        try {
          const trackData = await getTrack(currentTrack.track_id);
          console.log("Track data loaded:", trackData);
          
          if (trackData) {
            // Use the best available URL - prefer mp3, then opus, then compressed, then original
            const audioUrl = trackData.mp3_url || 
                          trackData.opus_url || 
                          trackData.compressed_url || 
                          trackData.original_url;
            
            // Set the waveform URL - prefer mp3, then compressed
            const waveformAnalysisUrl = trackData.mp3_url || trackData.compressed_url;
            
            console.log("Using audio URL:", audioUrl);
            console.log("Using waveform URL:", waveformAnalysisUrl);
            
            setTrackAudioUrl(audioUrl);
            setWaveformUrl(waveformAnalysisUrl);
            
            if (!audioUrl) {
              console.error("No audio URL available for track:", currentTrack.track_id);
            }
          } else {
            console.error("No track data returned for track_id:", currentTrack.track_id);
          }
        } catch (error) {
          console.error("Error loading track data:", error);
          handleError(error, "Track Loading Error", "Could not load track data");
        } finally {
          setIsLoadingTrack(false);
        }
      }
    };
    
    loadTrackData();
  }, [currentTrack]);

  return {
    isLoadingTrack,
    trackAudioUrl,
    waveformUrl
  };
};
