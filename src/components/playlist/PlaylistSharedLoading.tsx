
import Header from "@/components/layout/Header";

const PlaylistSharedLoading = () => {
  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-40 bg-gray-700 rounded"></div>
            <div className="mt-8 text-gray-400">Loading shared playlist...</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaylistSharedLoading;
