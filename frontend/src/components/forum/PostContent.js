import React from 'react';
import { motion } from 'framer-motion';

const PostContent = ({ post, handleImageClick }) => (
  <div className="space-y-4">
    {/* Title */}
    {post.title && (
      <h2 className="text-xl font-bold text-gray-900 leading-relaxed hover:text-blue-600 cursor-pointer transition-colors">
      {post.title}
    </h2>
    )}
    
    {/* Content */}
    <div className="prose prose-gray max-w-none">
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>
    </div>
    
    {/* Images */}
    {post.images && post.images.length > 0 && (
      <div className={`grid gap-2 rounded-xl overflow-hidden ${
        post.images.length === 1 ? 'grid-cols-1' :
        post.images.length === 2 ? 'grid-cols-2' :
        post.images.length === 3 ? 'grid-cols-2' :
        'grid-cols-2'
      }`}>
        {post.images.slice(0, 4).map((image, index) => {
          const isFullWidth = post.images.length === 3 && index === 0;
          const isLast = index === 3 && post.images.length > 4;
          
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer overflow-hidden rounded-lg bg-gray-100 ${
                isFullWidth ? 'col-span-2' : ''
              } ${
                post.images.length === 1 ? 'aspect-video max-h-96' : 
                post.images.length === 2 ? 'aspect-square' :
                isFullWidth ? 'aspect-video' : 'aspect-square'
              }`}
              onClick={() => handleImageClick(image)}
            >
              <img
                src={image}
                alt={`Hình ảnh ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              
              {/* More images indicator */}
              {isLast && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                  <div className="text-center">
                    <div className="text-3xl font-bold">+{post.images.length - 4}</div>
                    <div className="text-sm">Xem thêm</div>
                  </div>
                </div>
              )}
              
              {/* Image index indicator for single image */}
              {post.images.length === 1 && (
                <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                  1/1
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    )}
    
    {/* Tags */}
    {post.tags && post.tags.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag, index) => (
          <motion.span
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-medium hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all duration-200 border border-blue-200/50"
          >
            <span className="text-blue-500 mr-1">#</span>
            {tag}
          </motion.span>
        ))}
      </div>
    )}
  </div>
);

export default PostContent; 