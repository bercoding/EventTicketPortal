import React from 'react';
import { motion } from 'framer-motion';

const PostContent = ({ post, handleImageClick }) => (
  <div>
    <h2 className="text-xl font-bold text-gray-800 mb-2 hover:text-blue-600 cursor-pointer">
      {post.title}
    </h2>
    <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>
    {/* Images */}
    {post.images && post.images.length > 0 && (
      <div className={`grid gap-1 ${
        post.images.length === 1 ? 'grid-cols-1' :
        post.images.length === 2 ? 'grid-cols-2' :
        post.images.length === 3 ? 'grid-cols-2' :
        'grid-cols-2'
      } mb-4`}>
        {post.images.map((image, index) => {
          const isFullWidth = post.images.length === 3 && index === 0;
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className={`relative cursor-pointer overflow-hidden ${
                isFullWidth ? 'col-span-2' : ''
              } ${
                post.images.length === 1 ? 'h-[400px]' : 
                post.images.length === 2 ? 'h-[300px]' :
                isFullWidth ? 'h-[300px]' : 'h-[200px]'
              }`}
              onClick={() => handleImageClick(image)}
            >
              <img
                src={image}
                alt={`Post content ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-200" />
              {post.images.length > 4 && index === 3 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                  <span className="text-white text-2xl font-bold">
                    +{post.images.length - 4}
                  </span>
                </div>
              )}
            </motion.div>
          );
        }).slice(0, 4)}
      </div>
    )}
    {/* Tags */}
    {post.tags && post.tags.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags.map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 cursor-pointer transition-colors"
          >
            #{tag}
          </span>
        ))}
      </div>
    )}
  </div>
);

export default PostContent; 