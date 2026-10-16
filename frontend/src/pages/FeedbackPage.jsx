import { useState } from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../api';

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Actually send the data to our new backend route!
      await axios.post(`${API}/api/feedback/`, {
        rating: rating,
        comments: comments
      });

      setSubmitted(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  };

  if (submitted) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 text-center">
        <div>
          <h2 className="text-3xl font-bold text-black dark:text-white mb-2">Thank you!</h2>
          <p className="text-gray-600 dark:text-gray-400">Your feedback helps us improve PortfoliAI.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 w-full max-w-md shadow-sm transition-colors duration-300">
        <h2 className="text-2xl font-bold text-center text-black dark:text-white mb-2">Rate Your Experience</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">How was your portfolio generation?</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="focus:outline-none transition-colors"
              >
                <Star
                  className={`h-10 w-10 ${(hovered || rating) >= star ? 'fill-black dark:fill-white text-black dark:text-white' : 'text-gray-300 dark:text-gray-700'}`}
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Any comments or suggestions?</label>
            <textarea
              rows="4"
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-gray-500 resize-none transition-colors"
              placeholder="Tell us what you liked or what we could improve..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={rating === 0}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}
