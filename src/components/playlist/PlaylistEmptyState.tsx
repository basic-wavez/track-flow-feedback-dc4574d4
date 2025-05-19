
const PlaylistEmptyState = () => {
  return (
    <div className="text-center py-16 border border-dashed border-wip-gray rounded-lg bg-wip-darker">
      <h3 className="text-xl font-medium mb-2">This Playlist is Empty</h3>
      <p className="text-gray-400">The owner hasn't added any tracks yet.</p>
    </div>
  );
};

export default PlaylistEmptyState;
