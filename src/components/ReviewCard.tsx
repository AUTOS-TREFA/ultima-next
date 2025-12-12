
import React from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import { GoogleIcon, FacebookIcon, StarIcon } from './icons';

export interface Review {
    source: 'Google' | 'Facebook';
    name: string;
    avatar?: string | null;
    rating: number;
    text: string;
    date: string;
}

const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name: string): string => {
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-orange-500',
        'bg-teal-500',
        'bg-cyan-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

const ReviewCard: React.FC<{ review: Review, index: number }> = ({ review, index }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    const delay = (index % 5) * 100;
    const hasAvatar = review.avatar && review.avatar.trim() !== '';

    return (
        <div ref={ref} className="review-card-wrapper">
            <div
                className={`p-6 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${delay}ms` }}
            >
                <div className="flex items-center mb-4">
                    {hasAvatar ? (
                        <img src={review.avatar ?? undefined} alt={review.name} className="w-12 h-12 rounded-full object-cover mr-4" />
                    ) : (
                        <div className={`w-12 h-12 rounded-full mr-4 flex items-center justify-center text-white font-bold ${getAvatarColor(review.name)}`}>
                            {getInitials(review.name)}
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-gray-800">{review.name}</p>
                        <div className="flex items-center mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                        </div>
                    </div>
                </div>
                <p className="text-gray-600 text-base leading-relaxed">{review.text}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                    <span>{review.date}</span>
                    {review.source === 'Google' ? <GoogleIcon className="w-5 h-5" /> : <FacebookIcon className="w-5 h-5" />}
                </div>
            </div>
        </div>
    );
};

export default ReviewCard;
