import React from 'react';
import { SearchResult } from '../types/business';
import { Star, Phone, Globe, MapPin, Clock, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { formatArabicNumber } from '../utils/arabicHelpers';

interface BusinessCardProps {
  business: SearchResult;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="w-4 h-4 text-gray-300" />
            <Star 
              className="w-4 h-4 text-yellow-400 fill-current absolute top-0 left-0" 
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }

    return stars;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {business.priceLevel && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {business.priceLevel}
            </span>
          )}
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            {business.category}
          </span>
        </div>
        <div className="text-right">
          <h3 className="font-semibold text-gray-900 text-lg mb-1" dir="rtl">
            {business.name}
          </h3>
          {business.rating > 0 && (
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm text-gray-600">
                ({formatArabicNumber(business.reviewCount)})
              </span>
              <span className="text-sm font-medium text-gray-900">
                {business.rating.toFixed(1)}
              </span>
              <div className="flex gap-1">
                {renderStars(business.rating)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {business.address && (
          <div className="flex items-start gap-2 text-right">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700" dir="rtl">{business.address}</span>
          </div>
        )}

        {business.phone && (
          <div className="flex items-center gap-2 text-right">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a 
              href={`tel:${business.phone}`}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              dir="ltr"
            >
              {business.phone}
            </a>
          </div>
        )}

        {business.website && (
          <div className="flex items-center gap-2 text-right">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a 
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors truncate"
            >
              زيارة الموقع
            </a>
          </div>
        )}

        {business.hours && (
          <div className="flex items-start gap-2 text-right">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 text-xs" dir="rtl">
              {business.hours.split('\n')[0]}
            </span>
          </div>
        )}

        {business.businessStatus && (
          <div className="flex items-center gap-2 text-right">
            {business.businessStatus === 'OPERATIONAL' ? (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            <span className="text-xs text-gray-600">
              {business.businessStatus === 'OPERATIONAL' ? 'نشط' : 'غير نشط'}
            </span>
          </div>
        )}

        {business.isOpen !== undefined && (
          <div className="flex items-center gap-2 text-right">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className={`text-xs ${business.isOpen ? 'text-green-600' : 'text-red-600'}`}>
              {business.isOpen ? 'مفتوح الآن' : 'مغلق الآن'}
            </span>
          </div>
        )}

        {business.googleUrl && (
          <div className="flex items-center gap-2 text-right">
            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a 
              href={business.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors text-xs"
            >
              عرض في خرائط جوجل
            </a>
          </div>
        )}
      </div>

      {business.reviews && business.reviews.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-2 text-right">آخر المراجعات:</p>
          <div className="space-y-2">
            {business.reviews.slice(0, 2).map((review, index) => (
              <div key={index} className="text-xs text-gray-600 text-right">
                <div className="flex items-center gap-1 justify-end mb-1">
                  <span>{review.author_name}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-500 line-clamp-2" dir="rtl">
                  {review.text.length > 100 ? review.text.substring(0, 100) + '...' : review.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}