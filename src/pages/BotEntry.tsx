import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BotEntry = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const response = await fetch("/api/tg-posts?channel=nextwife_ai&limit=1");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
          const latestPost = data.posts[0];
          navigate(`/profile/${latestPost.id}`, { replace: true });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch latest profile:", err);
        setError(true);
      }
    };

    fetchLatestProfile();
  }, [navigate]);

  if (error) {
    return (
      <div className="bg-black flex flex-col items-center justify-center min-h-screen text-white">
        <h1 className="text-xl font-bold mb-4">No profiles available</h1>
        <button 
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full text-white font-medium"
          data-testid="button-go-home"
        >
          Browse All Profiles
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500" />
    </div>
  );
};

export default BotEntry;
