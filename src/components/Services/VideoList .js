// VideoList.js
import React, { memo } from 'react';

const VideoList = memo(({ videos, onRemoveVideo }) => {
  console.log('🎬 VideoList component render - videos:', videos);
  console.log('🎬 VideoList component render - videos count:', videos?.length || 0);
  
  if (!Array.isArray(videos) || videos.length === 0) {
    console.log('🎬 VideoList - No videos to display');
    return (
      <div className="text-center py-4 text-purple-600">
        <p className="text-sm">Aucune vidéo ajoutée pour le moment</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-medium mb-3 text-purple-900">
        Added Videos ({videos.length})
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video, index) => {
          console.log(`🎬 VideoList - Rendering video ${index}:`, video);
          
          return (
            <VideoCard
              key={`video-${index}-${video.url}`}
              video={video}
              index={index}
              onRemove={() => onRemoveVideo(index)}
            />
          );
        })}
      </div>
    </div>
  );
});

const VideoCard = memo(({ video, index, onRemove }) => {
  console.log(`🎬 VideoCard ${index} render:`, video);
  
  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
        <video
          src={video.url}
          className="w-full h-32 object-cover"
          controls={false}
          poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iNjAiIHI9IjIwIiBmaWxsPSIjOTk5Ii8+PHBvbHlnb24gcG9pbnRzPSI5NSw1MCA5NSw3MCAyMDUsNjAiIGZpbGw9IndoaXRlIi8+PC9zdmc+"
          onError={(e) => {
            console.error(`❌ Video ${index} error:`, e);
            console.error(`❌ Video ${index} URL:`, video.url);
          }}
        />
      </div>
      
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate">
          {video.alt || `Video ${index + 1}`}
        </p>
        <p className="text-xs text-gray-500 truncate mt-1">
          {video.url}
        </p>
        <div className="flex justify-between items-center mt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            URL Video
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 p-1"
            title="Remove video"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

VideoList.displayName = 'VideoList';
VideoCard.displayName = 'VideoCard';

export default VideoList;