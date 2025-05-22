
import { useContext } from 'react';
import { TrackPlayerContext } from '@/components/player/TrackPlayerProvider';

export const useTrackPlayer = () => {
  return useContext(TrackPlayerContext);
};
