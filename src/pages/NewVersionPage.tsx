import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getTrack } from "@/services/trackQueryService";
import { createTrackVersion } from "@/services/trackUploadService";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Music } from "lucide-react";
import { TrackData } from "@/types/track";
import DropZone from "@/components/upload/DropZone";

const NewVersionPage = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [originalTrack, setOriginalTrack] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [versionNotes, setVersionNotes] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [newVersionId, setNewVersionId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    const loadOriginalTrack = async () => {
      if (!trackId) return;
      
      try {
        const track = await getTrack(trackId);
        if (track) {
          setOriginalTrack(track);
        } else {
          toast({
            title: "Track Not Found",
            description: "Could not find the original track.",
            variant: "destructive",
          });
          navigate("/profile");
        }
      } catch (error) {
        console.error("Error loading track:", error);
        toast({
          title: "Error Loading Track",
          description: "There was a problem loading the track details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOriginalTrack();
  }, [trackId, navigate, toast]);

  const handleFileDrop = (droppedFile: File) => {
    console.log("File dropped:", droppedFile.name);
    setFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log("File selected:", e.target.files[0].name);
      setFile(e.target.files[0]);
    }
  };

  const handleUploadVersion = async () => {
    if (!originalTrack || !file) return;
    
    setIsUploading(true);
    
    try {
      const result = await createTrackVersion(
        originalTrack.id,
        file,
        versionNotes,
        (progress) => setUploadProgress(Math.round(progress))
      );
      
      if (result) {
        setUploadSuccess(true);
        setNewVersionId(result.id);
        toast({
          title: "Version Created",
          description: "Your new track version was uploaded successfully.",
        });
      } else {
        throw new Error("Failed to upload new version");
      }
    } catch (error) {
      console.error("Error creating track version:", error);
      toast({
        title: "Upload Failed",
        description: "There was a problem uploading your new version.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 py-12 px-4 max-w-2xl mx-auto">
          <Card className="bg-wip-darker border-wip-gray">
            <CardHeader>
              <CardTitle className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                New Version Uploaded
              </CardTitle>
              <CardDescription className="text-center text-lg">
                Your new version of "{originalTrack?.title}" has been uploaded successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-2 my-4">
                <Badge>Version {(originalTrack?.version_number || 1) + 1}</Badge>
                {versionNotes && (
                  <p className="text-sm text-gray-400 italic">"{versionNotes}"</p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  className="flex-1"
                  onClick={() => navigate("/profile")}
                  variant="outline"
                >
                  Go to Profile
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate(`/track/${newVersionId}`)}
                >
                  Open New Version
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-wip-darker border-wip-gray">
            <CardHeader>
              <CardTitle>Create New Version</CardTitle>
              <CardDescription>
                Upload a new version of "{originalTrack?.title}".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-sm font-medium mb-2">Original Track</div>
                <div className="flex items-center gap-2 p-3 border border-wip-gray rounded-md bg-wip-dark">
                  <Music className="h-5 w-5 text-wip-pink" />
                  <div>
                    <div className="font-medium">{originalTrack?.title}</div>
                    <div className="text-xs text-gray-400">{originalTrack?.original_filename}</div>
                  </div>
                  <Badge className="ml-auto">v{originalTrack?.version_number}</Badge>
                </div>
              </div>
              
              <div>
                <Label htmlFor="versionNotes">Version Notes (Optional)</Label>
                <Textarea
                  id="versionNotes"
                  placeholder="What's new in this version? (e.g., 'Fixed bassline', 'Added vocals')"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  className="mt-1 bg-wip-dark resize-none"
                />
              </div>
              
              <div>
                <div className="text-sm font-medium mb-2">Upload New Version</div>
                {!file ? (
                  <DropZone 
                    onFileDrop={handleFileDrop}
                    onFileSelect={handleFileSelect}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                  />
                ) : (
                  <div className="bg-wip-dark border border-green-500/30 rounded-lg p-6 text-center">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                    <p className="text-green-400 font-medium">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(file.size / 1048576).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="mt-4"
                    >
                      Choose Different File
                    </Button>
                  </div>
                )}
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="h-2 w-full bg-wip-gray/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wip-pink rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-400">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="mr-2"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadVersion}
                  disabled={!file || isUploading}
                  className="relative overflow-hidden"
                >
                  Create New Version
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewVersionPage;
