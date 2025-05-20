
import AudioVisualizer from "../visualizers/AudioVisualizer";

interface TrackVisualizerSectionProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

const TrackVisualizerSection = ({
  audioRef,
  isPlaying
}: TrackVisualizerSectionProps) => {
  return (
    <AudioVisualizer 
      audioRef={audioRef}
      isPlaying={isPlaying}
    />
  );
};

export default TrackVisualizerSection;
